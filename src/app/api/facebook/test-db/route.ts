import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export async function GET() {
  try {
    // Get the latest Facebook settings
    const settings = await prisma.facebookSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings || !settings.isConnected) {
      return NextResponse.json({ 
        error: "Facebook integration is not configured",
        hasSettings: !!settings,
        isConnected: settings?.isConnected
      }, { status: 400 });
    }

    // Decrypt the page access token
    const pageAccessToken = decrypt(settings.pageAccessToken);

    // Test the token by getting basic page info
    const pageUrl = `https://graph.facebook.com/v18.0/${settings.pageId}?fields=name,id&access_token=${pageAccessToken}`;
    
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      return NextResponse.json({ 
        error: pageData.error,
        details: "Failed to fetch page data"
      }, { status: 400 });
    }

    return NextResponse.json({
      message: "Successfully connected to Facebook page",
      page: {
        id: pageData.id,
        name: pageData.name
      },
      settings: {
        isConnected: settings.isConnected,
        pageId: settings.pageId,
        pageName: settings.pageName
      }
    });

  } catch (error) {
    console.error("Error testing Facebook connection:", error);
    return NextResponse.json(
      { error: "Failed to test Facebook connection", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 