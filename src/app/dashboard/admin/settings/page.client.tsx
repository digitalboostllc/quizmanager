'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { AlertCircle, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Define the shape of our settings data
interface PaymentSettings {
    stripeEnabled: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    paypalClientSecret: string;
}

// Default settings with empty values
const defaultSettings: PaymentSettings = {
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalClientSecret: '',
};

export function PaymentProcessorsSection() {
    // State for our settings
    const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchApi<PaymentSettings>('/api/admin/settings/payment');

            if (response.status === 200 && response.data) {
                setSettings(response.data);
            } else {
                setError(response.error || 'Failed to load settings');

                // If we got a 500 error, use mock data for development
                if (response.status === 500 || response.status === 404) {
                    // This is mock data for development
                    setSettings({
                        stripeEnabled: true,
                        stripePublishableKey: 'pk_test_sample123456789',
                        stripeSecretKey: 'sk_test_sample123456789',
                        stripeWebhookSecret: 'whsec_sample',
                        paypalEnabled: false,
                        paypalClientId: '',
                        paypalClientSecret: '',
                    });
                }
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError('Failed to load payment settings');

            // Use mock data for development
            setSettings({
                stripeEnabled: true,
                stripePublishableKey: 'pk_test_sample123456789',
                stripeSecretKey: 'sk_test_sample123456789',
                stripeWebhookSecret: 'whsec_sample',
                paypalEnabled: false,
                paypalClientId: '',
                paypalClientSecret: '',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async () => {
        setSaving(true);
        setError(null);
        try {
            const response = await fetchApi<PaymentSettings>('/api/admin/settings/payment', {
                method: 'POST',
                body: settings
            });

            if (response.status === 200 && response.data) {
                toast({
                    title: "Settings saved",
                    description: "Payment processor settings have been updated.",
                });
            } else {
                setError(response.error || 'Failed to save settings');
                toast({
                    title: "Error saving settings",
                    description: response.error || "An unexpected error occurred. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save payment settings');
            toast({
                title: "Error saving settings",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    }, [settings, toast]);

    // Handler for checkbox/switch changes
    const handleToggleChange = (key: keyof PaymentSettings) => (checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    };

    // Handler for text input changes
    const handleInputChange = (key: keyof PaymentSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [key]: e.target.value }));
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-lg border shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-medium">Stripe Integration</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Configure Stripe for credit card payments
                    </p>

                    <div className="mt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="stripe-enabled" className="font-medium">
                                    Enable Stripe
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow users to pay with credit cards via Stripe
                                </p>
                            </div>
                            <Switch
                                id="stripe-enabled"
                                checked={settings.stripeEnabled}
                                onCheckedChange={handleToggleChange('stripeEnabled')}
                                disabled={loading || saving}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                                <Input
                                    id="stripe-publishable-key"
                                    value={settings.stripePublishableKey}
                                    onChange={handleInputChange('stripePublishableKey')}
                                    placeholder="pk_test_..."
                                    disabled={loading || saving || !settings.stripeEnabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stripe-secret-key">Secret Key</Label>
                                <Input
                                    id="stripe-secret-key"
                                    value={settings.stripeSecretKey}
                                    onChange={handleInputChange('stripeSecretKey')}
                                    placeholder="sk_test_..."
                                    type="password"
                                    disabled={loading || saving || !settings.stripeEnabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-medium">PayPal Integration</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Configure PayPal for alternative payment options
                    </p>

                    <div className="mt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="paypal-enabled" className="font-medium">
                                    Enable PayPal
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow users to pay with PayPal
                                </p>
                            </div>
                            <Switch
                                id="paypal-enabled"
                                checked={settings.paypalEnabled}
                                onCheckedChange={handleToggleChange('paypalEnabled')}
                                disabled={loading || saving}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="paypal-client-id">Client ID</Label>
                                <Input
                                    id="paypal-client-id"
                                    value={settings.paypalClientId}
                                    onChange={handleInputChange('paypalClientId')}
                                    placeholder="Enter PayPal client ID"
                                    disabled={loading || saving || !settings.paypalEnabled}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paypal-client-secret">Client Secret</Label>
                                <Input
                                    id="paypal-client-secret"
                                    value={settings.paypalClientSecret}
                                    onChange={handleInputChange('paypalClientSecret')}
                                    placeholder="Enter PayPal client secret"
                                    type="password"
                                    disabled={loading || saving || !settings.paypalEnabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                className="w-full sm:w-auto"
                onClick={saveSettings}
                disabled={loading || saving}
            >
                {saving ? 'Saving...' : 'Save Settings'}
                <Save className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}

// Additional components can be exported as needed
export function AdminSettingsClient() {
    return {
        PaymentProcessorsSection
    };
} 