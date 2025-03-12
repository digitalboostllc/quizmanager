import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FacebookService } from '@/lib/facebook';

// This endpoint should be called by a cron job every minute
export async function GET() {
  try {
    // Get all pending posts that are due
    const pendingPosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: new Date(), // Posts that are due or overdue
        },
      },
      include: {
        quiz: true,
      },
      take: 5, // Process 5 posts at a time to avoid overload
    });

    const results = [];

    for (const post of pendingPosts) {
      try {
        // Mark as processing
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: 'PROCESSING' },
        });

        // Create Facebook post
        const fbPostId = await FacebookService.createPost({
          message: post.caption || `Quiz: ${post.quiz.title}`,
          imageUrl: post.quiz.imageUrl!,
          scheduledTime: post.scheduledAt.toISOString(),
        });

        // Mark as published
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            fbPostId,
            publishedAt: new Date(),
          },
        });

        results.push({
          id: post.id,
          status: 'success',
          fbPostId,
        });
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);

        // Update retry count and status
        const updatedPost = await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
            lastRetryAt: new Date(),
          },
        });

        results.push({
          id: post.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: updatedPost.retryCount,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
} 