import { NextResponse } from 'next/server';

// POST /api/settings/facebook/test
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appId, appSecret, pageAccessToken } = body;

    // Validate required fields
    if (!appId || !appSecret || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test the connection by making a call to Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to connect to Facebook' },
        { status: 400 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      pageId: data.id,
      pageName: data.name,
    });
  } catch (error) {
    console.error('Error testing Facebook connection:', error);
    return NextResponse.json(
      { error: 'Failed to test Facebook connection' },
      { status: 500 }
    );
  }
} 