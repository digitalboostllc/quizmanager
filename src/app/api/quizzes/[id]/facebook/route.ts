import { FacebookService } from "@/lib/facebook";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    console.log('Processing Facebook post for quiz:', { id });

    if (!id) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Get the quiz with its template
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    console.log('Quiz data:', {
      id: quiz?.id,
      title: quiz?.title,
      hasImage: !!quiz?.imageUrl,
      imageUrl: quiz?.imageUrl,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    if (!quiz.imageUrl) {
      return NextResponse.json(
        { error: "Quiz image is required for Facebook posting" },
        { status: 400 }
      );
    }

    // In development, use the relative path
    // In production, use the absolute URL
    const imageUrl = process.env.NODE_ENV === 'development'
      ? quiz.imageUrl  // Pass the relative path
      : quiz.imageUrl.startsWith('http')
        ? quiz.imageUrl
        : `${process.env.NEXT_PUBLIC_APP_URL}${quiz.imageUrl}`;

    console.log('Final image URL:', {
      originalUrl: quiz.imageUrl,
      processedUrl: imageUrl,
      isAbsolute: quiz.imageUrl.startsWith('http'),
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV
    });

    // Create Facebook post
    const fbPostId = await FacebookService.createPost({
      message: `🧩 Quiz Time! 🤔\n\n${quiz.title}\n\nCan you solve it? Share your answer in the comments! 👇`,
      imageUrl,
    });

    // Update or create a scheduled post entry (for tracking)
    const now = new Date();
    await prisma.scheduledPost.upsert({
      where: {
        id: await prisma.scheduledPost.findFirst({
          where: { quizId: quiz.id },
          select: { id: true }
        }).then(post => post?.id ?? 'new'),
      },
      update: {
        publishedAt: now,
        status: "PUBLISHED",
        fbPostId,
      },
      create: {
        quizId: quiz.id,
        scheduledAt: now,
        publishedAt: now,
        status: "PUBLISHED",
        fbPostId,
      },
    });

    // Update quiz status
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
      include: {
        template: true,
        scheduledPost: true,
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    return NextResponse.json(
      { error: "Failed to post to Facebook", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 