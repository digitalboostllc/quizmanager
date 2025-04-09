import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bell, Globe, Lock, Mail, Save, Settings } from "lucide-react";

// Import the client component
import { PaymentProcessorsSection } from "./page.client";

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">System Settings</h1>
                                <p className="text-muted-foreground">
                                    Configure global platform settings and defaults
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Settings</CardTitle>
                            <CardDescription>
                                Configure general platform settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="app-name">Application Name</Label>
                                <Input id="app-name" defaultValue="Quizzer" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="app-description">Application Description</Label>
                                <Textarea
                                    id="app-description"
                                    defaultValue="Create and share interactive quizzes with your audience"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-email">Support Email</Label>
                                <Input id="contact-email" defaultValue="support@quizzer.com" type="email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Default Timezone</Label>
                                <Select defaultValue="utc">
                                    <SelectTrigger id="timezone">
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="utc">UTC</SelectItem>
                                        <SelectItem value="est">Eastern Time (ET)</SelectItem>
                                        <SelectItem value="cst">Central Time (CT)</SelectItem>
                                        <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                                        <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Regional Settings</CardTitle>
                            <CardDescription>
                                Configure localization and regional defaults
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="language">Default Language</Label>
                                <Select defaultValue="en">
                                    <SelectTrigger id="language">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="de">German</SelectItem>
                                        <SelectItem value="ja">Japanese</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date-format">Date Format</Label>
                                <RadioGroup defaultValue="mdy" className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="mdy" id="mdy" />
                                        <Label htmlFor="mdy" className="font-normal">MM/DD/YYYY</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="dmy" id="dmy" />
                                        <Label htmlFor="dmy" className="font-normal">DD/MM/YYYY</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="ymd" id="ymd" />
                                        <Label htmlFor="ymd" className="font-normal">YYYY/MM/DD</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="currency">Default Currency</Label>
                                </div>
                                <Select defaultValue="usd">
                                    <SelectTrigger id="currency" className="w-[180px]">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usd">USD ($)</SelectItem>
                                        <SelectItem value="eur">EUR (€)</SelectItem>
                                        <SelectItem value="gbp">GBP (£)</SelectItem>
                                        <SelectItem value="jpy">JPY (¥)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Lock className="mr-2 h-5 w-5" />
                                Authentication Settings
                            </CardTitle>
                            <CardDescription>
                                Configure authentication and security policies
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Two-Factor Authentication</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require 2FA for all users
                                    </p>
                                </div>
                                <Switch defaultChecked id="two-factor" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Password Complexity</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enforce strong password requirements
                                    </p>
                                </div>
                                <Switch defaultChecked id="password-strength" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-expiry">Password Expiration</Label>
                                <Select defaultValue="90">
                                    <SelectTrigger id="password-expiry">
                                        <SelectValue placeholder="Select expiration period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="never">Never</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="60">60 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                        <SelectItem value="180">180 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max-sessions">Maximum Concurrent Sessions</Label>
                                <Select defaultValue="5">
                                    <SelectTrigger id="max-sessions">
                                        <SelectValue placeholder="Select maximum sessions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Session</SelectItem>
                                        <SelectItem value="3">3 Sessions</SelectItem>
                                        <SelectItem value="5">5 Sessions</SelectItem>
                                        <SelectItem value="unlimited">Unlimited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save Security Settings
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Globe className="mr-2 h-5 w-5" />
                                API Access Control
                            </CardTitle>
                            <CardDescription>
                                Configure API access and rate limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable Public API</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow API access for integrations
                                    </p>
                                </div>
                                <Switch defaultChecked id="enable-api" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate-limit">Default Rate Limit (requests per minute)</Label>
                                <Input id="rate-limit" type="number" defaultValue="120" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="token-expiry">API Token Expiration</Label>
                                <Select defaultValue="30">
                                    <SelectTrigger id="token-expiry">
                                        <SelectValue placeholder="Select token expiration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="never">Never</SelectItem>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                        <SelectItem value="365">365 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save API Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Bell className="mr-2 h-5 w-5" />
                                Email Notifications
                            </CardTitle>
                            <CardDescription>
                                Configure email notification templates and settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Welcome Email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send welcome email to new users
                                    </p>
                                </div>
                                <Switch defaultChecked id="welcome-email" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Reports</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send weekly usage reports to organization admins
                                    </p>
                                </div>
                                <Switch defaultChecked id="weekly-reports" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Subscription Notices</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send notifications about subscription changes
                                    </p>
                                </div>
                                <Switch defaultChecked id="subscription-notices" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Usage Alerts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send alerts when approaching usage limits
                                    </p>
                                </div>
                                <Switch defaultChecked id="usage-alerts" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save Email Settings
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Mail className="mr-2 h-5 w-5" />
                                SMTP Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure email delivery service settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-host">SMTP Host</Label>
                                <Input id="smtp-host" defaultValue="smtp.example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp-port">SMTP Port</Label>
                                <Input id="smtp-port" defaultValue="587" type="number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtp-user">SMTP Username</Label>
                                    <Input id="smtp-user" defaultValue="noreply@quizzer.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp-pass">SMTP Password</Label>
                                    <Input id="smtp-pass" type="password" defaultValue="••••••••••••" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Use SSL/TLS</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Secure SMTP connection
                                    </p>
                                </div>
                                <Switch defaultChecked id="smtp-secure" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-2 items-start sm:flex-row sm:space-y-0 sm:space-x-2">
                            <Button variant="outline">Test Connection</Button>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save SMTP Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Integrations Settings */}
                <TabsContent value="integrations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Processors</CardTitle>
                            <CardDescription>
                                Configure payment gateway integrations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentProcessorsSection />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>External Services</CardTitle>
                            <CardDescription>
                                Configure third-party service integrations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Google Analytics</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Track website usage and analytics
                                    </p>
                                </div>
                                <Switch defaultChecked id="ga-enabled" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ga-id">Tracking ID</Label>
                                <Input id="ga-id" defaultValue="G-XXXXXXXXXX" />
                            </div>

                            <div className="h-px bg-border my-4"></div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Slack Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send alerts and notifications to Slack
                                    </p>
                                </div>
                                <Switch id="slack-enabled" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slack-webhook">Webhook URL</Label>
                                <Input id="slack-webhook" placeholder="https://hooks.slack.com/services/..." disabled />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto">
                                <Save className="mr-2 h-4 w-4" />
                                Save Integration Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Maintenance Settings */}
                <TabsContent value="maintenance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-amber-600">
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Maintenance Mode
                            </CardTitle>
                            <CardDescription>
                                Control system availability and maintenance schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Make the platform unavailable to users
                                    </p>
                                </div>
                                <Switch id="maintenance-mode" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                                <Textarea
                                    id="maintenance-message"
                                    placeholder="We're currently updating our systems to improve your experience. Please check back in a few hours."
                                    disabled
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maintenance-start">Start Time</Label>
                                    <Input id="maintenance-start" type="datetime-local" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maintenance-end">End Time</Label>
                                    <Input id="maintenance-end" type="datetime-local" disabled />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Allow Admin Access</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Admins can still access the platform during maintenance
                                    </p>
                                </div>
                                <Switch defaultChecked id="admin-access" disabled />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full sm:w-auto" variant="destructive" disabled>
                                Enable Maintenance Mode
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Database & Backup</CardTitle>
                            <CardDescription>
                                Manage database operations and backups
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Automatic Backups</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Schedule regular database backups
                                    </p>
                                </div>
                                <Switch defaultChecked id="auto-backup" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                                <Select defaultValue="daily">
                                    <SelectTrigger id="backup-frequency">
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="backup-retention">Backup Retention Period</Label>
                                <Select defaultValue="30">
                                    <SelectTrigger id="backup-retention">
                                        <SelectValue placeholder="Select retention period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="90">90 Days</SelectItem>
                                        <SelectItem value="365">1 Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="backup-location">Backup Storage Location</Label>
                                <Input id="backup-location" defaultValue="s3://quizzer-backups/" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                            <Button variant="outline">
                                Create Manual Backup
                            </Button>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Backup Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 