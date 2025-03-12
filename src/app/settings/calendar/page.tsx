'use client';

import { SettingsLayout } from "@/components/settings/settings-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

        const data = await simulateLoading(Promise.resolve(defaultSettings));
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

  const CalendarItem = ({
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
        title="Calendar Settings"
        description="Configure your calendar view and scheduling preferences"
      >
        <div className="space-y-6">
          {/* Calendar Display Card Skeleton */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
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
      title="Calendar Settings"
      description="Configure your calendar view and scheduling preferences"
    >
      <div className="space-y-6">
        {/* Calendar Display Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendar Display
            </CardTitle>
            <CardDescription>
              Configure how your calendar is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CalendarItem
              icon={<CalendarIcon className="h-4 w-4 text-primary" />}
              title="Show Weekends"
              description="Display weekend days in your calendar view"
              value={settings.showWeekends}
              onChange={(checked) => setSettings({ ...settings, showWeekends: checked })}
            />

            <CalendarItem
              icon={<CalendarIcon className="h-4 w-4 text-primary" />}
              title="Show Public Holidays"
              description="Display public holidays in your calendar"
              value={settings.showPublicHolidays}
              onChange={(checked) => setSettings({ ...settings, showPublicHolidays: checked })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="defaultView">Default View</Label>
                <Select
                  value={settings.defaultView}
                  onValueChange={(value) => setSettings({ ...settings, defaultView: value })}
                >
                  <SelectTrigger id="defaultView" className="w-full">
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startOfWeek">Start of Week</Label>
                <Select
                  value={settings.startOfWeek}
                  onValueChange={(value) => setSettings({ ...settings, startOfWeek: value })}
                >
                  <SelectTrigger id="startOfWeek" className="w-full">
                    <SelectValue placeholder="Select start of week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Working Hours
            </CardTitle>
            <CardDescription>
              Set your working hours for scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="workingHoursStart">Start Time</Label>
                <Input
                  id="workingHoursStart"
                  type="time"
                  value={settings.workingHoursStart}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHoursEnd">End Time</Label>
                <Input
                  id="workingHoursEnd"
                  type="time"
                  value={settings.workingHoursEnd}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                />
              </div>
            </div>
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