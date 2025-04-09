import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { token: string } }
) {
    try {
        const token = params.token;

        // Find invitation by token
        const invitation = await prisma.organizationInvitation.findUnique({
            where: {
                inviteToken: token,
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                    },
                },
                inviter: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!invitation) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        // Check if invitation is pending
        if (invitation.inviteStatus !== "PENDING") {
            return new NextResponse(`Invitation is ${invitation.inviteStatus.toLowerCase()}`, { status: 400 });
        }

        // Return invitation details
        return NextResponse.json({
            id: invitation.id,
            inviteEmail: invitation.inviteEmail,
            role: invitation.role,
            inviteStatus: invitation.inviteStatus,
            organization: invitation.organization,
            inviter: invitation.inviter,
            createdAt: invitation.createdAt,
        });
    } catch (error) {
        console.error("[INVITATION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { token: string } }
) {
    try {
        const token = params.token;
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Find invitation by token
        const invitation = await prisma.organizationInvitation.findUnique({
            where: {
                inviteToken: token,
            },
            include: {
                organization: true,
            },
        });

        if (!invitation) {
            return new NextResponse("Invitation not found", { status: 404 });
        }

        // Check if invitation is pending
        if (invitation.inviteStatus !== "PENDING") {
            return new NextResponse(`Invitation is ${invitation.inviteStatus.toLowerCase()}`, { status: 400 });
        }

        // Check if invitation email matches authenticated user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
        });

        if (!user || user.email !== invitation.inviteEmail) {
            return new NextResponse("You are not authorized to accept this invitation. It was sent to a different email address.", {
                status: 403
            });
        }

        // Start a transaction to update invitation and create membership
        const result = await prisma.$transaction(async (tx) => {
            // Update invitation status
            const updatedInvitation = await tx.organizationInvitation.update({
                where: { id: invitation.id },
                data: { inviteStatus: "ACCEPTED" },
            });

            // Check if user is already a member (unlikely but possible)
            const existingMembership = await tx.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: invitation.organizationId,
                        userId: session.user.id,
                    },
                },
            });

            if (existingMembership) {
                return {
                    success: true,
                    message: "You are already a member of this organization",
                    organization: invitation.organization,
                };
            }

            // Create new membership
            await tx.organizationMember.create({
                data: {
                    organization: { connect: { id: invitation.organizationId } },
                    user: { connect: { id: session.user.id } },
                    role: invitation.role,
                },
            });

            return {
                success: true,
                message: "You have successfully joined the organization",
                organization: invitation.organization,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[INVITATION_ACCEPT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 