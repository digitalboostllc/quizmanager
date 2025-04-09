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

        // Get all organization members
        const members = await prisma.organizationMember.findMany({
            where: {
                organizationId,
                inviteStatus: "ACCEPTED", // Only include accepted members
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json(members.map(member => ({
            ...member,
            joinedAt: member.createdAt,
        })));
    } catch (error) {
        console.error("[ORGANIZATION_MEMBERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
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

        // Check if user has permission to add members
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

        if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
            return new NextResponse("You don't have permission to add members", { status: 403 });
        }

        // Parse the request body
        const body = await req.json();
        const { userId, role } = body;

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is already a member
        const existingMembership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });

        if (existingMembership) {
            return new NextResponse("User is already a member of this organization", { status: 400 });
        }

        // Add user to organization
        const newMembership = await prisma.organizationMember.create({
            data: {
                organizationId,
                userId,
                role: role || "MEMBER",
                inviteStatus: "ACCEPTED", // Direct add without invitation
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(newMembership);
    } catch (error) {
        console.error("[ORGANIZATION_MEMBERS_POST]", error);
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

        const url = new URL(req.url);
        const memberUserId = url.searchParams.get("userId");

        if (!memberUserId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        // Check if user is the organization owner or the user being removed
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

        // Get the member being removed
        const memberToRemove = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: memberUserId,
                },
            },
        });

        if (!memberToRemove) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Check permissions
        const isSelf = session.user.id === memberUserId;
        const isOwner = membership.role === "OWNER";
        const isAdmin = membership.role === "ADMIN";
        const targetIsOwner = memberToRemove.role === "OWNER";

        // Only owners can remove owners
        // Admins can remove regular members but not owners
        // Users can remove themselves
        if (!(isSelf || (isOwner) || (isAdmin && !targetIsOwner))) {
            return new NextResponse("You don't have permission to remove this member", { status: 403 });
        }

        // Count owners to ensure at least one owner remains
        if (targetIsOwner) {
            const ownerCount = await prisma.organizationMember.count({
                where: {
                    organizationId,
                    role: "OWNER",
                },
            });

            if (ownerCount <= 1) {
                return new NextResponse(
                    "Cannot remove the last owner. Transfer ownership to another member first.",
                    { status: 400 }
                );
            }
        }

        // Remove the member
        await prisma.organizationMember.delete({
            where: {
                id: memberToRemove.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[ORGANIZATION_MEMBERS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 