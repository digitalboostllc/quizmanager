'use client';

import { SettingsLayout } from "@/components/settings/settings-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Bell, Calendar, Mail, MessageSquare, Save, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  quizReminders: boolean;
  contentUpdates: boolean;
  marketingEmails: boolean;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    inApp: true,
    quizReminders: true,
    contentUpdates: false,
    marketingEmails: false,
  });

  useEffect(() => {
    const loadNotificationSettings = async () => {
      setIsLoading(true);
      try {
        console.log('Notifications Settings: Loading notification data');
        // Simulate API call
        const defaultSettings: NotificationSettings = {
          email: true,
          push: true,
          inApp: true,
          quizReminders: true,
          contentUpdates: false,
          marketingEmails: false,
        };

        const data = await simulateLoading(Promise.resolve(defaultSettings));
        console.log('Notifications Settings: Notification data loaded');
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

  const NotificationItem = ({
    icon,
    title,
    description,
    value,
    onChange
  }: {
    icon: React.ReactNode,
    title: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void
  }) => (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );

  const SkeletonItem = () => (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  );

  if (isLoading) {
    return (
      <SettingsLayout
        title="Notifications"
        description="Manage how and when you receive notifications from the application"
      >
        <div className="space-y-6">
          {/* Notification Channels Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
              <SkeletonItem />
              <SkeletonItem />
              <SkeletonItem />
            </CardContent>
          </Card>

          {/* Notification Types Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
              <SkeletonItem />
              <SkeletonItem />
              <SkeletonItem />
            </CardContent>
          </Card>

          {/* Save Button Skeleton */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Notifications"
      description="Manage how and when you receive notifications from the application"
    >
      <div className="space-y-6">
        {/* Notification Channels Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <NotificationItem
              icon={<Mail className="h-4 w-4 text-primary" />}
              title="Email Notifications"
              description="Receive notifications via email"
              value={settings.email}
              onChange={(checked) => setSettings({ ...settings, email: checked })}
            />

            <NotificationItem
              icon={<Smartphone className="h-4 w-4 text-primary" />}
              title="Push Notifications"
              description="Receive push notifications on your devices"
              value={settings.push}
              onChange={(checked) => setSettings({ ...settings, push: checked })}
            />

            <NotificationItem
              icon={<MessageSquare className="h-4 w-4 text-primary" />}
              title="In-App Notifications"
              description="Show notifications within the application"
              value={settings.inApp}
              onChange={(checked) => setSettings({ ...settings, inApp: checked })}
            />
          </CardContent>
        </Card>

        {/* Notification Types Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Select which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <NotificationItem
              icon={<Calendar className="h-4 w-4 text-primary" />}
              title="Quiz Reminders"
              description="Get reminded about scheduled quizzes and deadlines"
              value={settings.quizReminders}
              onChange={(checked) => setSettings({ ...settings, quizReminders: checked })}
            />

            <NotificationItem
              icon={<MessageSquare className="h-4 w-4 text-primary" />}
              title="Content Updates"
              description="Be notified about new features and content updates"
              value={settings.contentUpdates}
              onChange={(checked) => setSettings({ ...settings, contentUpdates: checked })}
            />

            <NotificationItem
              icon={<Mail className="h-4 w-4 text-primary" />}
              title="Marketing Emails"
              description="Receive occasional promotional content and offers"
              value={settings.marketingEmails}
              onChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <ButtonLoader className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
} 