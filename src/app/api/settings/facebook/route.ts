import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

// GET /api/settings/facebook
export async function GET() {
  try {
    const settings = await prisma.facebookSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      return NextResponse.json({ isConnected: false });
    }

    // Don't send sensitive data to the client
    return NextResponse.json({
      isConnected: settings.isConnected,
      pageId: settings.pageId,
      pageName: settings.pageName,
    });
  } catch (error) {
    console.error('Error fetching Facebook settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/facebook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appId, appSecret, pageId, pageAccessToken, pageName } = body;

    console.log('Received settings:', { 
      hasAppId: !!appId,
      hasAppSecret: !!appSecret,
      hasPageId: !!pageId,
      hasPageAccessToken: !!pageAccessToken,
      pageName
    });

    // Validate required fields
    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: pageId and pageAccessToken are required' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data before storing
    const encryptedPageAccessToken = encrypt(pageAccessToken);
    const encryptedAppSecret = appSecret ? encrypt(appSecret) : '';

    // Delete any existing settings
    await prisma.facebookSettings.deleteMany();

    // Create new settings
    const settings = await prisma.facebookSettings.create({
      data: {
        appId: appId || '',
        appSecret: encryptedAppSecret,
        pageId,
        pageAccessToken: encryptedPageAccessToken,
        pageName,
        isConnected: true,
      },
    });

    console.log('Settings saved successfully:', {
      pageId: settings.pageId,
      pageName: settings.pageName,
      isConnected: settings.isConnected
    });

    return NextResponse.json({
      isConnected: settings.isConnected,
      pageId: settings.pageId,
      pageName: settings.pageName,
    });
  } catch (error) {
    console.error('Error saving Facebook settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Facebook settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/facebook
export async function DELETE() {
  try {
    await prisma.facebookSettings.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Facebook settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete Facebook settings' },
      { status: 500 }
    );
  }
} 