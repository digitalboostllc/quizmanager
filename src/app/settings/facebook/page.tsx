'use client';

import { FacebookSettings } from '@/components/settings/FacebookSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useEffect, useState } from 'react';

export default function FacebookSettingsPage() {
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        console.log('Facebook Settings: Loading settings data');
        // Simulate API call by creating a mock promise
        const settingsPromise = Promise.resolve({
          isConnected: false,
          pageId: '',
          pageName: '',
        });

        const data = await simulateLoading(settingsPromise);
        console.log('Facebook Settings: Settings data loaded');
        setSettings(data);
      } catch (error) {
        console.error('Error loading Facebook settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [simulateLoading]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-end space-x-2 pt-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Facebook Settings</h2>
        <p className="text-muted-foreground">
          Connect and configure your Facebook Page integration for sharing content
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <FacebookSettings initialSettings={settings} />
        </CardContent>
      </Card>
    </div>
  );
} 