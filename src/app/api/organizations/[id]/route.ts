import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const organizationId = params.id;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is a member of the organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Get organization details
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: {
                        members: true,
                        templates: true,
                        quizzes: true,
                    },
                },
            },
        });

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Return organization with user's role
        return NextResponse.json({
            ...organization,
            role: membership.role,
        });
    } catch (error) {
        console.error("[ORGANIZATION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const organizationId = params.id;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is a member with permission to update
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Check if user has permission (OWNER or ADMIN)
        if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
            return new NextResponse("You don't have permission to update this organization", { status: 403 });
        }

        // Parse the request body
        const body = await req.json();
        const { name, description, website, logoUrl } = body;

        // Validate updated fields
        if (name && name.trim().length < 3) {
            return new NextResponse("Organization name must be at least 3 characters", { status: 400 });
        }

        // Check if the organization exists
        const existingOrg = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!existingOrg) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Update the organization
        const updatedOrg = await prisma.organization.update({
            where: { id: organizationId },
            data: {
                name: name || undefined,
                description,
                website,
                logoUrl,
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        templates: true,
                        quizzes: true,
                    },
                },
            },
        });

        // Return updated organization with user's role
        return NextResponse.json({
            ...updatedOrg,
            role: membership.role,
        });
    } catch (error) {
        console.error("[ORGANIZATION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const organizationId = params.id;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is the organization owner
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership || membership.role !== "OWNER") {
            return new NextResponse("You don't have permission to delete this organization", { status: 403 });
        }

        // Get organization details
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: {
                        quizzes: true,
                        templates: true,
                    },
                },
            },
        });

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Optional: Add additional safety checks, like confirming deletion with a token or password

        // Delete the organization (this will cascade delete members)
        await prisma.organization.delete({
            where: { id: organizationId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[ORGANIZATION_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 