'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

interface ScheduledPost {
  id: string;
  quizId: string;
  quiz: {
    title: string;
    imageUrl: string | null;
  };
  scheduledAt: string;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
  caption?: string;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost;
  onDelete: () => void;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  post,
  onDelete,
}: EventDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/scheduled-posts?id=${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      onDelete();
      onClose();
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Scheduled Post Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {post.quiz.imageUrl && (
              <Image
                src={post.quiz.imageUrl}
                alt={post.quiz.title}
                width={120}
                height={120}
                className="rounded-md object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-lg">{post.quiz.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.scheduledAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(post.scheduledAt).toLocaleTimeString()}
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    post.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : post.status === 'PROCESSING'
                      ? 'bg-blue-100 text-blue-800'
                      : post.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : post.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {post.status}
                </span>
              </div>
            </div>
          </div>

          {post.caption && (
            <div>
              <h4 className="text-sm font-medium mb-1">Caption</h4>
              <p className="text-sm text-muted-foreground">{post.caption}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || post.status === 'PUBLISHED'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 