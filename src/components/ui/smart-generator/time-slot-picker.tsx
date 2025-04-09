"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Clock } from "lucide-react";
import { useState } from "react";

interface TimeSlot {
    id: string;
    label: string;
    multiplier: number;
}

interface TimeSlotPickerProps {
    slots: Array<{
        id: string;
        label: string;
        defaultMultiplier: number;
    }>;
    value: TimeSlot[];
    onChange: (slots: TimeSlot[]) => void;
}

export function TimeSlotPicker({ slots, value, onChange }: TimeSlotPickerProps) {
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

    // Convert the incoming value array to a map for easy lookup
    const selectedSlotsMap = new Map(
        value.map((slot) => [slot.id, slot.multiplier])
    );

    const handleSlotToggle = (slotId: string, checked: boolean) => {
        if (checked) {
            // Find the default multiplier
            const defaultMultiplier = slots.find((s) => s.id === slotId)?.defaultMultiplier || 1;

            // Add the slot with default multiplier
            const newSlot = { id: slotId, multiplier: defaultMultiplier, label: slots.find(s => s.id === slotId)?.label || '' };
            onChange([...value, newSlot]);
        } else {
            // Remove the slot
            onChange(value.filter((slot) => slot.id !== slotId));
        }
    };

    const handleMultiplierChange = (slotId: string, newMultiplier: number) => {
        const updatedSlots = value.map((slot) =>
            slot.id === slotId ? { ...slot, multiplier: newMultiplier } : slot
        );
        onChange(updatedSlots);
    };

    // Formats the multiplier as a frequency label
    const formatMultiplier = (multiplier: number): string => {
        if (multiplier === 0) return "Rare";
        if (multiplier < 1) return "Less frequent";
        if (multiplier === 1) return "Normal";
        if (multiplier < 2) return "More frequent";
        if (multiplier < 3) return "Frequent";
        if (multiplier < 4) return "Very frequent";
        return "Maximum";
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot) => {
                    const isSelected = selectedSlotsMap.has(slot.id);
                    const multiplier = selectedSlotsMap.get(slot.id) || slot.defaultMultiplier;
                    const isHovered = hoveredSlot === slot.id;

                    return (
                        <Card
                            key={slot.id}
                            className={`p-4 transition-all duration-200 ${isSelected
                                    ? "border-primary bg-primary/5"
                                    : isHovered
                                        ? "border-primary/30 bg-primary/2"
                                        : ""
                                }`}
                            onMouseEnter={() => setHoveredSlot(slot.id)}
                            onMouseLeave={() => setHoveredSlot(null)}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <Checkbox
                                    id={`slot-${slot.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) =>
                                        handleSlotToggle(slot.id, checked as boolean)
                                    }
                                    className="mt-1"
                                />
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`slot-${slot.id}`}
                                        className="font-medium cursor-pointer"
                                    >
                                        {slot.label}
                                    </Label>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1.5" />
                                        <span>Posting frequency: </span>
                                        <Badge
                                            variant="outline"
                                            className={`ml-1.5 text-xs ${multiplier > 1
                                                    ? "bg-green-100 text-green-800"
                                                    : multiplier < 1
                                                        ? "bg-amber-100 text-amber-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {formatMultiplier(multiplier)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {isSelected && (
                                <div className="pl-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Rare</span>
                                            <span>Normal</span>
                                            <span>Maximum</span>
                                        </div>
                                        <Slider
                                            value={[multiplier]}
                                            min={0}
                                            max={5}
                                            step={0.5}
                                            onValueChange={(values) =>
                                                handleMultiplierChange(slot.id, values[0])
                                            }
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {value.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                    Select at least one time slot for scheduling your quizzes.
                </p>
            )}
        </div>
    );
} 