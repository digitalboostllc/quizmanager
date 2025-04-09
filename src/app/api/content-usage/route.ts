import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Cache control constants
const CACHE_CONTROL = {
    NO_CACHE: "no-cache, no-store, must-revalidate",
    SHORT: "max-age=60, s-maxage=60, stale-while-revalidate=300",
    MEDIUM: "max-age=300, s-maxage=300, stale-while-revalidate=600",
};

/**
 * GET /api/content-usage
 * Retrieves content usage with filtering and pagination
 */
export async function GET(req: NextRequest) {
    try {
        // Get user from session (for permissions)
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query parameters
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || undefined;
        const contentType = url.searchParams.get("contentType") as ContentType | undefined;
        const isUsedParam = url.searchParams.get("isUsed");
        const isUsed = isUsedParam ? isUsedParam === "true" : undefined;
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        // Build filter object
        const where = {
            userId: user.id,
            ...(contentType && { contentType }),
            ...(isUsed !== undefined && { isUsed }),
            ...(search && {
                OR: [
                    { value: { contains: search, mode: "insensitive" } },
                    { format: { contains: search, mode: "insensitive" } },
                ],
            }),
        };

        // Execute queries
        const [items, total, stats] = await Promise.all([
            // Get paginated items
            db.contentUsage.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
            }),

            // Get total count for pagination
            db.contentUsage.count({ where }),

            // Get statistics
            db.$transaction([
                // Total content count
                db.contentUsage.count({ where: { userId: user.id } }),

                // Used content count
                db.contentUsage.count({ where: { userId: user.id, isUsed: true } }),

                // Unused content count
                db.contentUsage.count({ where: { userId: user.id, isUsed: false } }),

                // Count by type
                db.contentUsage.groupBy({
                    by: ["contentType"],
                    where: { userId: user.id },
                    _count: true,
                    orderBy: {
                        _count: {
                            contentType: "desc",
                        },
                    },
                }),
            ]),
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);

        // Format response
        const response = {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            stats: {
                total: stats[0],
                used: stats[1],
                unused: stats[2],
                byType: stats[3],
            },
        };

        return NextResponse.json(response, {
            headers: {
                "Cache-Control": CACHE_CONTROL.NO_CACHE,
            },
        });
    } catch (error) {
        console.error("Error fetching content usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch content usage" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/content-usage
 * Add new content to the system
 */
export async function POST(req: NextRequest) {
    try {
        // Get user from session
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body = await req.json();
        const { contentType, value, format, metadata, isUsed = true } = body;

        // Validate required fields
        if (!contentType || !value) {
            return NextResponse.json(
                { error: "Content type and value are required" },
                { status: 400 }
            );
        }

        // Validate content type
        if (!Object.values(ContentType).includes(contentType)) {
            return NextResponse.json(
                { error: "Invalid content type" },
                { status: 400 }
            );
        }

        // Check if content already exists
        const existingContent = await db.contentUsage.findFirst({
            where: {
                userId: user.id,
                contentType,
                value,
                format: format || null,
            },
        });

        if (existingContent) {
            return NextResponse.json(
                { error: "This content already exists", item: existingContent },
                { status: 409 }
            );
        }

        // Create new content usage
        const newItem = await db.contentUsage.create({
            data: {
                userId: user.id,
                contentType,
                value,
                format: format || null,
                metadata: metadata || {},
                isUsed,
            },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("Error creating content usage:", error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "This content already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create content usage" },
            { status: 500 }
        );
    }
} 