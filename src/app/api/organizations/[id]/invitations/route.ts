import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInviteToken } from "@/lib/utils";
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

        // Only OWNER or ADMIN can view invitations
        if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get pending invitations
        const invitations = await prisma.organizationInvitation.findMany({
            where: {
                organizationId,
                inviteStatus: "PENDING",
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                inviter: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(invitations);
    } catch (error) {
        console.error("[ORGANIZATION_INVITATIONS_GET]", error);
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

        // Check if user is a member with permission to invite
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            return new NextResponse("You don't have permission to invite members", { status: 403 });
        }

        // Get organization details
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
                subscription: true,
            },
        });

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 });
        }

        // Check membership limits if subscription exists
        if (organization.subscription) {
            const maxMembers = organization.subscription.maxMembers || 5; // Default limit
            const currentMembers = organization._count.members;

            if (currentMembers >= maxMembers) {
                return new NextResponse("Organization has reached the maximum number of members", { status: 403 });
            }
        }

        // Parse the request body
        const body = await req.json();
        const { email, role } = body;

        // Validate email and role
        if (!email || !email.includes('@')) {
            return new NextResponse("Invalid email address", { status: 400 });
        }

        if (!role || !["MEMBER", "ADMIN"].includes(role)) {
            return new NextResponse("Invalid role. Must be MEMBER or ADMIN", { status: 400 });
        }

        // Check if the email is already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                user: {
                    email,
                },
            },
        });

        if (existingMember) {
            return new NextResponse("This user is already a member of the organization", { status: 400 });
        }

        // Check if there's a pending invitation
        const existingInvitation = await prisma.organizationInvitation.findFirst({
            where: {
                organizationId,
                inviteEmail: email,
                inviteStatus: "PENDING",
            },
        });

        if (existingInvitation) {
            return new NextResponse("An invitation has already been sent to this email", { status: 400 });
        }

        // Generate invitation token
        const token = await generateInviteToken();

        // Create the invitation
        const invitation = await prisma.organizationInvitation.create({
            data: {
                inviteEmail: email,
                role,
                inviteToken: token,
                organization: {
                    connect: { id: organizationId },
                },
                inviter: {
                    connect: { id: session.user.id },
                },
            },
            include: {
                inviter: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                organization: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // TODO: Send email notification to the invited user
        // This could be handled by a background job or webhook

        return NextResponse.json(invitation);
    } catch (error) {
        console.error("[ORGANIZATION_INVITATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const organizationId = params.id;
        const { searchParams } = new URL(req.url);
        const invitationId = searchParams.get('invitationId');

        if (!invitationId) {
            return new NextResponse("Missing invitationId query parameter", { status: 400 });
        }

        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is a member with permission to cancel invitations
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            return new NextResponse("You don't have permission to cancel invitations", { status: 403 });
        }

        // Get the invitation
        const invitation = await prisma.organizationInvitation.findUnique({
            where: {
                id: invitationId,
                organizationId,
            },
        });

        if (!invitation) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        // Cancel the invitation
        await prisma.organizationInvitation.update({
            where: { id: invitationId },
            data: {
                inviteStatus: "CANCELLED",
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[ORGANIZATION_INVITATIONS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 