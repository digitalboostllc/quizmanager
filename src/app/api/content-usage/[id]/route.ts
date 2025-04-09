import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/content-usage/:id
 * Retrieves a specific content usage item
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { error: "Content ID is required" },
                { status: 400 }
            );
        }

        // Find the content usage item
        const item = await db.contentUsage.findUnique({
            where: { id },
        });

        if (!item) {
            return NextResponse.json(
                { error: "Content usage not found" },
                { status: 404 }
            );
        }

        // Check ownership
        if (item.userId !== user.id) {
            return NextResponse.json(
                { error: "You don't have permission to access this content" },
                { status: 403 }
            );
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error fetching content usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch content usage" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/content-usage/:id
 * Updates a content usage item
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { error: "Content ID is required" },
                { status: 400 }
            );
        }

        // Get the request body
        const body = await req.json();
        const { isUsed, metadata } = body;

        // Find the content usage item first
        const existingItem = await db.contentUsage.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json(
                { error: "Content usage not found" },
                { status: 404 }
            );
        }

        // Check ownership
        if (existingItem.userId !== user.id) {
            return NextResponse.json(
                { error: "You don't have permission to update this content" },
                { status: 403 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (isUsed !== undefined) {
            updateData.isUsed = isUsed;
            // Update usedAt timestamp when marking as used
            if (isUsed) {
                updateData.usedAt = new Date();
            }
        }

        if (metadata !== undefined) {
            updateData.metadata = metadata;
        }

        // Update the content usage item
        const updatedItem = await db.contentUsage.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Error updating content usage:", error);
        return NextResponse.json(
            { error: "Failed to update content usage" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/content-usage/:id
 * Deletes a content usage item
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { error: "Content ID is required" },
                { status: 400 }
            );
        }

        // Find the content usage item first
        const existingItem = await db.contentUsage.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json(
                { error: "Content usage not found" },
                { status: 404 }
            );
        }

        // Check ownership
        if (existingItem.userId !== user.id) {
            return NextResponse.json(
                { error: "You don't have permission to delete this content" },
                { status: 403 }
            );
        }

        // Delete the content usage item
        await db.contentUsage.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Content usage deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting content usage:", error);
        return NextResponse.json(
            { error: "Failed to delete content usage" },
            { status: 500 }
        );
    }
} 