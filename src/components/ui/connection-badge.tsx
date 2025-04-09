"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

const connectionBadgeVariants = cva(
    "flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors",
    {
        variants: {
            variant: {
                active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
                inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
            },
        },
        defaultVariants: {
            variant: "inactive",
        },
    }
);

export interface ConnectionBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof connectionBadgeVariants> {
    pulse?: boolean;
}

export function ConnectionBadge({
    className,
    variant,
    pulse = false,
    ...props
}: ConnectionBadgeProps) {
    return (
        <div className={cn(connectionBadgeVariants({ variant }), className)} {...props}>
            <div className="relative flex items-center">
                <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    {
                        "bg-green-500 dark:bg-green-400": variant === "active",
                        "bg-amber-500 dark:bg-amber-400": variant === "inactive",
                        "bg-red-500 dark:bg-red-400": variant === "error",
                    }
                )}>
                    {pulse && variant === "active" && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-green-500 dark:bg-green-400"
                            animate={{ opacity: [1, 0], scale: [0, 2] }}
                            transition={{
                                duration: 2,
                                ease: "easeOut",
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        />
                    )}
                </div>
            </div>
            {props.children}
        </div>
    );
} 