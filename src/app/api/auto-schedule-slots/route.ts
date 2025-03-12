import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all auto-schedule slots
export async function GET() {
  try {
    const slots = await prisma.autoScheduleSlot.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeOfDay: 'asc' }
      ]
    });
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching auto-schedule slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto-schedule slots' },
      { status: 500 }
    );
  }
}

// Create a new auto-schedule slot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dayOfWeek, timeOfDay, isActive = true } = body;

    // Validate input
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'Day of week must be between 0 and 6' },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeOfDay)) {
      return NextResponse.json(
        { error: 'Time must be in HH:mm format' },
        { status: 400 }
      );
    }

    const slot = await prisma.autoScheduleSlot.create({
      data: {
        dayOfWeek,
        timeOfDay,
        isActive
      }
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error('Error creating auto-schedule slot:', error);
    return NextResponse.json(
      { error: 'Failed to create auto-schedule slot' },
      { status: 500 }
    );
  }
}

// Delete an auto-schedule slot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }

    await prisma.autoScheduleSlot.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auto-schedule slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete auto-schedule slot' },
      { status: 500 }
    );
  }
} 