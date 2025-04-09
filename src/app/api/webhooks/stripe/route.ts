import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const relevantEvents = new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
]);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
        }

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Handle the event
    if (relevantEvents.has(event.type)) {
        try {
            switch (event.type) {
                case "checkout.session.completed":
                    await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                    break;

                case "customer.subscription.deleted":
                    await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                    break;

                case "invoice.payment_succeeded":
                    await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                    break;

                case "invoice.payment_failed":
                    await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                    break;

                default:
                    console.warn(`Unhandled relevant event: ${event.type}`);
            }
        } catch (error) {
            console.error(`Error handling Stripe webhook: ${error}`);
            return new NextResponse("Webhook handler failed", { status: 500 });
        }
    }

    return new NextResponse(JSON.stringify({ received: true }));
}

// Handle checkout session completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const { planId, userId, organizationId, interval } = session.metadata as {
        planId: string;
        userId: string;
        organizationId: string;
        interval: string;
    };

    // Check if subscription was created
    if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        // Fetch the subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Check if we're upgrading an existing organization subscription
        if (organizationId) {
            await updateOrganizationSubscription(
                organizationId,
                subscription,
                planId,
                interval
            );
        } else {
            // Create a new user subscription
            await createOrUpdateUserSubscription(
                userId,
                subscription,
                planId,
                interval
            );
        }
    }
}

// Handle subscription updated event
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find the organization by Stripe customer ID
    const organization = await prisma.organization.findUnique({
        where: { customerId },
        select: { id: true },
    });

    if (organization) {
        // Update the subscription in the database
        await updateSubscriptionRecord(organization.id, subscription);
    }
}

// Handle subscription deleted event
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find the organization by Stripe customer ID
    const organization = await prisma.organization.findUnique({
        where: { customerId },
        select: { id: true },
    });

    if (organization) {
        // Mark the subscription as inactive
        await updateSubscriptionRecord(
            organization.id,
            subscription,
            "CANCELED"
        );
    }
}

// Handle invoice payment succeeded event
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.billing_reason === "subscription_create" || invoice.billing_reason === "subscription_update") {
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Find the organization by Stripe customer ID
        const organization = await prisma.organization.findUnique({
            where: { customerId },
            select: { id: true },
        });

        if (organization) {
            // Create invoice record
            await prisma.invoice.create({
                data: {
                    userId: invoice.metadata?.userId || "",
                    stripeInvoiceId: invoice.id,
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: "PAID",
                    billingPeriodStart: new Date(invoice.period_start * 1000),
                    billingPeriodEnd: new Date(invoice.period_end * 1000),
                    paidAt: new Date(invoice.status_transitions.paid_at * 1000),
                    invoicePdf: invoice.invoice_pdf,
                },
            });
        }
    }
}

// Handle invoice payment failed event
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Find the organization by Stripe customer ID
        const organization = await prisma.organization.findUnique({
            where: { customerId },
            select: { id: true },
        });

        if (organization) {
            // Mark the subscription as past due
            await updateSubscriptionRecord(
                organization.id,
                subscription,
                "PAST_DUE"
            );
        }
    }
}

// Helper function to update organization subscription
async function updateOrganizationSubscription(
    organizationId: string,
    subscription: Stripe.Subscription,
    planId: string,
    interval: string
) {
    // Update the organization's subscription
    await prisma.organization.update({
        where: { id: organizationId },
        data: {
            planId,
        },
    });

    // Create or update the subscription record
    await updateSubscriptionRecord(organizationId, subscription, "ACTIVE", planId, interval);
}

// Helper function to create or update user subscription
async function createOrUpdateUserSubscription(
    userId: string,
    subscription: Stripe.Subscription,
    planId: string,
    interval: string
) {
    // Update the user's personal organization to include this subscription
    const userOrgs = await prisma.organizationMember.findMany({
        where: {
            userId,
            role: "OWNER",
        },
        include: {
            organization: true,
        },
    });

    // Find a personal organization
    const personalOrg = userOrgs.find(
        (org) => org.organization.name.includes("'s Organization")
    );

    if (personalOrg) {
        await prisma.organization.update({
            where: { id: personalOrg.organization.id },
            data: {
                planId,
            },
        });

        await updateSubscriptionRecord(
            personalOrg.organization.id,
            subscription,
            "ACTIVE",
            planId,
            interval
        );
    }
}

// Helper function to update a subscription record
async function updateSubscriptionRecord(
    organizationId: string,
    subscription: Stripe.Subscription,
    status = "ACTIVE",
    planId?: string,
    interval?: string
) {
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const canceledAt = subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null;

    // Get the price details
    const price = subscription.items.data[0]?.price;
    const amount = price?.unit_amount || 0;
    const intervalValue = interval || price?.recurring?.interval || null;

    // Update or create the subscription
    await prisma.subscription.upsert({
        where: {
            stripeSubscriptionId: subscription.id,
        },
        update: {
            status: status as any,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            canceledAt,
            planId: planId || undefined,
            amount,
            interval: intervalValue as any,
            stripeSubscriptionData: subscription as any,
        },
        create: {
            userId: subscription.metadata.userId || "",
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            planId: planId || "DEFAULT_PLAN_ID", // Use a default plan ID if not provided
            status: status as any,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            amount,
            interval: intervalValue as any,
            stripeSubscriptionData: subscription as any,
        },
    });

    // Create subscription event record
    await prisma.subscriptionEvent.create({
        data: {
            subscriptionId: subscription.id,
            userId: subscription.metadata.userId || "",
            event: status === "ACTIVE" ? "subscription_activated" : `subscription_${status.toLowerCase()}`,
            newStatus: status as any,
            newPlanId: planId,
            metadata: {
                subscriptionId: subscription.id,
                organizationId,
            },
        },
    });
} 