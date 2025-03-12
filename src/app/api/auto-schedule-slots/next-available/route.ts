import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all active slots
    const slots = await prisma.autoScheduleSlot.findMany({
      where: { isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeOfDay: 'asc' }
      ]
    });

    if (slots.length === 0) {
      return NextResponse.json(
        { error: 'No auto-schedule slots configured' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get all scheduled posts for the next 7 days
    const nextWeek = new Date(now);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lt: nextWeek
        },
        status: 'PENDING'
      },
      select: {
        scheduledAt: true
      }
    });

    // Function to check if a slot is available at a specific date
    const isSlotAvailable = (date: Date) => {
      return !scheduledPosts.some(post => {
        const postDate = new Date(post.scheduledAt);
        return postDate.getUTCFullYear() === date.getUTCFullYear() &&
               postDate.getUTCMonth() === date.getUTCMonth() &&
               postDate.getUTCDate() === date.getUTCDate() &&
               postDate.getUTCHours() === date.getUTCHours() &&
               postDate.getUTCMinutes() === date.getUTCMinutes();
      });
    };

    // Find the next available slot
    const targetDate = new Date(now);
    let daysChecked = 0;
    let foundSlot = null;

    // Look for slots up to 30 days in advance
    while (daysChecked < 30 && !foundSlot) {
      const targetDayOfWeek = targetDate.getUTCDay();
      
      // Check all slots for this day
      for (const slot of slots) {
        if (targetDayOfWeek === slot.dayOfWeek) {
          const [hours, minutes] = slot.timeOfDay.split(':').map(Number);
          const slotDate = new Date(targetDate);
          slotDate.setUTCHours(hours, minutes, 0, 0);

          // Skip slots in the past
          if (slotDate <= now) {
            continue;
          }

          // Check if this slot is available
          if (isSlotAvailable(slotDate)) {
            foundSlot = slotDate;
            break;
          }
        }
      }

      if (!foundSlot) {
        // Move to next day
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        targetDate.setUTCHours(0, 0, 0, 0);
        daysChecked++;
      }
    }

    if (!foundSlot) {
      return NextResponse.json(
        { error: 'No available slots found in the next 30 days' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scheduledAt: foundSlot.toISOString() });
  } catch (error) {
    console.error('Error finding next available slot:', error);
    return NextResponse.json(
      { error: 'Failed to find next available slot' },
      { status: 500 }
    );
  }
} 