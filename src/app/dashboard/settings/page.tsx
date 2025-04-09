"use client";

import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Cog, Globe, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface GeneralSettings {
    language: string;
    timezone: string;
    dateFormat: string;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<GeneralSettings>({
        language: "en",
        timezone: "utc-8",
        dateFormat: "mm/dd/yyyy",
    });

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                console.log("Loading settings...");
                // Simulate API call to fetch settings
                const defaultSettings: GeneralSettings = {
                    language: "en",
                    timezone: "utc-8",
                    dateFormat: "mm/dd/yyyy",
                };

                // Create a promise that will resolve with the default settings
                const settingsPromise = Promise.resolve(defaultSettings);

                // Apply loading delay
                const data = await simulateLoading(settingsPromise);
                console.log("Settings loaded successfully");
                setSettings(data);
            } catch (error) {
                console.error("Error loading settings:", error);
                toast({
                    title: "Error",
                    description: "Failed to load settings. Please refresh the page.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, [simulateLoading, toast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Settings saved",
                description: "Your general preferences have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
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
                title="General Settings"
                description="Configure your general account preferences"
                icon={<Cog className="h-5 w-5 text-primary" />}
            >
                <div className="space-y-6">
                    {/* Regional Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Regional Preferences
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                                <Select
                                    value={settings.language}
                                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                                >
                                    <SelectTrigger id="language" className="text-base">
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en" className="text-base">English (US)</SelectItem>
                                        <SelectItem value="en-uk" className="text-base">English (UK)</SelectItem>
                                        <SelectItem value="es" className="text-base">Spanish</SelectItem>
                                        <SelectItem value="fr" className="text-base">French</SelectItem>
                                        <SelectItem value="de" className="text-base">German</SelectItem>
                                        <SelectItem value="ja" className="text-base">Japanese</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                                <Select
                                    value={settings.timezone}
                                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                                >
                                    <SelectTrigger id="timezone" className="text-base">
                                        <SelectValue placeholder="Select Timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="utc-8" className="text-base">Pacific Time (UTC-8)</SelectItem>
                                        <SelectItem value="utc-5" className="text-base">Eastern Time (UTC-5)</SelectItem>
                                        <SelectItem value="utc" className="text-base">UTC</SelectItem>
                                        <SelectItem value="utc+1" className="text-base">Central European Time (UTC+1)</SelectItem>
                                        <SelectItem value="utc+8" className="text-base">China Standard Time (UTC+8)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date-format" className="text-sm font-medium">Date Format</Label>
                            <Select
                                value={settings.dateFormat}
                                onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
                            >
                                <SelectTrigger id="date-format" className="text-base">
                                    <SelectValue placeholder="Select Date Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mm/dd/yyyy" className="text-base">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="dd/mm/yyyy" className="text-base">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="yyyy-mm-dd" className="text-base">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
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