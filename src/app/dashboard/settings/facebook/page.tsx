'use client';

import { SettingItem, SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { ConnectionBadge } from '@/components/ui/connection-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loading-indicator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { motion } from 'framer-motion';
import { Facebook, Globe, Link as LinkIcon, Save, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FacebookSettings {
    isConnected: boolean;
    pageId: string;
    pageName: string;
    postFrequency?: 'daily' | 'weekly' | 'manual';
    autoShare?: boolean;
}

export default function FacebookSettingsPage() {
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<FacebookSettings | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

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
                    postFrequency: 'weekly',
                    autoShare: true
                } as FacebookSettings);

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

    const handleConnect = async () => {
        if (!settings) return;

        setIsConnecting(true);
        try {
            // Simulate connecting to Facebook
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSettings({
                ...settings,
                isConnected: true,
                pageId: '123456789',
                pageName: 'My Quiz Page',
            });
            toast({
                title: "Connected to Facebook",
                description: "Your Facebook page has been successfully connected.",
            });
        } catch (error) {
            toast({
                title: "Connection failed",
                description: "Failed to connect to Facebook. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!settings) return;

        setIsConnecting(true);
        try {
            // Simulate disconnecting from Facebook
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSettings({
                ...settings,
                isConnected: false,
                pageId: '',
                pageName: '',
            });
            toast({
                title: "Disconnected from Facebook",
                description: "Your Facebook page has been disconnected.",
            });
        } catch (error) {
            toast({
                title: "Disconnection failed",
                description: "Failed to disconnect from Facebook. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;

        setIsSaving(true);
        try {
            // Simulate API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: "Settings saved",
                description: "Your Facebook settings have been updated successfully.",
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

    if (isLoading || !settings) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <SettingsCard
                title="Facebook Integration"
                description="Connect your Facebook Page to automatically share quizzes"
                icon={<Facebook className="h-5 w-5 text-primary" />}
            >
                <div className="space-y-6">
                    {/* Connection Status */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-primary/5 dark:bg-primary-900/40 border border-primary/10 dark:border-primary-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-900/60">
                                <Facebook className="h-5 w-5 text-primary dark:text-primary-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-lg">Facebook Page</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <ConnectionBadge
                                        variant={settings.isConnected ? "active" : "inactive"}
                                        pulse={settings.isConnected}
                                    >
                                        {settings.isConnected ? 'Connected' : 'Not Connected'}
                                    </ConnectionBadge>
                                    {settings.isConnected && (
                                        <span className="text-sm text-muted-foreground">
                                            {settings.pageName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {settings.isConnected ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={isConnecting}
                                className="text-sm font-medium"
                            >
                                {isConnecting ? <ButtonLoader className="mr-2" /> : null}
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                            >
                                {isConnecting ? (
                                    <ButtonLoader className="mr-2" />
                                ) : (
                                    <Facebook className="h-4 w-4 mr-2" />
                                )}
                                Connect to Facebook
                            </Button>
                        )}
                    </div>

                    {settings.isConnected && (
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Page Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="page-id" className="text-sm font-medium">Page ID</Label>
                                        <div className="relative">
                                            <Input
                                                id="page-id"
                                                value={settings.pageId}
                                                readOnly
                                                className="pr-10 text-base"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                <LinkIcon className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="page-name" className="text-sm font-medium">Page Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="page-name"
                                                value={settings.pageName}
                                                readOnly
                                                className="pr-10 text-base"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                <Facebook className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Sharing Options</h3>

                                <SettingItem
                                    icon={<Share2 className="h-4 w-4 text-primary" />}
                                    title="Auto-share New Quizzes"
                                    description="Automatically share new quizzes to your Facebook page"
                                >
                                    <Switch
                                        checked={settings.autoShare}
                                        onCheckedChange={(checked) =>
                                            setSettings({ ...settings, autoShare: checked })
                                        }
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={<Globe className="h-4 w-4 text-primary" />}
                                    title="Page Preview"
                                    description="View your Facebook page in a new window"
                                >
                                    <Button variant="outline" size="sm">
                                        Visit
                                    </Button>
                                </SettingItem>
                            </div>

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
                        </motion.div>
                    )}

                    {!settings.isConnected && (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                            <div className="mb-4 rounded-full bg-primary/10 dark:bg-primary-900/30 p-3">
                                <Facebook className="h-6 w-6 text-primary dark:text-primary-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">Connect to Facebook</h3>
                            <p className="max-w-md text-sm">
                                Link your Facebook page to share quizzes directly from the platform and
                                increase engagement with your audience.
                            </p>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
} 