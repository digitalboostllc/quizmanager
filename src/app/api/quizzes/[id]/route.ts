import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            quizType: true,
            html: true,
            css: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const body = await request.json();

    // Update quiz
    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.variables && { variables: body.variables }),
        ...(body.templateId && { templateId: body.templateId }),
        ...(body.answer && { answer: body.answer }),
        ...(body.solution !== undefined && { solution: body.solution }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            quizType: true,
            html: true,
            css: true,
          },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    // First check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Delete the image file if it exists
    if (quiz.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'public', quiz.imageUrl);
        await fs.unlink(imagePath);
        console.log('Successfully deleted image file:', imagePath);
      } catch (error) {
        // Log error but continue with quiz deletion
        console.error('Error deleting image file:', error);
      }
    }

    // Use a transaction to handle both operations
    await prisma.$transaction(async (tx) => {
      // Delete all associated scheduled posts first
      await tx.scheduledPost.deleteMany({
        where: { quizId: id }
      });

      // Then delete the quiz
      await tx.quiz.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 