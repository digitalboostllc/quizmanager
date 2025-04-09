import prisma from "./prisma";

// Default limits for users without a subscription
const DEFAULT_LIMITS = {
    quizzes: 10,
    templates: 3,
    scheduledPosts: 10,
    aiGeneration: 5,
    apiRequests: 50,
    storage: 50, // MB
    teamMembers: 1,
};

export type ResourceType = "quizzes" | "templates" | "scheduledPosts" | "aiGeneration" | "apiRequests" | "storage" | "teamMembers";

/**
 * Get the usage limits for a user or organization
 */
export async function getUserLimits(userId: string): Promise<Record<ResourceType, number>> {
    try {
        // Find organization where user is a member
        const memberships = await prisma.organizationMember.findMany({
            where: { userId },
            include: {
                organization: {
                    include: {
                        subscription: {
                            include: {
                                plan: true,
                            },
                        },
                    },
                },
            },
        });

        // If user has organizations with subscriptions, use the highest limits
        const limits: Record<ResourceType, number> = { ...DEFAULT_LIMITS };

        for (const membership of memberships) {
            const plan = membership.organization?.subscription?.plan;

            if (plan?.limits && plan.isActive) {
                // Parse plan limits and update the limits if higher than current values
                const planLimits = plan.limits as Record<string, any>;

                for (const key of Object.keys(limits)) {
                    const resourceKey = key as ResourceType;
                    if (planLimits[resourceKey] !== undefined) {
                        // Use -1 for unlimited
                        const planLimit = planLimits[resourceKey];
                        if (planLimit === -1 || (limits[resourceKey] !== -1 && planLimit > limits[resourceKey])) {
                            limits[resourceKey] = planLimit;
                        }
                    }
                }
            }
        }

        return limits;
    } catch (error) {
        console.error("Error getting user limits:", error);
        return DEFAULT_LIMITS;
    }
}

/**
 * Get the organization limits
 */
export async function getOrganizationLimits(organizationId: string): Promise<Record<ResourceType, number>> {
    try {
        // Find organization subscription
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (organization?.subscription?.plan?.limits && organization.subscription.plan.isActive) {
            // Parse plan limits
            const planLimits = organization.subscription.plan.limits as Record<string, any>;
            const limits: Record<ResourceType, number> = { ...DEFAULT_LIMITS };

            for (const key of Object.keys(limits)) {
                const resourceKey = key as ResourceType;
                if (planLimits[resourceKey] !== undefined) {
                    limits[resourceKey] = planLimits[resourceKey];
                }
            }

            return limits;
        }

        return DEFAULT_LIMITS;
    } catch (error) {
        console.error("Error getting organization limits:", error);
        return DEFAULT_LIMITS;
    }
}

/**
 * Get the current usage for a user
 */
export async function getUserUsage(userId: string): Promise<Record<ResourceType, number>> {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;

    try {
        // Get current month's usage records
        const usageRecords = await prisma.usageRecord.findMany({
            where: {
                userId,
                period: currentMonth,
            },
        });

        // Convert to a record of resource type to count
        const usage: Record<ResourceType, number> = {
            quizzes: 0,
            templates: 0,
            scheduledPosts: 0,
            aiGeneration: 0,
            apiRequests: 0,
            storage: 0,
            teamMembers: 0,
        };

        for (const record of usageRecords) {
            const resourceType = record.resourceType.toLowerCase() as ResourceType;
            if (usage[resourceType] !== undefined) {
                usage[resourceType] = record.count;
            }
        }

        // Count specific resources directly from the database
        const [quizCount, templateCount, scheduledPostCount] = await Promise.all([
            prisma.quiz.count({ where: { userId } }),
            prisma.template.count({ where: { userId } }),
            prisma.scheduledPost.count({
                where: {
                    quiz: {
                        userId,
                    },
                },
            }),
        ]);

        // Override counts with actual database counts
        usage.quizzes = quizCount;
        usage.templates = templateCount;
        usage.scheduledPosts = scheduledPostCount;

        return usage;
    } catch (error) {
        console.error("Error getting user usage:", error);
        return {
            quizzes: 0,
            templates: 0,
            scheduledPosts: 0,
            aiGeneration: 0,
            apiRequests: 0,
            storage: 0,
            teamMembers: 0,
        };
    }
}

/**
 * Get the current usage for an organization
 */
export async function getOrganizationUsage(organizationId: string): Promise<Record<ResourceType, number>> {
    try {
        // Count specific resources directly from the database
        const [quizCount, templateCount, memberCount] = await Promise.all([
            prisma.quiz.count({ where: { organizationId } }),
            prisma.template.count({ where: { organizationId } }),
            prisma.organizationMember.count({ where: { organizationId } }),
        ]);

        const usage: Record<ResourceType, number> = {
            quizzes: quizCount,
            templates: templateCount,
            scheduledPosts: 0, // To be implemented
            aiGeneration: 0, // To be implemented
            apiRequests: 0, // To be implemented
            storage: 0, // To be implemented
            teamMembers: memberCount,
        };

        return usage;
    } catch (error) {
        console.error("Error getting organization usage:", error);
        return {
            quizzes: 0,
            templates: 0,
            scheduledPosts: 0,
            aiGeneration: 0,
            apiRequests: 0,
            storage: 0,
            teamMembers: 0,
        };
    }
}

/**
 * Check if a user has exceeded their limits
 * Returns true if the user is within limits, false if they've exceeded them
 */
export async function checkUserLimits(
    userId: string,
    resourceType: ResourceType
): Promise<boolean> {
    try {
        const [limits, usage] = await Promise.all([
            getUserLimits(userId),
            getUserUsage(userId),
        ]);

        const currentUsage = usage[resourceType] || 0;
        const limit = limits[resourceType];

        // -1 means unlimited
        return limit === -1 || currentUsage < limit;
    } catch (error) {
        console.error("Error checking user limits:", error);
        // Allow in case of error
        return true;
    }
}

/**
 * Check if an organization has exceeded their limits
 * Returns true if the organization is within limits, false if they've exceeded them
 */
export async function checkOrganizationLimits(
    organizationId: string,
    resourceType: ResourceType
): Promise<boolean> {
    try {
        const [limits, usage] = await Promise.all([
            getOrganizationLimits(organizationId),
            getOrganizationUsage(organizationId),
        ]);

        const currentUsage = usage[resourceType] || 0;
        const limit = limits[resourceType];

        // -1 means unlimited
        return limit === -1 || currentUsage < limit;
    } catch (error) {
        console.error("Error checking organization limits:", error);
        // Allow in case of error
        return true;
    }
}

/**
 * Increment usage counter for a specific resource type
 */
export async function incrementUsage(
    userId: string,
    resourceType: string,
    amount: number = 1
): Promise<void> {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;

    try {
        await prisma.usageRecord.upsert({
            where: {
                userId_resourceType_period: {
                    userId,
                    resourceType: resourceType as any,
                    period: currentMonth,
                },
            },
            update: {
                count: {
                    increment: amount,
                },
            },
            create: {
                userId,
                resourceType: resourceType as any,
                period: currentMonth,
                count: amount,
            },
        });
    } catch (error) {
        console.error("Error incrementing usage:", error);
    }
} 