import { prisma } from '@/lib/prisma';
import { addHours, endOfDay, format, setHours, setMinutes, startOfDay } from 'date-fns';
import { NextResponse } from 'next/server';

interface ScheduleWithTime {
    scheduledAt: Date;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        if (!dateParam) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const selectedDate = new Date(dateParam);
        console.log('Selected date:', selectedDate);

        // Get the day start and end in UTC
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);

        console.log('Day start:', dayStart);
        console.log('Day end:', dayEnd);

        // Find all existing scheduled posts for this day
        const existingSchedules = await prisma.scheduledPost.findMany({
            where: {
                scheduledAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            },
            select: {
                scheduledAt: true
            }
        });

        console.log('Existing schedules:', existingSchedules);

        // Create scheduled times starting from 9 AM to 9 PM with 1-hour intervals
        const scheduledTimes: string[] = [];
        const bookedTimes = new Set(existingSchedules.map((schedule: ScheduleWithTime) =>
            format(new Date(schedule.scheduledAt), 'HH:mm')
        ));

        console.log('Booked times:', Array.from(bookedTimes));

        // Generate available slots from 9 AM to 9 PM with 1-hour intervals
        let currentTime = setHours(setMinutes(dayStart, 0), 9); // Start at 9 AM
        const endTime = setHours(setMinutes(dayStart, 0), 21);  // End at 9 PM

        while (currentTime <= endTime) {
            const timeStr = format(currentTime, 'HH:mm');

            if (!bookedTimes.has(timeStr)) {
                scheduledTimes.push(timeStr);
            }

            currentTime = addHours(currentTime, 1);
        }

        console.log('Available times:', scheduledTimes);
        return NextResponse.json(scheduledTimes);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available slots' },
            { status: 500 }
        );
    }
} 