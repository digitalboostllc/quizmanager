'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/api';
import type { Quiz } from '@/lib/types';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface QuizSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (quiz: Quiz, scheduledAt: string) => void;
  selectedDate: Date;
}

export function QuizSelectionModal({ isOpen, onClose, onSelect, selectedDate }: QuizSelectionModalProps) {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!selectedDate) return;

      setIsLoading(true);
      try {
        console.log('Fetching slots for date:', selectedDate.toISOString());
        const slots = await fetchApi<string[]>(`slots/available?date=${selectedDate.toISOString()}`);
        console.log('Received slots:', slots);

        // Ensure slots is an array
        const availableSlots = Array.isArray(slots) ? slots : [];
        setAvailableSlots(availableSlots);

        // Reset the selected slot and set a new one if available
        setSelectedSlot(undefined);
        if (availableSlots.length > 0) {
          setSelectedSlot(availableSlots[0]);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
        setAvailableSlots([]);
        toast({
          title: 'Error',
          description: 'Failed to fetch available slots',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && selectedDate) {
      fetchAvailableSlots();
    } else {
      // Reset state when modal closes
      setAvailableSlots([]);
      setSelectedSlot(undefined);
    }
  }, [isOpen, selectedDate, toast]);

  useEffect(() => {
    async function loadQuizzes() {
      setIsLoading(true);
      try {
        const data = await fetchApi<Quiz[]>('quizzes');
        // Filter quizzes to only include those with status READY
        const availableQuizzes = Array.isArray(data)
          ? data.filter(quiz => quiz.status === 'READY')
          : [];
        setQuizzes(availableQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setQuizzes([]);
        toast({
          title: 'Error',
          description: 'Failed to fetch quizzes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen) {
      loadQuizzes();
    } else {
      // Reset state when modal closes
      setQuizzes([]);
    }
  }, [isOpen, toast]);

  const handleSelect = async (quiz: Quiz) => {
    if (!selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select a time slot',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a new Date object with the selected date and time
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(':').map(Number);

      scheduledDateTime.setHours(hours, minutes, 0, 0);
      console.log('Scheduling quiz for:', scheduledDateTime.toISOString());

      // Pass the quiz and the properly formatted date to the parent's onSelect
      onSelect(quiz, scheduledDateTime.toISOString());
      onClose();
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule the quiz',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Quiz to Schedule</DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {selectedDate.toLocaleDateString()}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="flex gap-2 mb-4">
            <Select
              value={selectedSlot}
              onValueChange={(value) => {
                setSelectedSlot(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot} UTC
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mb-4 p-4 border rounded-md bg-muted/20">
            No available time slots for this day. Please select another day.
          </div>
        )}

        {selectedSlot && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {quizzes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground p-4 border rounded-md bg-muted/20">
                No quizzes available for scheduling. Please create a quiz with READY status first.
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-secondary cursor-pointer"
                  onClick={() => handleSelect(quiz)}
                >
                  {quiz.imageUrl && (
                    <Image
                      src={quiz.imageUrl}
                      alt={quiz.title}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">Status: {quiz.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!selectedSlot && quizzes.length > 0 && availableSlots.length > 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Please select a time slot above to view available quizzes.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 