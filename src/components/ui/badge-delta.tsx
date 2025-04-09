"use client";

import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";

interface BadgeDeltaProps {
    deltaType: "increase" | "decrease" | "unchanged";
    text: string;
    className?: string;
}

export function BadgeDelta({
    deltaType,
    text,
    className,
}: BadgeDeltaProps) {
    const deltaColor = {
        increase: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/20",
        decrease: "text-rose-500 bg-rose-50 dark:bg-rose-500/20",
        unchanged: "text-blue-500 bg-blue-50 dark:bg-blue-500/20",
    };

    const DeltaIcon = () => {
        switch (deltaType) {
            case "increase":
                return <ArrowUpIcon className="h-3 w-3" />;
            case "decrease":
                return <ArrowDownIcon className="h-3 w-3" />;
            case "unchanged":
                return <ArrowRightIcon className="h-3 w-3" />;
            default:
                return null;
        }
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                deltaColor[deltaType],
                className
            )}
        >
            <DeltaIcon />
            {text}
        </span>
    );
} 