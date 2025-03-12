import { prisma } from '@/lib/prisma';
import { PostStatus, Prisma, QuizStatus } from "@prisma/client";
import { NextResponse } from 'next/server';

// Constants for validation
const MAX_FUTURE_DAYS = 365;

export async function GET() {
  try {
    const scheduledPosts = await prisma.scheduledPost.findMany({
      include: {
        quiz: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { quizId, scheduledAt } = await req.json();

    // Validate input
    if (!quizId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduledAt);
    const now = new Date();

    // Validate if the date is in the past
    if (scheduleDate < now) {
      return NextResponse.json(
        { error: 'Cannot schedule posts in the past' },
        { status: 400 }
      );
    }

    // Validate maximum future date
    const maxFutureDate = new Date(now.getTime() + MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000);
    if (scheduleDate > maxFutureDate) {
      return NextResponse.json(
        { error: `Cannot schedule posts more than ${MAX_FUTURE_DAYS} days in advance` },
        { status: 400 }
      );
    }

    // Check for existing schedules for this quiz
    const existingSchedule = await prisma.scheduledPost.findFirst({
      where: {
        quizId,
        scheduledAt: scheduleDate,
        status: PostStatus.PENDING
      },
      include: {
        quiz: true
      }
    });

    if (existingSchedule) {
      return NextResponse.json(
        {
          error: 'Scheduling conflict',
          details: `The quiz "${existingSchedule.quiz.title}" is already scheduled for this time slot`
        },
        { status: 409 }
      );
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create new schedule
      const schedule = await tx.scheduledPost.create({
        data: {
          quizId,
          scheduledAt: scheduleDate,
          status: PostStatus.PENDING
        }
      });

      // Update quiz status to SCHEDULED if not already
      const quiz = await tx.quiz.update({
        where: { id: quizId },
        data: { status: QuizStatus.SCHEDULED }
      });

      return { schedule, quiz };
    });

    return NextResponse.json({
      success: true,
      schedule: result.schedule,
      quiz: result.quiz
    });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    // Check if it's a unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This quiz is already scheduled for this time slot' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing post ID' },
        { status: 400 }
      );
    }

    const post = await prisma.scheduledPost.findUnique({
      where: { id },
      include: { quiz: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
    }

    // Use a transaction to handle both operations
    await prisma.$transaction(async (tx) => {
      // Delete the scheduled post
      await tx.scheduledPost.delete({
        where: { id }
      });

      // Check if there are any other scheduled posts for this quiz
      const remainingPosts = await tx.scheduledPost.count({
        where: { quizId: post.quizId }
      });

      // Only update quiz status if there are no remaining scheduled posts
      if (remainingPosts === 0) {
        await tx.quiz.update({
          where: { id: post.quizId },
          data: { status: QuizStatus.READY }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
} 