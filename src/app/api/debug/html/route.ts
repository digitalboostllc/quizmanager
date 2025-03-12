import { NextResponse } from "next/server";
import { analyzeDebugHtmlFiles, readDebugHtmlFile } from "@/lib/debug";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');

    // If a filename is provided, return the content of that file
    if (filename) {
      const content = await readDebugHtmlFile(filename);
      if (!content) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }
      
      // Return the HTML content with the correct content type
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Otherwise, return a list of all HTML files
    const files = await analyzeDebugHtmlFiles();
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error accessing debug HTML files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 