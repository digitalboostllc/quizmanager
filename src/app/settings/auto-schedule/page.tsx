'use client';

import { ImprovedAutoScheduleSlots } from "@/components/ImprovedAutoScheduleSlots";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Clock, Info } from "lucide-react";
import { useEffect, useState } from "react";

export default function AutoSchedulePage() {
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(true);

  useEffect(() => {
    const loadScheduleData = async () => {
      setIsLoading(true);
      try {
        console.log('Auto Schedule: Loading scheduling data');
        // Simulate API call
        const mockSlots = [
          { id: '1', dayOfWeek: 1, timeOfDay: '09:00', isActive: true },
          { id: '2', dayOfWeek: 3, timeOfDay: '14:00', isActive: true },
          { id: '3', dayOfWeek: 5, timeOfDay: '17:00', isActive: false },
        ];

        const data = await simulateLoading(Promise.resolve(mockSlots));
        console.log('Auto Schedule: Scheduling data loaded');
        setScheduleSlots(data);
      } catch (error) {
        console.error('Error loading auto schedule data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScheduleData();
  }, [simulateLoading]);

  if (isLoading) {
    return (
      <SettingsLayout
        title="Auto-Schedule Settings"
        description="Configure automatic quiz scheduling slots and preferences"
      >
        <div className="space-y-6">
          {/* Main Settings Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Separator className="mb-6" />

              {/* Add Individual Slot Skeleton */}
              <div className="space-y-4 mb-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>

              {/* Bulk Create Skeleton */}
              <div className="space-y-4 mb-6">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Slots Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Auto-Schedule Settings"
      description="Configure automatic quiz scheduling slots and preferences"
    >
      <div className="space-y-6">
        {/* Main Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Scheduling Configuration
            </CardTitle>
            <CardDescription>
              Set up your preferred scheduling times for automatically generated quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 py-2 mb-6">
              <Switch
                checked={autoScheduleEnabled}
                onCheckedChange={setAutoScheduleEnabled}
                id="auto-schedule"
              />
              <div className="flex-col">
                <span className="font-medium">Enable Auto-Scheduling</span>
                <div className="text-sm text-muted-foreground">
                  When enabled, new quizzes will be automatically scheduled at your configured time slots
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            <ImprovedAutoScheduleSlots slots={scheduleSlots} />
          </CardContent>
        </Card>

        {/* Helpful Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Scheduling Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Create slots across different days and times to distribute quizzes evenly</li>
              <li>Inactive slots will be skipped during scheduling but can be reactivated later</li>
              <li>All times are in UTC - adjust according to your local timezone</li>
              <li>Use bulk creation to quickly set up a consistent schedule across all days</li>
              <li>For best engagement, set times when your audience is most active</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
} 