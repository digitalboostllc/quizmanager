import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user exists and is an admin
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortDirection = searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const page = parseInt(searchParams.get("page") || "1");

        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // Build the where clause for search
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};

        // Get organizations with pagination and sorting
        const [organizations, totalCount] = await Promise.all([
            prisma.organization.findMany({
                where,
                orderBy: { [sortBy]: sortDirection },
                skip,
                take: pageSize,
                include: {
                    _count: {
                        select: {
                            members: true,
                            templates: true,
                            quizzes: true,
                        },
                    },
                    subscription: {
                        select: {
                            id: true,
                            status: true,
                            planId: true,
                        },
                    },
                },
            }),
            prisma.organization.count({ where }),
        ]);

        // Calculate pagination details
        const totalPages = Math.ceil(totalCount / pageSize);

        return NextResponse.json({
            organizations,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error("[ADMIN_ORGANIZATIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user exists and is an admin
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Parse the request body
        const body = await req.json();
        const { name, slug, description, website, logoUrl, planId, ownerId } = body;

        // Validate required fields
        if (!name || !slug) {
            return new NextResponse("Name and slug are required", { status: 400 });
        }

        // Check if slug is unique
        const existingOrg = await prisma.organization.findUnique({
            where: { slug },
        });

        if (existingOrg) {
            return new NextResponse("Organization with this slug already exists", { status: 400 });
        }

        // Verify owner exists
        if (ownerId) {
            const owner = await prisma.user.findUnique({
                where: { id: ownerId },
            });

            if (!owner) {
                return new NextResponse("Owner not found", { status: 400 });
            }
        }

        // Create the organization
        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                description,
                website,
                logoUrl,
                planId,
                members: {
                    create: {
                        userId: ownerId || session.user.id,
                        role: "OWNER",
                    },
                },
            },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return NextResponse.json(organization);
    } catch (error) {
        console.error("[ADMIN_ORGANIZATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 