'use client';

import { SettingItem, SettingsCard } from '@/components/settings/settings-card';
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Bell, Mail, MessageSquare, Save, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationSettings {
    email: boolean;
    push: boolean;
    sms: boolean;
    quizReminders: boolean;
    scheduleChanges: boolean;
    newQuizzes: boolean;
    completionNotifications: boolean;
}

export default function NotificationsPage() {
    const { toast } = useToast();
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        email: true,
        push: true,
        sms: false,
        quizReminders: true,
        scheduleChanges: true,
        newQuizzes: true,
        completionNotifications: false,
    });

    useEffect(() => {
        const loadNotificationSettings = async () => {
            setIsLoading(true);
            try {
                console.log('Notifications: Loading notification settings');
                // Simulate API call
                const defaultSettings: NotificationSettings = {
                    email: true,
                    push: true,
                    sms: false,
                    quizReminders: true,
                    scheduleChanges: true,
                    newQuizzes: true,
                    completionNotifications: false,
                };

                const settingsPromise = Promise.resolve(defaultSettings);
                const data = await simulateLoading(settingsPromise);
                console.log('Notifications: Settings loaded');
                setSettings(data);
            } catch (error) {
                console.error('Error loading notification settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotificationSettings();
    }, [simulateLoading]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Settings saved",
                description: "Your notification preferences have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save notification settings. Please try again.",
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
                title="Notification Settings"
                description="Manage how and when you receive notifications about quizzes and other activities"
                icon={<Bell className="h-5 w-5 text-primary" />}
            >
                <div className="space-y-6">
                    {/* Notification Channels */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Notification Channels
                        </h3>
                        <div className="space-y-4">
                            <SettingItem
                                icon={<Mail className="h-4 w-4 text-primary" />}
                                title="Email Notifications"
                                description="Receive notifications via email"
                            >
                                <Switch
                                    checked={settings.email}
                                    onCheckedChange={(checked) => setSettings({ ...settings, email: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                icon={<Bell className="h-4 w-4 text-primary" />}
                                title="Push Notifications"
                                description="Receive push notifications in browser or app"
                            >
                                <Switch
                                    checked={settings.push}
                                    onCheckedChange={(checked) => setSettings({ ...settings, push: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                icon={<Smartphone className="h-4 w-4 text-primary" />}
                                title="SMS Notifications"
                                description="Receive text message notifications"
                            >
                                <Switch
                                    checked={settings.sms}
                                    onCheckedChange={(checked) => setSettings({ ...settings, sms: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Notification Types
                        </h3>
                        <div className="space-y-4">
                            <SettingItem
                                title="Quiz Reminders"
                                description="Get reminded about upcoming quizzes"
                            >
                                <Switch
                                    checked={settings.quizReminders}
                                    onCheckedChange={(checked) => setSettings({ ...settings, quizReminders: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                title="Schedule Changes"
                                description="Be notified when quiz schedules change"
                            >
                                <Switch
                                    checked={settings.scheduleChanges}
                                    onCheckedChange={(checked) => setSettings({ ...settings, scheduleChanges: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                title="New Quizzes"
                                description="Be notified when new quizzes are available"
                            >
                                <Switch
                                    checked={settings.newQuizzes}
                                    onCheckedChange={(checked) => setSettings({ ...settings, newQuizzes: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>

                            <SettingItem
                                title="Completion Notifications"
                                description="Be notified when someone completes your quiz"
                            >
                                <Switch
                                    checked={settings.completionNotifications}
                                    onCheckedChange={(checked) => setSettings({ ...settings, completionNotifications: checked })}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </SettingItem>
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