"use client";

import { BadgeDelta } from "@/components/ui/badge-delta";

export function RecentSales() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <div className="rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-xs text-primary">1</span>
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">History Trivia Quiz</p>
                    <p className="text-sm text-muted-foreground">
                        1,842 views this month
                    </p>
                </div>
                <div className="ml-auto font-medium">
                    <BadgeDelta deltaType="increase" text="+25%" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-xs text-primary">2</span>
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Science Facts</p>
                    <p className="text-sm text-muted-foreground">
                        1,289 views this month
                    </p>
                </div>
                <div className="ml-auto font-medium">
                    <BadgeDelta deltaType="increase" text="+11%" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-xs text-primary">3</span>
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Pop Culture Quiz</p>
                    <p className="text-sm text-muted-foreground">
                        942 views this month
                    </p>
                </div>
                <div className="ml-auto font-medium">
                    <BadgeDelta deltaType="decrease" text="-7%" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-xs text-primary">4</span>
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Geography Challenge</p>
                    <p className="text-sm text-muted-foreground">
                        778 views this month
                    </p>
                </div>
                <div className="ml-auto font-medium">
                    <BadgeDelta deltaType="increase" text="+18%" />
                </div>
            </div>
            <div className="flex items-center">
                <div className="rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-xs text-primary">5</span>
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Movie Quotes</p>
                    <p className="text-sm text-muted-foreground">
                        652 views this month
                    </p>
                </div>
                <div className="ml-auto font-medium">
                    <BadgeDelta deltaType="increase" text="+4%" />
                </div>
            </div>
        </div>
    );
} 