"use client";

import './styles.css';

// Import the CalendarPage component
import { EventDetailsModal } from '@/components/modals/EventDetailsModal';
import { QuizSelectionModal } from '@/components/modals/QuizSelectionModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { fetchApi } from '@/lib/api';
import type { PostStatus, Quiz, ScheduledPost } from '@/lib/types';
import type { EventContentArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { addDays, format, isToday, isTomorrow } from 'date-fns';
import { Activity, CalendarDays, Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, Clock, Facebook, Globe, Instagram, List, MoreHorizontal, Plus, PlusCircle, RefreshCw, Search as SearchIcon, Tag, Trash, TrendingUp, Twitter, Users, Zap } from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

// Extend ScheduledPost type to include quiz and platforms
interface ExtendedScheduledPost extends Omit<ScheduledPost, 'caption'> {
    quiz: Quiz;
    caption?: string;
    platforms?: string[]; // Add platforms field
}

export default function DashboardCalendarPage() {
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
    const [activeTab, setActiveTab] = useState("calendar");
    const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "list">("month");
    const [groupBy, setGroupBy] = useState<"date" | "status" | "type">("date");

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
            // const posts = await simulateLoading(
            //     fetchApi<ExtendedScheduledPost[]>('scheduled-posts')
            // );
            const posts = await fetchApi<ExtendedScheduledPost[]>('scheduled-posts');

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

    return (
        <div className="space-y-6">
            {/* Modern Header with Patterned Background */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                                    <CalendarIcon className="h-6 w-6 text-primary" />
                                    Publishing Calendar
                                </h1>
                                <p className="text-muted-foreground mt-1.5">
                                    Schedule and manage your quiz publications across social platforms
                                </p>
                            </div>
                            {isAuthenticated && (
                                <Button onClick={() => handleDateSelect({ start: new Date() })}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Schedule Quiz
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isAuthenticated && (
                <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>Login to schedule your own quizzes and manage the publishing calendar.</div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/auth/login?callbackUrl=/dashboard/calendar">Login</Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* New Creative Tabbed Interface */}
            <Card className="border shadow-sm">
                <CardHeader className="p-0">
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Publishing Schedule
                            </CardTitle>
                            {isAuthenticated && (
                                <Button size="sm" onClick={() => handleDateSelect({ start: new Date() })}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Schedule Quiz
                                </Button>
                            )}
                        </div>

                        <Tabs defaultValue="month" className="w-full">
                            <div className="border-b px-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <TabsList className="h-10 p-1 grid grid-cols-3 w-full sm:w-auto">
                                        <TabsTrigger value="month" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            Month
                                        </TabsTrigger>
                                        <TabsTrigger value="week" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <CalendarDays className="h-4 w-4 mr-2" />
                                            Week
                                        </TabsTrigger>
                                        <TabsTrigger value="list" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <List className="h-4 w-4 mr-2" />
                                            List
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex flex-wrap gap-2 pb-3 sm:pb-0">
                                        <div className="relative flex-grow sm:w-auto">
                                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search posts..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-9 w-full sm:w-[180px]"
                                            />
                                        </div>
                                        <Select
                                            value={typeof statusFilter === 'string' ? statusFilter.toLowerCase() : 'all'}
                                            onValueChange={(value) => setStatusFilter(value.toUpperCase() as any)}
                                        >
                                            <SelectTrigger className="h-9 w-full sm:w-[130px]">
                                                <SelectValue placeholder="Filter status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="processing">Processing</SelectItem>
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
                                                if (calendarRef.current) {
                                                    calendarRef.current.getApi().prev();
                                                }
                                            }}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-9" onClick={() => {
                                                if (calendarRef.current) {
                                                    calendarRef.current.getApi().today();
                                                }
                                            }}>
                                                Today
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
                                                if (calendarRef.current) {
                                                    calendarRef.current.getApi().next();
                                                }
                                            }}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-1">
                                <TabsContent value="month" className="p-0 m-0">
                                    <div className="calendar-controls flex items-center justify-between p-3 px-6 border-b">
                                        <div className="text-lg font-semibold" id="fc-dom-calendar-title">
                                            {/* Calendar will inject its title here */}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span>Published</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span>Pending</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span>Failed</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-0 overflow-hidden">
                                        {isLoading ? (
                                            <div className="flex justify-center items-center h-[600px]">
                                                <LoadingIndicator />
                                            </div>
                                        ) : (
                                            <div className="calendar-wrapper">
                                                <FullCalendar
                                                    ref={calendarRef}
                                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                                    initialView="dayGridMonth"
                                                    headerToolbar={false} // We're using our own header
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
                                                    datesSet={(dateInfo) => {
                                                        // Update the title in our custom header
                                                        const titleEl = document.getElementById('fc-dom-calendar-title');
                                                        if (titleEl) {
                                                            titleEl.textContent = dateInfo.view.title;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="week" className="p-0 m-0">
                                    <div className="calendar-controls flex items-center justify-between p-3 px-6 border-b">
                                        <div className="text-lg font-semibold" id="fc-dom-week-title">
                                            {/* Week view title will be injected here */}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span>Published</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span>Pending</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span>Failed</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-0 overflow-hidden">
                                        {isLoading ? (
                                            <div className="flex justify-center items-center h-[600px]">
                                                <LoadingIndicator />
                                            </div>
                                        ) : (
                                            <div className="calendar-wrapper">
                                                <FullCalendar
                                                    ref={calendarRef}
                                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                                    initialView="timeGridWeek"
                                                    headerToolbar={false}
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
                                                    datesSet={(dateInfo) => {
                                                        // Update the title in our custom header
                                                        const titleEl = document.getElementById('fc-dom-week-title');
                                                        if (titleEl) {
                                                            titleEl.textContent = dateInfo.view.title;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="day" className="p-0 m-0">
                                    <div className="calendar-controls flex items-center justify-between p-3 px-6 border-b">
                                        <div className="text-lg font-semibold" id="fc-dom-day-title">
                                            {/* Day view title will be injected here */}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span>Published</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span>Pending</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span>Failed</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-0 overflow-hidden">
                                        {isLoading ? (
                                            <div className="flex justify-center items-center h-[600px]">
                                                <LoadingIndicator />
                                            </div>
                                        ) : (
                                            <div className="calendar-wrapper">
                                                <FullCalendar
                                                    ref={calendarRef}
                                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                                    initialView="timeGridDay"
                                                    headerToolbar={false}
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
                                                    datesSet={(dateInfo) => {
                                                        // Update the title in our custom header
                                                        const titleEl = document.getElementById('fc-dom-day-title');
                                                        if (titleEl) {
                                                            titleEl.textContent = dateInfo.view.title;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="list" className="p-0 m-0">
                                    <div className="calendar-controls flex items-center justify-between p-3 px-6 border-b">
                                        <div className="text-lg font-semibold">Post List</div>
                                        <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                                            <SelectTrigger className="w-[120px] h-8">
                                                <SelectValue placeholder="Group by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="status">Status</SelectItem>
                                                <SelectItem value="type">Type</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="p-0 overflow-hidden">
                                        <ScrollArea className="h-[600px]">
                                            <div className="divide-y">
                                                {isLoading ? (
                                                    <div className="p-4">
                                                        <LoadingIndicator />
                                                    </div>
                                                ) : filteredPosts.length > 0 ? (
                                                    filteredPosts.map((post) => (
                                                        <div
                                                            key={post.id}
                                                            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedPost(post);
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                                    {post.quiz?.imageUrl ? (
                                                                        <img
                                                                            src={post.quiz.imageUrl}
                                                                            alt={post.quiz.title}
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                                                            <Image src="/placeholder-image.png" alt="Placeholder" width={24} height={24} className="h-6 w-6 text-muted-foreground" />
                                                                        </div>
                                                                    )}
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`absolute top-1 right-1 ${post.status === "PUBLISHED"
                                                                            ? "bg-green-500/10 text-green-500 border-green-200"
                                                                            : post.status === "PENDING"
                                                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-200"
                                                                                : post.status === "FAILED"
                                                                                    ? "bg-red-500/10 text-red-500 border-red-200"
                                                                                    : "bg-gray-500/10 text-gray-500 border-gray-200"
                                                                            }`}
                                                                    >
                                                                        {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-medium truncate">{post.quiz?.title}</h3>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {format(new Date(post.scheduledAt), "PPP 'at' p")}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedPost(post);
                                                                            setIsModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        No posts found
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </CardHeader>
            </Card>

            {/* New Advanced Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Content Calendar Planning */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Content Planner</CardTitle>
                                <CardDescription>
                                    Strategize your content schedule
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Content Distribution</h3>
                                <div className="h-20 w-full bg-muted/30 rounded-md p-2 flex items-end gap-1">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                                        // Random height for bars based on day
                                        const height = 20 + Math.floor(Math.random() * 55);
                                        return (
                                            <div key={day} className="flex flex-col items-center flex-1 gap-1">
                                                <div
                                                    className="w-full bg-primary/60 rounded-sm transition-all"
                                                    style={{ height: `${height}%` }}
                                                ></div>
                                                <span className="text-xs text-muted-foreground">{day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Posting Consistency</span>
                                    <span className="text-xs text-muted-foreground">Based on your schedule</span>
                                </div>
                                <div className="relative h-10 w-10">
                                    <svg className="h-10 w-10 -rotate-90">
                                        <circle
                                            cx="20"
                                            cy="20"
                                            r="15"
                                            strokeWidth="5"
                                            stroke="hsl(var(--muted))"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx="20"
                                            cy="20"
                                            r="15"
                                            strokeWidth="5"
                                            stroke="hsl(var(--primary))"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 15}
                                            strokeDashoffset={(1 - 0.68) * 2 * Math.PI * 15}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold">68%</span>
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full mt-2">View Content Strategy</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recurring Posts */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Recurring Posts</CardTitle>
                                <CardDescription>
                                    Set up automated recurring schedules
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="border rounded-md p-3 bg-muted/10 space-y-1 hover:bg-muted/20 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm">Weekly Trivia</h3>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                                        Every Mon
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Auto-publishes at 6:00 PM</p>
                            </div>

                            <div className="border rounded-md p-3 bg-muted/10 space-y-1 hover:bg-muted/20 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm">Weekend Challenge</h3>
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-200">
                                        Every Sat
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">Auto-publishes at 9:00 AM</p>
                            </div>

                            <div className="flex items-center justify-between p-2">
                                <span className="text-xs text-muted-foreground">2 active recurring schedules</span>
                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    New Schedule
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Post Ideas */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">AI Post Generator</CardTitle>
                                <CardDescription>
                                    Get AI-powered content suggestions
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H12.5C12.7761 4 13 4.22386 13 4.5C13 4.77614 12.7761 5 12.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM4 7.5C4 7.22386 4.22386 7 4.5 7H10.5C10.7761 7 11 7.22386 11 7.5C11 7.77614 10.7761 8 10.5 8H4.5C4.22386 8 4 7.77614 4 7.5ZM3 10.5C3 10.2239 3.22386 10 3.5 10H11.5C11.7761 10 12 10.2239 12 10.5C12 10.7761 11.7761 11 11.5 11H3.5C3.22386 11 3 10.7761 3 10.5Z" fill="hsl(var(--primary))" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium">Content Gaps Identified</h3>
                                    <p className="text-xs text-muted-foreground">AI detected posting gap next weekend</p>
                                </div>
                            </div>

                            <div className="border rounded-md p-3 bg-muted/5 space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground">SUGGESTED QUIZ TOPICS</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                        <span className="text-sm">Geography Challenge: Europe</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                        <span className="text-sm">Movie Trivia: 90s Classics</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm">Science Quiz: Space Exploration</span>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full">
                                Generate More Ideas
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Distribution Dashboard */}
            <Card className="border shadow-sm mt-6">
                <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Multi-Channel Distribution</CardTitle>
                            <CardDescription>
                                View publishing distribution across platforms
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-blue-500/10 border-blue-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium flex items-center">
                                            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                                            Facebook
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-200">
                                            {Math.floor(filteredPosts.length * 0.7)} posts
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        {Math.floor(filteredPosts.length * 0.7 * 100 / Math.max(filteredPosts.length, 1))}% of all content
                                    </div>
                                    <div className="h-2 bg-muted/50 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.floor(filteredPosts.length * 0.7 * 100 / Math.max(filteredPosts.length, 1))}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-pink-500/10 border-pink-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium flex items-center">
                                            <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                                            Instagram
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-pink-500/5 text-pink-600 border-pink-200">
                                            {Math.floor(filteredPosts.length * 0.5)} posts
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        {Math.floor(filteredPosts.length * 0.5 * 100 / Math.max(filteredPosts.length, 1))}% of all content
                                    </div>
                                    <div className="h-2 bg-muted/50 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-pink-500 rounded-full"
                                            style={{ width: `${Math.floor(filteredPosts.length * 0.5 * 100 / Math.max(filteredPosts.length, 1))}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-sky-500/10 border-sky-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium flex items-center">
                                            <Twitter className="h-4 w-4 mr-2 text-sky-600" />
                                            Twitter
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-sky-500/5 text-sky-600 border-sky-200">
                                            {Math.floor(filteredPosts.length * 0.3)} posts
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        {Math.floor(filteredPosts.length * 0.3 * 100 / Math.max(filteredPosts.length, 1))}% of all content
                                    </div>
                                    <div className="h-2 bg-muted/50 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-sky-500 rounded-full"
                                            style={{ width: `${Math.floor(filteredPosts.length * 0.3 * 100 / Math.max(filteredPosts.length, 1))}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-green-500/10 border-green-200">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium flex items-center">
                                            <Globe className="h-4 w-4 mr-2 text-green-600" />
                                            Website
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">
                                            {filteredPosts.length} posts
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        100% of all content
                                    </div>
                                    <div className="h-2 bg-muted/50 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: '100%' }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h3 className="text-sm font-medium mb-3">Latest Cross-Platform Publications</h3>
                            <div className="space-y-3">
                                {filteredPosts.slice(0, 3).map((post) => (
                                    <div key={post.id} className="flex items-center justify-between p-2 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                {post.quiz?.imageUrl ? (
                                                    <img
                                                        src={post.quiz.imageUrl}
                                                        alt={post.quiz.title}
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{post.quiz?.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(post.scheduledAt), "MMM d, yyyy")}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Facebook className="h-3 w-3 text-blue-500" />
                                            </div>
                                            {Math.random() > 0.3 && (
                                                <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center">
                                                    <Instagram className="h-3 w-3 text-pink-500" />
                                                </div>
                                            )}
                                            {Math.random() > 0.6 && (
                                                <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center">
                                                    <Twitter className="h-3 w-3 text-sky-500" />
                                                </div>
                                            )}
                                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Globe className="h-3 w-3 text-green-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Smart Scheduling Recommendations */}
            <Card className="border shadow-sm mt-6">
                <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" />
                                Smart Scheduling Recommendations
                            </CardTitle>
                            <CardDescription>
                                AI-powered insights to optimize your publishing schedule
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">Apply All</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        Engagement Optimization
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Optimal Posting Times</h4>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-muted/20 p-2 rounded-md">
                                                    <div className="text-xs text-muted-foreground">Monday</div>
                                                    <div className="font-medium text-sm">3:00 PM</div>
                                                </div>
                                                <div className="bg-primary/10 p-2 rounded-md border border-primary/20">
                                                    <div className="text-xs text-muted-foreground">Wednesday</div>
                                                    <div className="font-medium text-sm">5:30 PM</div>
                                                </div>
                                                <div className="bg-muted/20 p-2 rounded-md">
                                                    <div className="text-xs text-muted-foreground">Friday</div>
                                                    <div className="font-medium text-sm">7:00 PM</div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Based on your audience engagement patterns
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Schedule for Wednesday 5:30 PM
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        Audience Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Active Time by Demographic</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        <span className="text-xs">18-24 age group</span>
                                                    </div>
                                                    <span className="text-xs font-medium">8:00 PM - 11:00 PM</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                        <span className="text-xs">25-34 age group</span>
                                                    </div>
                                                    <span className="text-xs font-medium">6:00 PM - 9:00 PM</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-xs">35-44 age group</span>
                                                    </div>
                                                    <span className="text-xs font-medium">4:00 PM - 7:00 PM</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Target your primary audience for maximum reach
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Optimize for 25-34 age group
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        Content Gap Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Recommended Posting Pattern</h4>
                                            <div className="h-[100px] w-full relative overflow-hidden bg-muted/20 rounded-md">
                                                {/* Visualization of the week */}
                                                <div className="absolute inset-0 flex items-end p-2">
                                                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
                                                        const height = i === 1 || i === 3 || i === 5 ? "40%" : "15%";
                                                        return (
                                                            <div key={`${day}-${i}`} className="flex flex-col items-center flex-1">
                                                                <div className="w-full flex justify-center">
                                                                    {i === 1 || i === 3 || i === 5 ? (
                                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mb-1">
                                                                            <Zap className="h-3 w-3 text-primary-foreground" />
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                                <div className={`w-full h-[${height}] bg-muted/40 mb-1 rounded-sm`}></div>
                                                                <span className="text-xs text-muted-foreground">{day}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="absolute top-2 left-2 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                                                    Gap opportunity
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Fill content gaps on Tuesday, Thursday and Saturday
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Fill content gaps
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quiz Category Management */}
            <Card className="border shadow-sm mt-6">
                <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Tag className="h-5 w-5 text-indigo-500" />
                                Quiz Category Management
                            </CardTitle>
                            <CardDescription>
                                Organize and filter your quizzes by category
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            New Category
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200 px-3 py-1 cursor-pointer hover:bg-blue-500/20 transition-colors">
                                Trivia
                                <span className="ml-1.5 text-xs bg-blue-500/20 px-1.5 rounded-full">24</span>
                            </Badge>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200 px-3 py-1 cursor-pointer hover:bg-green-500/20 transition-colors">
                                Science
                                <span className="ml-1.5 text-xs bg-green-500/20 px-1.5 rounded-full">16</span>
                            </Badge>
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200 px-3 py-1 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                History
                                <span className="ml-1.5 text-xs bg-amber-500/20 px-1.5 rounded-full">12</span>
                            </Badge>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-200 px-3 py-1 cursor-pointer hover:bg-indigo-500/20 transition-colors">
                                Geography
                                <span className="ml-1.5 text-xs bg-indigo-500/20 px-1.5 rounded-full">8</span>
                            </Badge>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-200 px-3 py-1 cursor-pointer hover:bg-purple-500/20 transition-colors">
                                Entertainment
                                <span className="ml-1.5 text-xs bg-purple-500/20 px-1.5 rounded-full">15</span>
                            </Badge>
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-200 px-3 py-1 cursor-pointer hover:bg-rose-500/20 transition-colors">
                                Sports
                                <span className="ml-1.5 text-xs bg-rose-500/20 px-1.5 rounded-full">9</span>
                            </Badge>
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-200 px-3 py-1 cursor-pointer hover:bg-cyan-500/20 transition-colors">
                                Technology
                                <span className="ml-1.5 text-xs bg-cyan-500/20 px-1.5 rounded-full">14</span>
                            </Badge>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-200 px-3 py-1 cursor-pointer hover:bg-orange-500/20 transition-colors">
                                Food
                                <span className="ml-1.5 text-xs bg-orange-500/20 px-1.5 rounded-full">7</span>
                            </Badge>
                            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-200 px-3 py-1 cursor-pointer hover:bg-zinc-500/20 transition-colors">
                                Other
                                <span className="ml-1.5 text-xs bg-zinc-500/20 px-1.5 rounded-full">5</span>
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Popular Quiz Categories */}
                            <Card className="border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Popular Categories</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Trivia</span>
                                                <span className="text-muted-foreground">24 quizzes</span>
                                            </div>
                                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Science</span>
                                                <span className="text-muted-foreground">16 quizzes</span>
                                            </div>
                                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: '40%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Entertainment</span>
                                                <span className="text-muted-foreground">15 quizzes</span>
                                            </div>
                                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: '38%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Technology</span>
                                                <span className="text-muted-foreground">14 quizzes</span>
                                            </div>
                                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '35%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Category Schedule Overview */}
                            <Card className="border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Category Schedule</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-sm">Trivia</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last posted <span className="font-medium">2 days ago</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-sm">Science</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last posted <span className="font-medium">5 days ago</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                <span className="text-sm">Entertainment</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last posted <span className="font-medium">1 week ago</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-sm">History</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Next scheduled <span className="font-medium text-primary">Tomorrow</span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Category Schedule
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                Showing <span className="font-medium">9</span> categories with <span className="font-medium">110</span> total quizzes
                            </div>
                            <Button variant="outline" size="sm">Manage Categories</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline and Analytics remain available in separate cards if needed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Timeline</CardTitle>
                                <CardDescription>
                                    View posts in a chronological timeline
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                                {isLoading ? (
                                    <div className="p-4">
                                        <LoadingIndicator />
                                    </div>
                                ) : filteredPosts.length > 0 ? (
                                    filteredPosts.map((post) => (
                                        <div
                                            key={post.id}
                                            className="relative pl-12 pb-8 last:pb-0"
                                            onClick={() => {
                                                setSelectedPost(post);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            {/* Timeline dot */}
                                            <div className="absolute left-4 top-0 w-2 h-2 rounded-full bg-primary" />

                                            {/* Content */}
                                            <div className="bg-card rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                                <div className="flex items-start gap-4">
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                        {post.quiz?.imageUrl ? (
                                                            <img
                                                                src={post.quiz.imageUrl}
                                                                alt={post.quiz.title}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                                <Image src="/placeholder-image.png" alt="Placeholder" width={24} height={24} className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium truncate text-sm">{post.quiz?.title}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(post.scheduledAt), "PPP 'at' p")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No posts found
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Analytics</CardTitle>
                                <CardDescription>
                                    View post performance and engagement metrics
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{filteredPosts.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {filteredPosts.filter((post) => post.status === "PUBLISHED").length}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {filteredPosts.filter((post) => post.status === "PENDING").length}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
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

            {/* Enhanced Floating action panel for bulk operations */}
            {selectedPosts.length > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md shadow-lg rounded-lg border border-primary/20 flex items-center gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                    <div className="bg-primary px-5 py-3 text-primary-foreground font-medium flex items-center h-full">
                        <div className="h-7 w-7 rounded-full bg-primary-foreground/20 flex items-center justify-center mr-3">
                            <span className="text-sm font-bold">{selectedPosts.length}</span>
                        </div>
                        <span className="text-sm">{selectedPosts.length === 1 ? 'post' : 'posts'} selected</span>
                    </div>

                    {bulkOperation ? (
                        <div className="flex flex-col px-5 py-3">
                            <div className="text-sm font-medium mb-2 flex items-center">
                                <div className="animate-spin mr-2">
                                    <RefreshCw className="h-4 w-4 text-primary" />
                                </div>
                                Deleting posts...
                            </div>
                            {operationProgress && (
                                <div className="flex items-center gap-3">
                                    <div className="h-2 bg-muted rounded-full w-[180px] overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${(operationProgress.current / operationProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground">
                                        {operationProgress.current}/{operationProgress.total}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 px-5 py-2.5">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPosts([])}
                                className="border-muted-foreground/30 hover:bg-muted/50"
                            >
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleDeleteSelected}
                                className="gap-1.5 shadow-sm"
                            >
                                <Trash className="h-3.5 w-3.5" />
                                Delete Selected
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 