'use client';

import { EventDetailsModal } from '@/components/modals/EventDetailsModal';
import { QuizSelectionModal } from '@/components/modals/QuizSelectionModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { CalendarEventSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useAuth } from '@/hooks/useAuth';
import { fetchApi } from '@/lib/api';
import type { PostStatus, Quiz, ScheduledPost } from '@/lib/types';
import type { EventContentArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { addDays, format, isToday, isTomorrow } from 'date-fns';
import { ArrowRight, CalendarDays, Clock, Filter, Plus, RefreshCw, Search, Trash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

// Extend ScheduledPost type to include quiz
interface ExtendedScheduledPost extends Omit<ScheduledPost, 'caption'> {
  quiz: Quiz;
  caption?: string;
}

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<ExtendedScheduledPost | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ExtendedScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);
  const { toast: showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<'delete' | null>(null);
  const [operationProgress, setOperationProgress] = useState<{ current: number, total: number } | null>(null);
  const { simulateLoading } = useLoadingDelay();

  const { mutate: refreshQuizzes } = useSWR<Quiz[]>('quizzes', fetchApi);

  useEffect(() => {
    // Add custom CSS for calendar events with dynamic styling
    const style = document.createElement('style');
    style.innerHTML = `
      .fc-event {
        border: none !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        overflow: hidden !important;
        transition: all 0.2s ease !important;
        margin-bottom: 3px !important;
        position: relative !important;
        min-height: 36px !important; /* Increase minimum height to accommodate time */
      }
      .fc-event:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
      }
      .fc-daygrid-event-dot {
        display: none !important;
      }
      .fc-daygrid-day.fc-day-today {
        background-color: rgba(var(--primary), 0.05) !important;
      }
      .fc-event-time {
        display: none !important;
      }
      .status-published {
        border-left: 3px solid #22c55e !important;
      }
      .status-pending {
        border-left: 3px solid #eab308 !important;
      }
      .status-failed {
        border-left: 3px solid #ef4444 !important;
      }
      .status-processing {
        border-left: 3px solid #3b82f6 !important;
      }
      .status-cancelled {
        border-left: 3px solid #6b7280 !important;
      }
      .fc-event-title {
        font-weight: 500 !important;
      }
      /* Add padding to event containers */
      .fc-daygrid-day-events {
        padding: 2px 0 !important;
      }
      /* Add spacing between events */
      .fc-daygrid-event-harness {
        margin-top: 2px !important;
        margin-bottom: 2px !important;
      }
      /* Make day cells taller to accommodate more events */
      .fc .fc-daygrid-day-frame {
        min-height: 150px !important; /* Increase height of day cells */
      }
      /* Add a subtle scroll for days with many events */
      .fc-daygrid-day-events {
        max-height: 100% !important;
        overflow-y: visible !important;
      }
      /* Ensure consistent day height */
      .fc-daygrid-day {
        height: auto !important;
      }
      /* Make calendar text slightly smaller */
      .fc {
        font-size: 0.9rem !important;
      }
      /* Event selection styles */
      .calendar-event-checkbox {
        position: absolute !important;
        top: 2px !important;
        right: 2px !important;
        z-index: 10 !important;
        opacity: 0 !important;
        transition: opacity 0.2s ease !important;
      }
      .fc-event:hover .calendar-event-checkbox,
      .calendar-event-checkbox.visible {
        opacity: 1 !important;
      }
      .fc-event.selected {
        background-color: hsl(var(--primary) / 0.18) !important;
        box-shadow: 0 2px 8px rgba(var(--primary), 0.25) !important;
      }
      /* Preserve status indicator while selected */
      .fc-event.selected.status-published {
        border-left: 3px solid #22c55e !important;
      }
      .fc-event.selected.status-pending {
        border-left: 3px solid #eab308 !important;
      }
      .fc-event.selected.status-failed {
        border-left: 3px solid #ef4444 !important;
      }
      .fc-event.selected.status-processing {
        border-left: 3px solid #3b82f6 !important;
      }
      .fc-event.selected.status-cancelled {
        border-left: 3px solid #6b7280 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchScheduledPosts = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      console.log('Calendar: Starting to load scheduled posts');

      // Apply loading delay to the fetch call
      const posts = await simulateLoading(
        fetchApi<ExtendedScheduledPost[]>('scheduled-posts')
      );

      console.log('Calendar: Loaded scheduled posts');
      setScheduledPosts(posts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load scheduled posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  // For non-authenticated users, filter to only show published posts
  // Filter scheduled posts based on search and status filter
  const filteredPosts = scheduledPosts
    .filter(post => isAuthenticated || post.status === 'PUBLISHED')
    .filter(post => statusFilter === 'ALL' || post.status === statusFilter)
    .filter(post => !searchQuery ||
      post.quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.caption && post.caption.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Get upcoming posts (next 7 days)
  const upcomingPosts = filteredPosts
    .filter(post => {
      const scheduleDate = new Date(post.scheduledAt);
      const sevenDaysLater = addDays(new Date(), 7);
      return scheduleDate >= new Date() && scheduleDate <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Calendar event handlers
  const handleEventDrop = async (arg: EventDropArg) => {
    if (!isAuthenticated) {
      showToast({
        variant: 'destructive',
        description: 'You need to be logged in to edit schedules',
      });
      arg.revert();
      return;
    }

    try {
      if (!arg.event.start) {
        showToast({
          variant: 'destructive',
          description: 'Invalid date selected',
        });
        return;
      }

      await fetchApi(`scheduled-posts/${arg.event.id}`, {
        method: 'PUT',
        body: {
          scheduledTime: arg.event.start.toISOString(),
        },
      });
      await refreshQuizzes();
      await fetchScheduledPosts();
      showToast({
        description: 'Quiz schedule updated successfully',
      });
    } catch (err) {
      console.error('Error updating schedule:', err);
      showToast({
        variant: 'destructive',
        description: 'Failed to update schedule',
      });
      // Revert drag if failed
      arg.revert();
    }
  };

  const handleDateSelect = (selectInfo: { start: Date }) => {
    if (!isAuthenticated) {
      showToast({
        variant: 'destructive',
        description: 'You need to be logged in to schedule quizzes',
      });
      return;
    }

    setSelectedDate(selectInfo.start);
    setIsModalOpen(true);
  };

  const handleEventClick = (post: ExtendedScheduledPost) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleCloseDetailsModal = () => {
    setSelectedPost(null);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const post = scheduledPosts.find(p => p.id === eventInfo.event.id);
    if (!post) return null;

    // Format time to display in 12-hour format (e.g., 2:30 PM)
    const time = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Use a more compact layout for month view
    const isMonthView = calendarRef.current?.getApi().view.type === 'dayGridMonth';

    const isSelected = selectedPosts.includes(post.id);

    // Add selected class to the event
    setTimeout(() => {
      const eventEl = document.querySelector(`.fc-event[data-event-id="${post.id}"]`);
      if (eventEl) {
        if (isSelected) {
          eventEl.classList.add('selected');
        } else {
          eventEl.classList.remove('selected');
        }
      }
    }, 10);

    if (isMonthView) {
      return (
        <div className="px-2 py-1 text-xs overflow-hidden cursor-pointer w-full">
          {isAuthenticated && (
            <div
              className={`absolute top-1 right-1 z-10 calendar-event-checkbox ${isSelected ? 'visible' : ''}`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the event click
                togglePostSelection(post.id);
              }}
            >
              <div className="relative w-4 h-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  className="peer absolute opacity-0 w-4 h-4 cursor-pointer"
                  onChange={() => { }} // React requires an onChange handler
                />
                <div className={`absolute inset-0 border-2 rounded transition-colors ${isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/50 hover:border-primary/70'
                  }`}></div>
                {isSelected && (
                  <svg className="absolute inset-0 w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {post.quiz.imageUrl && (
                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-accent">
                  <img
                    src={post.quiz.imageUrl}
                    alt={post.quiz.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, hide it
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="font-medium truncate">
                {post.quiz.title}
              </div>
            </div>
            <div className="flex items-center mt-0.5 text-[9px] text-muted-foreground">
              <span className="inline-flex items-center">
                <Clock className="mr-0.5 h-2.5 w-2.5" />
                {time}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // For other views (week view)
    return (
      <div className="p-2 overflow-hidden h-full cursor-pointer">
        {isAuthenticated && (
          <div
            className={`float-right z-10 calendar-event-checkbox ${isSelected ? 'visible' : ''}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the event click
              togglePostSelection(post.id);
            }}
          >
            <div className="relative w-5 h-5">
              <input
                type="checkbox"
                checked={isSelected}
                className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                onChange={() => { }} // React requires an onChange handler
              />
              <div className={`absolute inset-0 border-2 rounded transition-colors ${isSelected
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/50 hover:border-primary/70'
                }`}></div>
              {isSelected && (
                <svg className="absolute inset-0 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center text-xs text-primary font-medium">
          <Clock className="mr-1 h-3 w-3" />
          {time}
        </div>
        <div className="text-sm font-medium mt-1">
          {post.quiz.title}
        </div>
      </div>
    );
  };

  // Helper function to get status badge color
  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500';
      case 'PROCESSING':
        return 'bg-blue-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'CANCELLED':
        return 'bg-gray-500';
      case 'PENDING':
      default:
        return 'bg-yellow-500';
    }
  };

  // Format date for readable display
  const formatScheduleDate = (date: string | Date) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    } else if (isTomorrow(dateObj)) {
      return `Tomorrow at ${format(dateObj, 'h:mm a')}`;
    } else {
      return format(dateObj, 'MMM d, yyyy')
        + ' at '
        + format(dateObj, 'h:mm a');
    }
  };

  const handleQuizSelect = async (quiz: Quiz, scheduledAt: string) => {
    try {
      await fetchApi('scheduled-posts', {
        method: 'POST',
        body: {
          quizId: quiz.id,
          scheduledAt,
        },
      });

      showToast({
        description: 'Quiz scheduled successfully',
      });

      setIsModalOpen(false);
      await fetchScheduledPosts();
    } catch (err) {
      console.error('Error scheduling quiz:', err);
      showToast({
        variant: 'destructive',
        description: 'Failed to schedule quiz',
      });
    }
  };

  // Add bulk operation handlers
  const handleDeleteSelected = async () => {
    if (!selectedPosts.length) {
      showToast({
        description: 'No posts selected for deletion',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} scheduled posts?`)) {
      return;
    }

    setBulkOperation('delete');
    setOperationProgress({ current: 0, total: selectedPosts.length });
    setIsLoading(true);

    try {
      console.log('Deleting selected posts:', selectedPosts);

      let successCount = 0;
      let failureCount = 0;

      // Use the same endpoint format that works in the EventDetailsModal
      for (const [index, postId] of selectedPosts.entries()) {
        console.log(`Deleting post with ID: ${postId}`);

        try {
          // Notice the endpoint format: /api/scheduled-posts?id=${postId} instead of /api/scheduled-posts/${postId}
          const response = await fetch(`/api/scheduled-posts?id=${postId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`Failed to delete post ${postId}:`, error);
            failureCount++;
          } else {
            successCount++;
            console.log(`Successfully deleted post: ${postId}`);
          }
        } catch (error) {
          console.error(`Error deleting post ${postId}:`, error);
          failureCount++;
        }

        // Update progress
        setOperationProgress({ current: index + 1, total: selectedPosts.length });
      }

      // Final status message
      if (failureCount > 0) {
        showToast({
          variant: successCount > 0 ? 'default' : 'destructive',
          description: `Completed: ${successCount} posts deleted, ${failureCount} failed`,
        });
      } else {
        showToast({
          description: `Successfully deleted all ${successCount} posts`,
        });
      }

      setSelectedPosts([]);
      await fetchScheduledPosts();
    } catch (err) {
      console.error('Error deleting posts:', err);
      showToast({
        variant: 'destructive',
        description: 'Failed to delete selected posts',
      });
    } finally {
      setIsLoading(false);
      setBulkOperation(null);
      setOperationProgress(null);
    }
  };

  // Add a toggle selection function
  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      if (prev.includes(postId)) {
        return prev.filter(id => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  };

  // Add a function to select/deselect all posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      // If all are selected, deselect all
      setSelectedPosts([]);
    } else {
      // Otherwise, select all
      setSelectedPosts(filteredPosts.map(post => post.id));
    }
  };

  // Add effect to show toast notification when items are selected
  useEffect(() => {
    if (selectedPosts.length === 1) {
      toast(`1 item selected`, {
        description: "Use the bulk operations menu to perform actions",
      });
    } else if (selectedPosts.length > 1) {
      toast(`${selectedPosts.length} items selected`, {
        description: "Use the bulk operations menu to perform actions",
      });
    }
  }, [selectedPosts.length]);

  // Fix the floating panel dropdown menu
  {
    selectedPosts.length > 0 && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background/95 backdrop-blur-sm shadow-lg rounded-lg border border-primary/20 flex items-center gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
        <div className="bg-primary px-4 py-3 text-primary-foreground font-medium flex items-center h-full">
          <span className="mr-2 text-xl">{selectedPosts.length}</span>
          <span>{selectedPosts.length === 1 ? 'item' : 'items'} selected</span>
        </div>

        {bulkOperation ? (
          <div className="flex flex-col px-4 py-2">
            <div className="text-sm font-medium mb-1">
              Deleting posts...
            </div>
            {operationProgress && (
              <div className="flex items-center gap-2">
                <div className="h-2 bg-muted rounded-full w-[150px] overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(operationProgress.current / operationProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {operationProgress.current}/{operationProgress.total}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPosts([])}
              className="border-primary/30 hover:bg-primary/10"
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleDeleteSelected}
              className="gap-1 text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Add back the handleExportCalendar function
  const handleExportCalendar = () => {
    // In a real implementation, you would generate and download a calendar file
    showToast({
      description: 'Calendar export functionality coming soon',
    });
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <CalendarDays className="h-4 w-4 mr-2" />
          Content Calendar
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Publishing Calendar</h1>
            <p className="text-muted-foreground text-lg">
              {isAuthenticated
                ? "Schedule and manage your quiz posts"
                : "View upcoming quiz posts"}
            </p>
            {isAuthenticated && (
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <span className="font-medium mr-1.5">{scheduledPosts.length}</span>
                  total {scheduledPosts.length === 1 ? 'post' : 'posts'}
                </span>
                {filteredPosts.length !== scheduledPosts.length && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <span className="font-medium mr-1.5">{filteredPosts.length}</span>
                      {filteredPosts.length === 1 ? 'post' : 'posts'} shown
                    </span>
                  </>
                )}
                {selectedPosts.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="flex items-center font-medium text-primary">
                      <span className="mr-1.5">{selectedPosts.length}</span>
                      selected
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => handleDateSelect({ start: new Date() })}>
                <Plus className="mr-2 h-4 w-4" /> Schedule Quiz
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href="/auth/login?callbackUrl=/calendar">
                <ArrowRight className="mr-2 h-4 w-4" /> Login to Schedule
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>Login to schedule your own quizzes and manage the publishing calendar.</div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login?callbackUrl=/calendar">Login</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search bar and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search scheduled quizzes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAuthenticated && (
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          onClick={fetchScheduledPosts}
          className="w-full md:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>

        {isAuthenticated && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="select-all" className="flex items-center cursor-pointer text-sm px-4 py-2.5 border rounded-md hover:bg-accent/50 transition-colors bg-background shadow-sm">
              <div className="relative w-5 h-5 mr-2.5">
                <input
                  id="select-all"
                  type="checkbox"
                  className="peer absolute opacity-0 w-5 h-5"
                  checked={selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length}
                  onChange={toggleSelectAll}
                />
                <div className="absolute inset-0 border-2 rounded-md border-primary/30 peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                {selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length && (
                  <svg className="absolute inset-0 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={selectedPosts.length > 0 ? "font-medium text-primary" : ""}>
                {selectedPosts.length > 0 ? `Selected (${selectedPosts.length})` : "Select All"}
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
        {/* Full Calendar */}
        <Card className="border border-border/50">
          <CardContent className="p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-[600px]">
                <LoadingIndicator />
              </div>
            ) : (
              <div className="calendar-wrapper p-4">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek'
                  }}
                  editable={isAuthenticated}
                  selectable={isAuthenticated}
                  selectMirror={isAuthenticated}
                  dayMaxEvents={true}
                  eventMinHeight={30}
                  weekends={true}
                  events={filteredPosts.map(post => ({
                    id: post.id,
                    title: post.quiz.title,
                    start: post.scheduledAt,
                    className: `status-${post.status.toLowerCase()}`,
                    backgroundColor: getStatusColor(post.status),
                    borderColor: getStatusColor(post.status),
                  }))}
                  eventContent={renderEventContent}
                  eventClick={(info) => {
                    const post = scheduledPosts.find(p => p.id === info.event.id);
                    if (post) handleEventClick(post);
                  }}
                  select={handleDateSelect}
                  eventDrop={handleEventDrop}
                  height="auto"
                  aspectRatio={1.5}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Posts Sidebar */}
        <div className="space-y-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Upcoming Posts
              </CardTitle>
              <CardDescription>
                Next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <CalendarEventSkeleton key={i} />
                  ))}
                </div>
              ) : upcomingPosts.length > 0 ? (
                // List of upcoming posts
                <div className="space-y-3">
                  {upcomingPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleEventClick(post)}
                      className="p-3 rounded-md border border-border/50 hover:bg-accent/30 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        {/* Post image */}
                        <div className="h-14 w-14 rounded-md overflow-hidden bg-accent flex-shrink-0">
                          {post.quiz.imageUrl ? (
                            <img
                              src={post.quiz.imageUrl}
                              alt={post.quiz.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // If image fails to load, show a placeholder
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.quiz.title)}&background=random`;
                              }}
                            />
                          ) : (
                            // Show a placeholder if no image
                            <div
                              className="w-full h-full flex items-center justify-center bg-accent text-accent-foreground font-medium"
                              style={{
                                backgroundImage: `linear-gradient(45deg, ${getStatusColor(post.status)}, ${getStatusColor(post.status)}50)`
                              }}
                            >
                              {post.quiz.title.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Post details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{post.quiz.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`} />
                            <div className="text-xs text-muted-foreground">
                              {formatScheduleDate(post.scheduledAt)}
                            </div>
                          </div>

                          {/* Time display */}
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // No upcoming posts
                <div className="py-8 text-center text-muted-foreground">
                  <CalendarDays className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No upcoming posts</p>
                  {isAuthenticated && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => handleDateSelect({ start: new Date() })}
                    >
                      Schedule a quiz
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions card */}
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                {isAuthenticated ? (
                  <>
                    <span className="font-medium">Click on any date</span> to schedule a quiz for that day.
                  </>
                ) : (
                  <>
                    <span className="font-medium">Browse the calendar</span> to see upcoming quiz publications.
                  </>
                )}
              </p>
              {isAuthenticated && (
                <>
                  <p>
                    <span className="font-medium">Drag and drop events</span> to reschedule.
                  </p>
                  <p>
                    <span className="font-medium">Click on any event</span> to view details or manage it.
                  </p>
                </>
              )}
              <p>
                <span className="font-medium">Use filters</span> to find specific posts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz Selection Modal */}
      {isAuthenticated && isModalOpen && selectedDate && (
        <QuizSelectionModal
          isOpen={true}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          onSelect={(quiz, scheduledAt) => handleQuizSelect(quiz, scheduledAt)}
        />
      )}

      {/* Event Details Modal */}
      {selectedPost && (
        <EventDetailsModal
          isOpen={true}
          post={selectedPost}
          onClose={handleCloseDetailsModal}
          onDelete={fetchScheduledPosts}
        />
      )}
    </div>
  );
} 