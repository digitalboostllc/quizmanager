import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    createOrUpdateCustomer,
    createSubscriptionCheckoutSession
} from "@/lib/stripe";
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
        const { planId, priceId, interval = "monthly", organizationId, successUrl, cancelUrl } = body;

        if (!planId || !priceId || !successUrl || !cancelUrl) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get the plan
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return new NextResponse("Plan not found", { status: 404 });
        }

        // Check if organization exists and user has permission (if organizationId is provided)
        let customerId: string | undefined;
        let customerEmail = session.user.email;

        if (organizationId) {
            const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: session.user.id,
                    },
                },
                include: {
                    organization: true,
                },
            });

            if (!membership) {
                return new NextResponse("Organization not found", { status: 404 });
            }

            if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
                return new NextResponse("You don't have permission to manage subscriptions", { status: 403 });
            }

            // Get or create Stripe customer for the organization
            customerId = membership.organization.customerId || undefined;

            if (!customerId) {
                const customer = await createOrUpdateCustomer({
                    email: customerEmail,
                    name: membership.organization.name,
                    metadata: {
                        organizationId,
                        userId: session.user.id,
                    },
                });

                customerId = customer.id;

                // Update organization with Stripe customer ID
                await prisma.organization.update({
                    where: { id: organizationId },
                    data: { customerId: customer.id },
                });
            }
        } else {
            // Get or create Stripe customer for the user
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: {
                    organizations: {
                        where: { role: "OWNER" },
                        include: { organization: true },
                    },
                },
            });

            if (!user) {
                return new NextResponse("User not found", { status: 404 });
            }

            // Check if the user has a personal subscription organization
            let personalOrg = user.organizations.find(
                (m) => m.organization.name === `${user.name || 'Personal'}'s Organization`
            );

            if (!personalOrg) {
                // Create a personal organization for the user
                const newOrg = await prisma.organization.create({
                    data: {
                        name: `${user.name || 'Personal'}'s Organization`,
                        slug: `${user.name?.toLowerCase().replace(/\s+/g, '-') || 'personal'}-${Date.now()}`,
                        members: {
                            create: {
                                userId: user.id,
                                role: "OWNER",
                            },
                        },
                    },
                });

                // Create Stripe customer for the organization
                const customer = await createOrUpdateCustomer({
                    email: user.email,
                    name: newOrg.name,
                    metadata: {
                        organizationId: newOrg.id,
                        userId: user.id,
                    },
                });

                customerId = customer.id;

                // Update organization with Stripe customer ID
                await prisma.organization.update({
                    where: { id: newOrg.id },
                    data: { customerId: customer.id },
                });
            } else {
                customerId = personalOrg.organization.customerId || undefined;

                if (!customerId) {
                    const customer = await createOrUpdateCustomer({
                        email: user.email,
                        name: personalOrg.organization.name,
                        metadata: {
                            organizationId: personalOrg.organization.id,
                            userId: user.id,
                        },
                    });

                    customerId = customer.id;

                    // Update organization with Stripe customer ID
                    await prisma.organization.update({
                        where: { id: personalOrg.organization.id },
                        data: { customerId: customer.id },
                    });
                }
            }
        }

        // Create checkout session
        const checkoutSession = await createSubscriptionCheckoutSession({
            customerId,
            customerEmail,
            priceId,
            successUrl,
            cancelUrl,
            metadata: {
                planId,
                userId: session.user.id,
                organizationId: organizationId || "",
                interval,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error("[CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 