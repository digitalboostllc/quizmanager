'use client';

import { SettingItem, SettingsCard } from '@/components/settings/settings-card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { cn } from '@/lib/utils';
import {
    Calendar,
    CalendarClock,
    Clock,
    Info,
    Plus,
    Power,
    Save,
    Settings,
    Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TimeSlot {
    id: string;
    dayOfWeek: number;
    timeOfDay: string;
    isActive: boolean;
}

interface ScheduleSettings {
    slots: TimeSlot[];
    autoScheduleEnabled: boolean;
    scheduleFrequency: 'daily' | 'weekly' | 'custom';
    defaultPostTime: string;
    preferredDays: number[];
    bufferHours: number;
}

const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

// A modern, visually engaging time slot component
const TimeSlotCard = ({ slot, onToggle, onDelete }: { slot: TimeSlot, onToggle: (id: string, active: boolean) => void, onDelete: (id: string) => void }) => {
    const dayName = DAYS_OF_WEEK[slot.dayOfWeek];

    // Parse the time for display
    const timeDisplay = () => {
        try {
            const [hours, minutes] = slot.timeOfDay.split(':');
            const hour = parseInt(hours);
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes}`;
        } catch (e) {
            return slot.timeOfDay;
        }
    };

    const ampm = () => {
        try {
            const [hours] = slot.timeOfDay.split(':');
            const hour = parseInt(hours);
            return hour >= 12 ? 'PM' : 'AM';
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="relative group rounded-lg border py-3 px-4 bg-background">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-base">
                            {dayName}
                        </p>
                        <div className="flex items-baseline">
                            <span className="text-sm text-muted-foreground">
                                {timeDisplay()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-0.5">
                                {ampm()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        checked={slot.isActive}
                        onCheckedChange={(checked) => onToggle(slot.id, checked)}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(slot.id)}
                        className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Visual weekly schedule grid
const WeeklyScheduleGrid = ({ slots }: { slots: TimeSlot[] }) => {
    // Create time blocks from 6am to 10pm
    const timeBlocks = Array.from({ length: 17 }, (_, i) => {
        const hour = i + 6; // Starting from 6am
        const hourDisplay = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hourDisplay}${ampm}`;
    });

    // Generate a map of which days and times have slots
    const slotMap = slots.reduce((acc, slot) => {
        const [hours] = slot.timeOfDay.split(':');
        const hour = parseInt(hours);
        const key = `${slot.dayOfWeek}-${hour}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-8 border-b bg-muted/50">
                <div className="p-2 text-xs font-medium text-center text-muted-foreground">Time</div>
                {DAYS_OF_WEEK.map((day, i) => (
                    <div key={i} className="p-2 text-xs font-medium text-center border-l">
                        {day.substring(0, 3)}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-8 divide-x">
                <div className="divide-y">
                    {timeBlocks.map((time, i) => (
                        <div key={i} className="p-2 text-xs text-center text-muted-foreground h-9">
                            {time}
                        </div>
                    ))}
                </div>

                {DAYS_OF_WEEK.map((_, dayIndex) => (
                    <div key={dayIndex} className="divide-y">
                        {timeBlocks.map((_, timeIndex) => {
                            const hour = timeIndex + 6;
                            const key = `${dayIndex}-${hour}`;
                            const hasSlot = slotMap[key]?.some(s => s.isActive);

                            return (
                                <div key={timeIndex} className="h-9 relative">
                                    {hasSlot && (
                                        <div className="absolute inset-1 bg-primary/10 rounded flex items-center justify-center">
                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Actual implementation of useLoadingDelay hook
const useLoadingDelay = () => {
    const simulateLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
        // Ensure the loading state shows for at least 500ms for better UX
        const [result] = await Promise.all([
            promise,
            new Promise(resolve => setTimeout(resolve, 500))
        ]);
        return result;
    }, []);

    return { simulateLoading };
};

export default function AutoSchedulePage() {
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<ScheduleSettings | null>(null);
    const [newDayOfWeek, setNewDayOfWeek] = useState("1");
    const [newTimeOfDay, setNewTimeOfDay] = useState("09:00");
    const [isAdding, setIsAdding] = useState(false);
    const [activeView, setActiveView] = useState<'list' | 'grid'>('grid');
    const [isSaving, setIsSaving] = useState(false);
    const [addToEveryDay, setAddToEveryDay] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadScheduleData = async () => {
            setIsLoading(true);
            try {
                console.log('Auto Schedule: Loading scheduling data');

                // Load time slots from the API
                const slotsPromise = fetchApi<TimeSlot[]>('settings/schedule/time-slots');

                // Load general settings from the API
                const settingsPromise = fetchApi<{ autoScheduleEnabled: boolean }>('settings');

                // Wait for both promises to resolve
                const [slots, generalSettings] = await Promise.all([
                    simulateLoading(slotsPromise),
                    simulateLoading(settingsPromise)
                ]);

                // Construct settings object
                const scheduleSettings: ScheduleSettings = {
                    slots: slots || [],
                    autoScheduleEnabled: generalSettings?.autoScheduleEnabled || false,
                    scheduleFrequency: 'weekly',
                    defaultPostTime: '12:00',
                    preferredDays: [1, 3, 5],
                    bufferHours: 1
                };

                console.log('Auto Schedule: Scheduling data loaded', scheduleSettings);
                setSettings(scheduleSettings);
            } catch (error) {
                console.error('Error loading auto schedule data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load scheduling data. Please try again.",
                    variant: "destructive"
                });

                // Set default empty settings
                setSettings({
                    slots: [],
                    autoScheduleEnabled: false,
                    scheduleFrequency: 'weekly',
                    defaultPostTime: '12:00',
                    preferredDays: [1, 3, 5],
                    bufferHours: 1
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadScheduleData();
    }, [simulateLoading, toast]);

    const handleAddSlot = async () => {
        if (!settings) return;

        setIsAdding(true);
        try {
            if (addToEveryDay) {
                // Create slots for all days of the week
                const slotsToAdd = DAYS_OF_WEEK.map((_, index) => ({
                    dayOfWeek: index,
                    timeOfDay: newTimeOfDay,
                    isActive: true
                }));

                // Bulk add slots
                const response = await fetchApi<{ slots: TimeSlot[] }>('settings/schedule/time-slots', {
                    method: 'POST',
                    body: { slots: slotsToAdd }
                });

                // Update local state
                if (response && response.slots) {
                    setSettings({
                        ...settings,
                        slots: [...settings.slots, ...response.slots]
                    });

                    toast({
                        title: "Schedule slots added",
                        description: `Added slots for every day at ${newTimeOfDay}`,
                    });
                }
            } else {
                // Add a single slot
                const newSlot = {
                    dayOfWeek: parseInt(newDayOfWeek),
                    timeOfDay: newTimeOfDay,
                    isActive: true
                };

                // Add the slot via API
                const response = await fetchApi<TimeSlot>('settings/schedule/time-slots', {
                    method: 'POST',
                    body: newSlot
                });

                // Update local state
                if (response && response.id) {
                    setSettings({
                        ...settings,
                        slots: [...settings.slots, response]
                    });

                    toast({
                        title: "Schedule slot added",
                        description: `Added a new slot for ${DAYS_OF_WEEK[parseInt(newDayOfWeek)]} at ${newTimeOfDay}`,
                    });
                }
            }
        } catch (error) {
            console.error('Error adding schedule slot:', error);
            toast({
                title: "Error",
                description: "Failed to add schedule slot. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        if (!settings) return;

        try {
            // Update the slot via API
            const response = await fetchApi<TimeSlot>('settings/schedule/time-slots', {
                method: 'PATCH',
                body: { id, isActive }
            });

            // Update local state
            if (response) {
                const updatedSlots = settings.slots.map(slot =>
                    slot.id === id ? { ...slot, isActive } : slot
                );

                setSettings({
                    ...settings,
                    slots: updatedSlots
                });

                toast({
                    title: isActive ? "Slot activated" : "Slot deactivated",
                    description: `The schedule slot has been ${isActive ? "activated" : "deactivated"}`,
                });
            }
        } catch (error) {
            console.error('Error toggling slot active state:', error);
            toast({
                title: "Error",
                description: "Failed to update schedule slot. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleRemoveSlot = async (id: string) => {
        if (!settings) return;

        try {
            // Delete the slot via API
            await fetchApi<{ message: string }>(`settings/schedule/time-slots?id=${id}`, {
                method: 'DELETE'
            });

            // Update local state
            const updatedSlots = settings.slots.filter(slot => slot.id !== id);

            setSettings({
                ...settings,
                slots: updatedSlots
            });

            toast({
                title: "Schedule slot removed",
                description: "The slot has been removed from your schedule",
            });
        } catch (error) {
            console.error('Error removing schedule slot:', error);
            toast({
                title: "Error",
                description: "Failed to remove schedule slot. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;

        setIsSaving(true);
        try {
            // Update general settings
            await fetchApi('settings', {
                method: 'PATCH',
                body: {
                    autoScheduleEnabled: settings.autoScheduleEnabled
                }
            });

            toast({
                title: "Settings saved",
                description: "Your auto-schedule settings have been updated successfully."
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !settings) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
                <div className="animate-pulse space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Skeleton className="h-[120px] w-full rounded-lg" />
                        <Skeleton className="h-[120px] w-full rounded-lg" />
                        <Skeleton className="h-[120px] w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <SettingsCard
                title="Auto-Schedule"
                description="Configure automatic scheduling for your quizzes"
                icon={<CalendarClock className="h-5 w-5 text-primary" />}
            >
                <div className="space-y-4">
                    {/* Main toggle switch */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary-900/40 border border-primary/10 dark:border-primary-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-900/60">
                                <Power className="h-5 w-5 text-primary dark:text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Auto-Schedule</h3>
                                <p className="text-sm text-muted-foreground">
                                    Automatically schedule posts based on your preferred times
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.autoScheduleEnabled}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoScheduleEnabled: checked })
                            }
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    {settings.autoScheduleEnabled && (
                        <div className="space-y-6">
                            {/* Schedule frequency settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Schedule Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="schedule-frequency" className="text-sm font-medium">Frequency</Label>
                                        <Select
                                            value={settings.scheduleFrequency}
                                            onValueChange={(value: 'daily' | 'weekly' | 'custom') =>
                                                setSettings({ ...settings, scheduleFrequency: value })
                                            }
                                        >
                                            <SelectTrigger id="schedule-frequency" className="text-base">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily" className="text-base">Daily</SelectItem>
                                                <SelectItem value="weekly" className="text-base">Weekly</SelectItem>
                                                <SelectItem value="custom" className="text-base">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="default-time" className="text-sm font-medium">Default Post Time</Label>
                                        <Input
                                            id="default-time"
                                            type="time"
                                            value={settings.defaultPostTime}
                                            onChange={(e) =>
                                                setSettings({ ...settings, defaultPostTime: e.target.value })
                                            }
                                            className="text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Weekly schedule view */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Weekly Schedule
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant={activeView === 'grid' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setActiveView('grid')}
                                            className="h-8 px-3 text-sm font-medium"
                                        >
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Grid
                                        </Button>
                                        <Button
                                            variant={activeView === 'list' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setActiveView('list')}
                                            className="h-8 px-3 text-sm font-medium"
                                        >
                                            <Clock className="h-4 w-4 mr-2" />
                                            List
                                        </Button>
                                    </div>
                                </div>

                                {activeView === 'grid' ? (
                                    <WeeklyScheduleGrid slots={settings.slots} />
                                ) : (
                                    <div className="border rounded-lg bg-card overflow-hidden">
                                        <div className="py-3 px-4 bg-muted/30 border-b">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-base">Current Schedule Slots</h4>
                                                <span className="text-sm text-muted-foreground">
                                                    {settings.slots.length} slot{settings.slots.length !== 1 ? 's' : ''} configured
                                                </span>
                                            </div>
                                        </div>

                                        {settings.slots.length === 0 ? (
                                            <div className="p-6 text-center text-muted-foreground">
                                                <div className="mx-auto mb-3 rounded-full bg-muted w-12 h-12 flex items-center justify-center">
                                                    <Calendar className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <h4 className="font-medium text-base mb-2">No slots configured</h4>
                                                <p className="text-sm">Add your first schedule slot below.</p>
                                            </div>
                                        ) : (
                                            <div className="p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {settings.slots.map(slot => (
                                                        <TimeSlotCard
                                                            key={slot.id}
                                                            slot={slot}
                                                            onToggle={handleToggleActive}
                                                            onDelete={handleRemoveSlot}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Add new slot */}
                            <div className="rounded-lg border bg-card">
                                <div className="py-3 px-4 border-b bg-muted/30">
                                    <h4 className="font-medium text-base flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-primary" />
                                        Add New Schedule Slot
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label htmlFor="day-select" className="text-sm font-medium">Day of Week</Label>
                                            <Select
                                                value={newDayOfWeek}
                                                onValueChange={setNewDayOfWeek}
                                                disabled={addToEveryDay}
                                            >
                                                <SelectTrigger id="day-select" className="w-[180px] text-base">
                                                    <SelectValue placeholder="Select day" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DAYS_OF_WEEK.map((day, index) => (
                                                        <SelectItem key={index} value={index.toString()} className="text-base">
                                                            {day}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="time-input" className="text-sm font-medium">Time</Label>
                                            <Input
                                                id="time-input"
                                                type="time"
                                                value={newTimeOfDay}
                                                onChange={(e) => setNewTimeOfDay(e.target.value)}
                                                className="w-[180px] text-base"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleAddSlot}
                                            disabled={isAdding}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                                        >
                                            {isAdding ? (
                                                <ButtonLoader className="mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            Add Slot
                                        </Button>
                                    </div>

                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Add to every day</span>
                                            </div>
                                            <Switch
                                                id="every-day-toggle"
                                                checked={addToEveryDay}
                                                onCheckedChange={(checked) => setAddToEveryDay(checked)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <p className="text-sm text-muted-foreground mt-2">
                                            When enabled, the time slot will be added to all days of the week at once
                                        </p>

                                        <div className="mt-3 grid grid-cols-7 gap-1.5">
                                            {DAYS_OF_WEEK.map((day, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "py-1.5 text-center text-sm font-medium rounded-md",
                                                        addToEveryDay || parseInt(newDayOfWeek) === index
                                                            ? "bg-muted/70 text-foreground"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {day.substring(0, 3)}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex items-center text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4 mr-2" />
                                            <span>
                                                {addToEveryDay
                                                    ? `Adding to all days at ${newTimeOfDay}`
                                                    : `Adding to ${DAYS_OF_WEEK[parseInt(newDayOfWeek)]} at ${newTimeOfDay}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced settings */}
                            <SettingItem
                                icon={<Info className="h-4 w-4 text-primary" />}
                                title="Buffer Hours"
                                description="Minimum time between scheduled posts"
                            >
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={settings.bufferHours}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                bufferHours: parseInt(e.target.value) || 0
                                            })
                                        }
                                        className="text-base"
                                    />
                                </div>
                            </SettingItem>

                            {/* Save button */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                                >
                                    {isSaving ? (
                                        <>
                                            <ButtonLoader className="mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!settings.autoScheduleEnabled && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-3">
                                <Calendar className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Auto-Schedule is disabled</h3>
                            <p className="text-base mb-4">
                                Enable auto-scheduling to automatically post quizzes at your preferred times without manual intervention.
                            </p>
                            <Button
                                onClick={() => setSettings({ ...settings, autoScheduleEnabled: true })}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                            >
                                <Power className="h-4 w-4 mr-2" />
                                Enable Auto-Schedule
                            </Button>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
} 