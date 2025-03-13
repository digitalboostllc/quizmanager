import { trackPerformance } from '@/lib/monitoring';
import { ApiError } from '@/services/api/errors/ApiError';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for test request
const testSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  appSecret: z.string().min(1, "App Secret is required"),
  pageAccessToken: z.string().min(1, "Page Access Token is required")
});

// POST /api/settings/facebook/test
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestPath = req.nextUrl.pathname;
  const method = req.method;

  try {
    const body = await req.json();

    // Validate input
    const validatedData = await testSchema.parseAsync(body);
    const { appId, appSecret, pageAccessToken } = validatedData;

    // Test the connection by making a call to Facebook Graph API
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${pageAccessToken}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 0 } // Disable caching for this request
        }
      );

      if (!response.ok) {
        const error = await response.json();
        const errorResponse = NextResponse.json(
          {
            error: error.error?.message || 'Failed to connect to Facebook',
            code: 'FACEBOOK_CONNECTION_ERROR',
            details: error.error
          },
          { status: 400 }
        );
        trackPerformance(errorResponse, requestPath, method, startTime, false, 'Facebook connection error');
        return errorResponse;
      }

      const data = await response.json();

      const apiResponse = NextResponse.json({
        success: true,
        pageId: data.id,
        pageName: data.name,
      });
      trackPerformance(apiResponse, requestPath, method, startTime);
      return apiResponse;

    } catch (error) {
      console.error('Error connecting to Facebook:', error);
      const errorResponse = NextResponse.json(
        {
          error: 'Failed to connect to Facebook API',
          code: 'FACEBOOK_API_ERROR',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 503 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Facebook API error');
      return errorResponse;
    }
  } catch (error) {
    console.error('Error testing Facebook connection:', error);

    let statusCode = 500;
    let errorMessage = 'Failed to test Facebook connection';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error instanceof z.ZodError) {
      statusCode = 400;
      errorMessage = 'Invalid input data';
      errorCode = 'VALIDATION_ERROR';
    } else if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
    );
    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 