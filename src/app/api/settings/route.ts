import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  autoScheduleEnabled: z.boolean(),
});

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          autoScheduleEnabled: true
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...validatedData
      },
      update: validatedData
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 