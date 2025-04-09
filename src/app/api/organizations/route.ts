import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";

        // Get all organizations where user is a member
        const organizations = await prisma.organization.findMany({
            where: {
                members: {
                    some: {
                        userId: session.user.id,
                        // Only include accepted memberships
                        NOT: {
                            inviteStatus: "PENDING",
                        },
                    },
                },
                // Filter by search term if provided
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { slug: { contains: search, mode: "insensitive" } },
                    ],
                } : {}),
            },
            include: {
                _count: {
                    select: {
                        members: {
                            where: {
                                NOT: {
                                    inviteStatus: "PENDING",
                                },
                            },
                        },
                        quizzes: true,
                        templates: true,
                    },
                },
                members: {
                    where: {
                        userId: session.user.id,
                    },
                    select: {
                        role: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        // Transform the data to include user's role in each organization
        const transformedOrgs = organizations.map(org => ({
            ...org,
            role: org.members[0]?.role,
            members: undefined, // Remove members array
        }));

        return NextResponse.json(transformedOrgs);
    } catch (error) {
        console.error("[ORGANIZATIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Parse the request body
        const body = await req.json();
        const { name, slug: customSlug, description, website, logoUrl } = body;

        // Validate required fields
        if (!name || name.trim().length < 3) {
            return new NextResponse("Organization name must be at least 3 characters", { status: 400 });
        }

        // Generate slug from name or use custom slug if provided
        let slug = customSlug ? slugify(customSlug) : slugify(name);

        // Validate slug
        if (slug.length < 3) {
            return new NextResponse("Slug must be at least 3 characters", { status: 400 });
        }

        // Check if slug is available
        const existingOrg = await prisma.organization.findUnique({
            where: { slug },
        });

        if (existingOrg) {
            return new NextResponse("Organization with this slug already exists", { status: 400 });
        }

        // Check if user has reached organization limit
        // This could be based on subscription in the future
        const userOrgCount = await prisma.organizationMember.count({
            where: {
                userId: session.user.id,
                role: "OWNER",
            },
        });

        const maxOrganizations = 10; // Default limit, could be from user's subscription
        if (userOrgCount >= maxOrganizations) {
            return new NextResponse(
                `You have reached the maximum limit of ${maxOrganizations} organizations`,
                { status: 403 }
            );
        }

        // Create the organization with user as owner
        const organization = await prisma.organization.create({
            data: {
                name,
                slug,
                description,
                website,
                logoUrl,
                members: {
                    create: {
                        user: {
                            connect: { id: session.user.id },
                        },
                        role: "OWNER",
                        inviteStatus: "ACCEPTED", // Owner is automatically accepted
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

        return NextResponse.json({
            ...organization,
            role: "OWNER",
        });
    } catch (error) {
        console.error("[ORGANIZATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 