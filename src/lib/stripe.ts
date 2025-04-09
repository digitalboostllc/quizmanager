import Stripe from 'stripe';
import { prisma } from './prisma';

// Function to get Stripe instance with settings from the database
export async function getStripeInstance(): Promise<Stripe> {
    try {
        // Get settings from database
        const settings = await prisma.paymentSettings.findFirst({
            select: {
                stripeEnabled: true,
                stripeSecretKey: true,
            },
        });

        if (!settings?.stripeEnabled || !settings?.stripeSecretKey) {
            // Fall back to environment variable if database settings are not available
            if (!process.env.STRIPE_SECRET_KEY) {
                throw new Error('Stripe is not properly configured');
            }

            return new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2025-03-31.basil',
                appInfo: {
                    name: 'Quiz Manager',
                    version: '1.0.0',
                },
            });
        }

        // Use the secret key from the database
        return new Stripe(settings.stripeSecretKey, {
            apiVersion: '2025-03-31.basil',
            appInfo: {
                name: 'Quiz Manager',
                version: '1.0.0',
            },
        });
    } catch (error) {
        console.error('Error initializing Stripe:', error);

        // As a fallback, try to use the environment variable
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Stripe is not properly configured');
        }

        return new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-03-31.basil',
            appInfo: {
                name: 'Quiz Manager',
                version: '1.0.0',
            },
        });
    }
}

// Create a temporary instance for direct imports, but use getStripeInstance for actual calls
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-03-31.basil',
    appInfo: {
        name: 'Quiz Manager',
        version: '1.0.0',
    },
});

// Create a checkout session for a subscription
export async function createSubscriptionCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    customerEmail,
    metadata = {},
}: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
}) {
    const stripeClient = await getStripeInstance();

    const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
            trial_period_days: 14, // 14-day free trial
            metadata,
        },
    };

    // Add customer or email
    if (customerId) {
        params.customer = customerId;
    } else if (customerEmail) {
        params.customer_email = customerEmail;
    }

    return stripeClient.checkout.sessions.create(params);
}

// Create a checkout session for a one-time payment
export async function createOneTimeCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    customerEmail,
    metadata = {},
}: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
}) {
    const stripeClient = await getStripeInstance();

    const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
    };

    // Add customer or email
    if (customerId) {
        params.customer = customerId;
    } else if (customerEmail) {
        params.customer_email = customerEmail;
    }

    return stripeClient.checkout.sessions.create(params);
}

// Fetch subscription details

// Update subscription
export async function updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
) {
    return stripe.subscriptions.update(subscriptionId, params);
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

// Immediately cancel subscription
export async function immediatelyCancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
}

// Create or update a customer
export async function createOrUpdateCustomer({
    customerId,
    email,
    name,
    metadata = {},
}: {
    customerId?: string;
    email: string;
    name?: string;
    metadata?: Record<string, string>;
}) {
    const stripeClient = await getStripeInstance();

    if (customerId) {
        // Update existing customer
        return stripeClient.customers.update(customerId, {
            email,
            name,
            metadata,
        });
    } else {
        // Create new customer
        return stripeClient.customers.create({
            email,
            name,
            metadata,
        });
    }
}

// Create a billing portal session
export async function createBillingPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string;
    returnUrl: string;
}) {
    const stripeClient = await getStripeInstance();

    return stripeClient.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
} 