'use client';

import { SettingsLayout } from "@/components/settings/settings-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { BarChart, Bell, Palette, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface Settings {
  emailNotifications: boolean;
  analytics: boolean;
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadSettings = async () => {
    try {
      console.log("Loading settings...");
      // Simulate API call to fetch settings
      const defaultSettings: Settings = {
        emailNotifications: true,
        analytics: true,
        language: "English (US)",
        timezone: "America/New_York",
      };

      // Create a promise that resolves with the settings
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

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
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

  const SettingItem = ({
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

  if (isLoading || !settings) {
    return (
      <SettingsLayout
        title="General Settings"
        description="Manage your application preferences and account settings"
      >
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-1/3 bg-muted rounded"></div>
              <div className="h-4 w-2/3 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-1/3 bg-muted rounded"></div>
              <div className="h-4 w-2/3 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-1/3 bg-muted rounded"></div>
              <div className="h-4 w-2/3 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="General Settings"
      description="Manage your application preferences and account settings"
    >
      <div className="space-y-6">
        {/* Appearance Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English (US)">English (US)</SelectItem>
                    <SelectItem value="English (UK)">English (UK)</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger id="timezone" className="w-full">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">GMT / UTC+0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SettingItem
              icon={<Bell className="h-4 w-4 text-primary" />}
              title="Email Notifications"
              description="Receive updates and alerts via email"
              value={settings.emailNotifications}
              onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </CardContent>
        </Card>

        {/* Analytics Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>
              Manage data collection and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SettingItem
              icon={<BarChart className="h-4 w-4 text-primary" />}
              title="Usage Analytics"
              description="Help us improve by sharing anonymous usage data"
              value={settings.analytics}
              onChange={(checked) => setSettings({ ...settings, analytics: checked })}
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