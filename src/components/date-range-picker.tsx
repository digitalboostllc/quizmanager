"use client";

import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CalendarDateRangePicker({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(2023, 0, 1),
        to: new Date(),
    });

    const [preset, setPreset] = React.useState<string>("custom");

    const handlePresetChange = (value: string) => {
        setPreset(value);

        if (value === "custom") {
            return;
        }

        const today = new Date();
        let fromDate = new Date();

        switch (value) {
            case "last7days":
                fromDate = addDays(today, -7);
                break;
            case "last30days":
                fromDate = addDays(today, -30);
                break;
            case "lastmonth": {
                const firstDayLastMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    1
                );
                const lastDayLastMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    0
                );
                fromDate = firstDayLastMonth;
                setDate({
                    from: firstDayLastMonth,
                    to: lastDayLastMonth,
                });
                return;
            }
            case "ytd":
                fromDate = new Date(today.getFullYear(), 0, 1);
                break;
        }

        setDate({
            from: fromDate,
            to: today,
        });
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex items-center gap-2 border-b px-3 pb-3 pt-3">
                        <Select value={preset} onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a preset" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom Range</SelectItem>
                                <SelectItem value="last7days">Last 7 Days</SelectItem>
                                <SelectItem value="last30days">Last 30 Days</SelectItem>
                                <SelectItem value="lastmonth">Last Month</SelectItem>
                                <SelectItem value="ytd">Year to Date</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="ml-auto flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDate(undefined)}
                                className="h-7 text-xs"
                            >
                                Reset
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    // Implementation for apply if needed
                                }}
                                className="h-7 text-xs"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
} 