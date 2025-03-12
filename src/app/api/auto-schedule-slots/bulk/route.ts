import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  operation: z.enum(['deleteByDay', 'deleteByTime', 'deleteInactive']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const bulkToggleSchema = z.object({
  operation: z.literal('toggleByDay'),
  dayOfWeek: z.number().min(0).max(6),
  isActive: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.operation === 'toggleByDay') {
      const { dayOfWeek, isActive } = bulkToggleSchema.parse(body);

      await prisma.autoScheduleSlot.updateMany({
        where: { dayOfWeek },
        data: { isActive }
      });

      return NextResponse.json({
        message: `Successfully ${isActive ? 'activated' : 'deactivated'} all slots for the selected day`
      });
    }

    const { operation, dayOfWeek, timeOfDay } = bulkDeleteSchema.parse(body);

    switch (operation) {
      case 'deleteByDay': {
        if (typeof dayOfWeek !== 'number') {
          return NextResponse.json(
            { error: 'Day of week is required for this operation' },
            { status: 400 }
          );
        }

        const { count } = await prisma.autoScheduleSlot.deleteMany({
          where: { dayOfWeek }
        });

        return NextResponse.json({
          message: `Successfully deleted ${count} slots for the selected day`
        });
      }

      case 'deleteByTime': {
        if (!timeOfDay) {
          return NextResponse.json(
            { error: 'Time of day is required for this operation' },
            { status: 400 }
          );
        }

        const { count } = await prisma.autoScheduleSlot.deleteMany({
          where: { timeOfDay }
        });

        return NextResponse.json({
          message: `Successfully deleted ${count} slots for the selected time`
        });
      }

      case 'deleteInactive': {
        const { count } = await prisma.autoScheduleSlot.deleteMany({
          where: { isActive: false }
        });

        return NextResponse.json({
          message: `Successfully deleted ${count} inactive slots`
        });
      }
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
} 