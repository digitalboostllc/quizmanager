import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  html: z.string().min(1, "HTML template is required"),
  css: z.string().optional(),
  variables: z.record(z.string(), z.string()).refine((data) => Object.keys(data).length > 0, {
    message: "At least one variable is required",
  }),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await prisma.template.update({
      where: {
        id,
      },
      data: {
        name: validatedData.name,
        html: validatedData.html,
        css: validatedData.css,
        variables: validatedData.variables,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const template = await prisma.template.findUnique({
      where: {
        id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // First check if the template exists
    const template = await prisma.template.findUnique({
      where: { id },
      include: { quizzes: true }
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Delete all associated quizzes first
    if (template.quizzes.length > 0) {
      await prisma.quiz.deleteMany({
        where: {
          templateId: id
        }
      });
    }

    // Delete the template
    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Template and associated quizzes deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 