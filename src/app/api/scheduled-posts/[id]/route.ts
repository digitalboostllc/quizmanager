import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PostStatus, Prisma } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const { scheduledAt } = await request.json();

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Missing scheduledAt field' },
        { status: 400 }
      );
    }

    const newScheduleDate = new Date(scheduledAt);

    // Validate if the date is in the past
    if (newScheduleDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule posts in the past' },
        { status: 400 }
      );
    }

    // Find the post first to check if it exists and is in PENDING status
    const existingPost = await prisma.scheduledPost.findUnique({
      where: { id },
      include: { quiz: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    if (existingPost.status !== PostStatus.PENDING) {
      return NextResponse.json(
        { error: 'Only pending posts can be rescheduled' },
        { status: 400 }
      );
    }

    // Check for existing posts at the same time for the same quiz
    const conflictingPost = await prisma.scheduledPost.findFirst({
      where: {
        AND: [
          { quizId: existingPost.quizId },
          { scheduledAt: newScheduleDate },
          { id: { not: id } } // Exclude the current post
        ]
      }
    });

    if (conflictingPost) {
      return NextResponse.json(
        { 
          error: 'Scheduling conflict',
          details: `The quiz "${existingPost.quiz.title}" is already scheduled for this time slot`,
          conflictingPost
        },
        { status: 409 }
      );
    }

    // Update the post
    const updatedPost = await prisma.scheduledPost.update({
      where: { id },
      data: {
        scheduledAt: newScheduleDate
      },
      include: {
        quiz: true
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    
    // Handle Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Scheduling conflict',
          details: 'This time slot is already taken by another post for this quiz'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
} 