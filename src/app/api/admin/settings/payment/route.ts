import { authOptions } from "@/lib/auth/auth-options";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for validating payment settings updates
const PaymentSettingsSchema = z.object({
    stripeEnabled: z.boolean().optional(),
    stripePublishableKey: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    stripeWebhookSecret: z.string().optional(),
    paypalEnabled: z.boolean().optional(),
    paypalClientId: z.string().optional(),
    paypalClientSecret: z.string().optional(),
});

interface PaymentSettings {
    stripeEnabled: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    paypalClientSecret: string;
}

// Mock data for development
const MOCK_SETTINGS: PaymentSettings = {
    stripeEnabled: true,
    stripePublishableKey: "pk_test_123456789",
    stripeSecretKey: "sk_test_123456789",
    stripeWebhookSecret: "whsec_sample",
    paypalEnabled: false,
    paypalClientId: "",
    paypalClientSecret: "",
};

export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be signed in to access this endpoint" },
                { status: 401 }
            );
        }

        // Check for admin role
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "You must be an admin to access this endpoint" },
                { status: 403 }
            );
        }

        // In a real application, you would fetch from database
        // For now, return mock data
        return NextResponse.json(MOCK_SETTINGS);
    } catch (error) {
        console.error("Error fetching payment settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment settings" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be signed in to access this endpoint" },
                { status: 401 }
            );
        }

        // Check for admin role
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { error: "You must be an admin to access this endpoint" },
                { status: 403 }
            );
        }

        // Parse the request body
        const data = await req.json();

        // Validate the data
        const validatedSettings: PaymentSettings = {
            stripeEnabled: Boolean(data.stripeEnabled),
            stripePublishableKey: String(data.stripePublishableKey || ""),
            stripeSecretKey: String(data.stripeSecretKey || ""),
            stripeWebhookSecret: String(data.stripeWebhookSecret || ""),
            paypalEnabled: Boolean(data.paypalEnabled),
            paypalClientId: String(data.paypalClientId || ""),
            paypalClientSecret: String(data.paypalClientSecret || ""),
        };

        // In a real application, you would save to database
        // For now, just return the validated data
        console.log("Updated payment settings:", validatedSettings);

        // Return the updated settings
        return NextResponse.json(validatedSettings);
    } catch (error) {
        console.error("Error updating payment settings:", error);
        return NextResponse.json(
            { error: "Failed to update payment settings" },
            { status: 500 }
        );
    }
}

// Helper function to mask sensitive strings
function maskString(str: string): string {
    if (!str || str.length <= 8) {
        return "••••••••";
    }

    // Show first 4 and last 4 characters, mask the rest
    const firstFour = str.substring(0, 4);
    const lastFour = str.substring(str.length - 4);
    const masked = "•".repeat(Math.min(str.length - 8, 20));

    return `${firstFour}${masked}${lastFour}`;
} 