import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { QuizType } from "@prisma/client";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  html: z.string().min(1, "HTML template is required"),
  css: z.string().optional(),
  quizType: z.enum(Object.values(QuizType) as [QuizType, ...QuizType[]]),
  variables: z.record(z.string(), z.any()).refine((data) => Object.keys(data).length > 0, {
    message: "At least one variable is required",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await prisma.template.create({
      data: {
        name: validatedData.name,
        html: validatedData.html,
        css: validatedData.css,
        quizType: validatedData.quizType,
        variables: validatedData.variables,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching templates:", error.message);
    } else {
      console.error("Error fetching templates:", error);
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 