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
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Calendar as CalendarIcon, Clock, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface CalendarSettings {
    showWeekends: boolean;
    defaultView: string;
    startOfWeek: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    showPublicHolidays: boolean;
}

// Mock implementation of useLoadingDelay if needed
// const useLoadingDelay = () => {
//     const simulateLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
//         // Ensure the loading state shows for at least 500ms for better UX
//         const [result] = await Promise.all([
//             promise,
//             new Promise(resolve => setTimeout(resolve, 500))
//         ]);
//         return result;
//     }, []);

//     return { simulateLoading };
// };

export default function CalendarSettingsPage() {
    const { toast } = useToast();
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<CalendarSettings>({
        showWeekends: true,
        defaultView: "week",
        startOfWeek: "monday",
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        showPublicHolidays: true,
    });

    useEffect(() => {
        const loadCalendarSettings = async () => {
            setIsLoading(true);
            try {
                console.log('Calendar Settings: Loading calendar data');
                // Simulate API call
                const defaultSettings: CalendarSettings = {
                    showWeekends: true,
                    defaultView: "week",
                    startOfWeek: "monday",
                    workingHoursStart: "09:00",
                    workingHoursEnd: "17:00",
                    showPublicHolidays: true,
                };

                const settingsPromise = Promise.resolve(defaultSettings);
                const data = await simulateLoading(settingsPromise);
                console.log('Calendar Settings: Calendar data loaded');
                setSettings(data);
            } catch (error) {
                console.error('Error loading calendar settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCalendarSettings();
    }, [simulateLoading]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Settings saved",
                description: "Your calendar settings have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save calendar settings. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div>
                <div className="animate-pulse">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <SettingsCard
                title="Calendar Settings"
                description="Configure how your quiz calendar display and functions"
                icon={<CalendarIcon className="h-5 w-5 text-primary" />}
            >
                <div className="space-y-6">
                    {/* Calendar Display */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Display Options
                        </h3>
                        <div className="space-y-4">
                            <SettingItem
                                icon={<CalendarIcon className="h-4 w-4 text-primary" />}
                                title="Show Weekends"
                                description="Display Saturday and Sunday in calendar view"
                            >
                                <Switch
                                    checked={settings.showWeekends}
                                    onCheckedChange={(checked) => setSettings({ ...settings, showWeekends: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                icon={<Clock className="h-4 w-4 text-primary" />}
                                title="Show Public Holidays"
                                description="Display public holidays in calendar view"
                            >
                                <Switch
                                    checked={settings.showPublicHolidays}
                                    onCheckedChange={(checked) => setSettings({ ...settings, showPublicHolidays: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>
                        </div>
                    </div>

                    {/* Configuration Options */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="default-view" className="text-sm font-medium">Default View</Label>
                                <Select
                                    value={settings.defaultView}
                                    onValueChange={(value) => setSettings({ ...settings, defaultView: value })}
                                >
                                    <SelectTrigger id="default-view" className="text-base">
                                        <SelectValue placeholder="Select default view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day" className="text-base">Day</SelectItem>
                                        <SelectItem value="week" className="text-base">Week</SelectItem>
                                        <SelectItem value="month" className="text-base">Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start-of-week" className="text-sm font-medium">Start of Week</Label>
                                <Select
                                    value={settings.startOfWeek}
                                    onValueChange={(value) => setSettings({ ...settings, startOfWeek: value })}
                                >
                                    <SelectTrigger id="start-of-week" className="text-base">
                                        <SelectValue placeholder="Select first day of week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sunday" className="text-base">Sunday</SelectItem>
                                        <SelectItem value="monday" className="text-base">Monday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Working Hours
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="working-hours-start" className="text-sm font-medium">Start Time</Label>
                                <Input
                                    id="working-hours-start"
                                    type="time"
                                    value={settings.workingHoursStart}
                                    onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                                    className="text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="working-hours-end" className="text-sm font-medium">End Time</Label>
                                <Input
                                    id="working-hours-end"
                                    type="time"
                                    value={settings.workingHoursEnd}
                                    onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                                    className="text-base"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={handleSave}
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
            </SettingsCard>
        </div>
    );
} 