import { NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function GET() {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Test the OpenAI client with a simple request
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a test assistant."
          },
          {
            role: "user",
            content: "Test connection.",
          }
        ],
        temperature: 0.7,
      });

      if (completion.choices[0]?.message?.content) {
        return NextResponse.json({
          status: "ok",
          message: "OpenAI API is properly configured and working"
        });
      } else {
        throw new Error("Invalid response from OpenAI API");
      }
    } catch (error) {
      console.error('Error testing OpenAI API:', error);
      return NextResponse.json(
        { error: "Failed to connect to OpenAI API", details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in configuration check:", error);
    return NextResponse.json(
      { error: "Failed to check configuration", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 