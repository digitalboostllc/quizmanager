import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for validating time slot data
const timeSlotSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // Format: HH:MM
    isActive: z.boolean().optional().default(true),
});

const timeSlotIdSchema = z.object({
    id: z.string().min(1),
});

const bulkAddSchema = z.object({
    slots: z.array(timeSlotSchema),
});

// GET all time slots
export async function GET() {
    try {
        const slots = await prisma.autoScheduleSlot.findMany({
            orderBy: [
                { dayOfWeek: 'asc' },
                { timeOfDay: 'asc' },
            ],
        });

        return NextResponse.json(slots);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch time slots' },
            { status: 500 }
        );
    }
}

// POST a new time slot
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle bulk add request
        if (body.slots && Array.isArray(body.slots)) {
            const validatedData = bulkAddSchema.parse(body);

            const createdSlots = await Promise.all(
                validatedData.slots.map(async (slot) => {
                    try {
                        return await prisma.autoScheduleSlot.create({
                            data: slot,
                        });
                    } catch (error) {
                        // Skip duplicate entries
                        if (error.code === 'P2002') {
                            console.warn('Duplicate slot entry, skipping:', slot);
                            return null;
                        }
                        throw error;
                    }
                })
            );

            const successfulSlots = createdSlots.filter(Boolean);

            return NextResponse.json({
                message: `Created ${successfulSlots.length} time slots`,
                slots: successfulSlots,
            }, { status: 201 });
        }

        // Single slot add
        const validatedData = timeSlotSchema.parse(body);

        try {
            const slot = await prisma.autoScheduleSlot.create({
                data: validatedData,
            });

            return NextResponse.json(slot, { status: 201 });
        } catch (error) {
            // Handle duplicate entries gracefully
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Time slot already exists for this day and time' },
                    { status: 409 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error('Error creating time slot:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid time slot data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create time slot' },
            { status: 500 }
        );
    }
}

// PATCH to update a time slot
export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        // Validate ID
        const { id } = timeSlotIdSchema.parse(body);

        // Get updatable fields
        const { dayOfWeek, timeOfDay, isActive } = timeSlotSchema.partial().parse(body);

        // Prepare update data (only include fields that were provided)
        const updateData: any = {};
        if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
        if (timeOfDay !== undefined) updateData.timeOfDay = timeOfDay;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update the time slot
        const updatedSlot = await prisma.autoScheduleSlot.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedSlot);
    } catch (error) {
        console.error('Error updating time slot:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid update data', details: error.errors },
                { status: 400 }
            );
        }

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Time slot not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update time slot' },
            { status: 500 }
        );
    }
}

// DELETE a time slot
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Time slot ID is required' },
                { status: 400 }
            );
        }

        await prisma.autoScheduleSlot.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Time slot deleted successfully' });
    } catch (error) {
        console.error('Error deleting time slot:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Time slot not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete time slot' },
            { status: 500 }
        );
    }
} 