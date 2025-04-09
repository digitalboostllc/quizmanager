import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Parse the request body
        const body = await req.json();
        const { returnUrl } = body;

        if (!returnUrl) {
            return new NextResponse("Missing returnUrl", { status: 400 });
        }

        // Find the user's organizations where they are an owner or admin
        const memberships = await prisma.organizationMember.findMany({
            where: {
                userId: session.user.id,
                role: {
                    in: ["OWNER", "ADMIN"],
                },
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        customerId: true,
                        name: true,
                    },
                },
            },
        });

        // Find organization with a Stripe customer ID
        const orgWithCustomerId = memberships.find(
            (m) => m.organization.customerId
        );

        if (!orgWithCustomerId?.organization.customerId) {
            // If no organization has a customer ID, the user doesn't have a subscription
            return new NextResponse("No subscription found", { status: 404 });
        }

        // Create a Billing Portal session
        const portalSession = await createBillingPortalSession({
            customerId: orgWithCustomerId.organization.customerId,
            returnUrl,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error("[BILLING_PORTAL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 