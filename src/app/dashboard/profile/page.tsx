"use client";

import { SettingItem, SettingsCard } from '@/components/settings/settings-card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonLoader } from "@/components/ui/loading-indicator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Activity,
    Bell,
    CalendarCheck,
    Check,
    CreditCard,
    Download,
    Eye,
    Globe,
    Key,
    LucideIcon,
    Medal,
    Pencil,
    Receipt,
    Save,
    Shield,
    SparkleIcon,
    Star,
    TrendingUp,
    User,
    UserCheck,
    UserCog,
    Zap
} from "lucide-react";
import { useState } from "react";

const StatsItem = ({ icon, label, value }: { icon: LucideIcon, label: string, value: string }) => {
    const Icon = icon;
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{label}</span>
            </div>
            <Badge variant="outline" className="font-medium">{value}</Badge>
        </div>
    );
};

export default function ProfilePage() {
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Grid background style for the header
    const gridBgStyle = {
        backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
        backgroundSize: '20px 20px',
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setEditing(false);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            {/* Standardized Header */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <User className="h-3.5 w-3.5 mr-1.5" />
                                    Account
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Profile Settings</h1>
                                <p className="text-muted-foreground">
                                    Manage your personal information and account preferences
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(!editing)}
                                >
                                    {editing ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Done Editing
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <div className="md:col-span-1 space-y-6">
                    <SettingsCard
                        title="Profile"
                        description="Your personal information"
                        icon={<User className="h-5 w-5 text-primary" />}
                    >
                        <div className="flex flex-col items-center text-center p-4">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                                <AvatarFallback>SA</AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg font-semibold">Sarah Anderson</h3>
                            <p className="text-sm text-muted-foreground mb-2">sarah.anderson@example.com</p>
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">Quiz Creator</Badge>
                                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">Premium</Badge>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">Change Avatar</Button>
                        </div>
                    </SettingsCard>

                    <SettingsCard
                        title="Stats & Achievements"
                        description="Your platform activity"
                        icon={<Medal className="h-5 w-5 text-primary" />}
                    >
                        <div className="space-y-4 p-4">
                            <StatsItem icon={Activity} label="Quizzes Created" value="42" />
                            <StatsItem icon={Eye} label="Total Views" value="1,287" />
                            <StatsItem icon={UserCheck} label="Participants" value="156" />
                            <StatsItem icon={Medal} label="Top Quiz Rating" value="4.8/5" />
                        </div>
                    </SettingsCard>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid grid-cols-4 w-full mb-6">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="billing">Billing</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <div className="space-y-6">
                                <SettingsCard
                                    title="Personal Information"
                                    description="Update your personal details"
                                    icon={<UserCog className="h-5 w-5 text-primary" />}
                                >
                                    <div className="p-6 border-b">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-muted-foreground">Update your personal information and preferences</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditing(!editing)}
                                            >
                                                {editing ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Done Editing
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit Profile
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="first-name">First name</Label>
                                                    <Input
                                                        id="first-name"
                                                        defaultValue="Sarah"
                                                        disabled={!editing}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="last-name">Last name</Label>
                                                    <Input
                                                        id="last-name"
                                                        defaultValue="Anderson"
                                                        disabled={!editing}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    defaultValue="sarah.anderson@example.com"
                                                    disabled={!editing}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="biography">Biography</Label>
                                                <Textarea
                                                    id="biography"
                                                    className="min-h-[100px]"
                                                    defaultValue="Quiz enthusiast and educator with a passion for creating engaging learning experiences. Specialized in science and history quizzes."
                                                    disabled={!editing}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {editing && (
                                        <div className="p-4 flex justify-end border-t">
                                            <Button
                                                variant="outline"
                                                onClick={() => setEditing(false)}
                                                className="mr-2"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                                onClick={handleSave}
                                                disabled={isSaving}
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
                                    )}
                                </SettingsCard>

                                <SettingsCard
                                    title="Preferences"
                                    description="Language and regional settings"
                                    icon={<Globe className="h-5 w-5 text-primary" />}
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="language">Default Language</Label>
                                            <Select defaultValue="en" disabled={!editing}>
                                                <SelectTrigger id="language">
                                                    <SelectValue placeholder="Select language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="es">Spanish</SelectItem>
                                                    <SelectItem value="fr">French</SelectItem>
                                                    <SelectItem value="de">German</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select defaultValue="utc-8" disabled={!editing}>
                                                <SelectTrigger id="timezone">
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                                                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                                                    <SelectItem value="utc">UTC</SelectItem>
                                                    <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </div>
                        </TabsContent>

                        <TabsContent value="security">
                            <SettingsCard
                                title="Security Settings"
                                description="Manage your account security preferences"
                                icon={<Shield className="h-5 w-5 text-primary" />}
                            >
                                <div className="space-y-4 p-6">
                                    <SettingItem
                                        icon={<Key className="h-4 w-4 text-primary" />}
                                        title="Change Password"
                                        description="Update your password regularly to keep your account secure"
                                    >
                                        <Button variant="outline" size="sm">Change</Button>
                                    </SettingItem>

                                    <SettingItem
                                        icon={<Shield className="h-4 w-4 text-primary" />}
                                        title="Two-Factor Authentication"
                                        description="Add an extra layer of security to your account"
                                    >
                                        <Button variant="outline" size="sm">Enable</Button>
                                    </SettingItem>

                                    <SettingItem
                                        icon={<Activity className="h-4 w-4 text-primary" />}
                                        title="Active Sessions"
                                        description="View and manage devices where you're currently logged in"
                                    >
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </SettingItem>
                                </div>
                            </SettingsCard>
                        </TabsContent>

                        <TabsContent value="notifications">
                            <SettingsCard
                                title="Notification Preferences"
                                description="Choose how and when you want to be notified"
                                icon={<Bell className="h-5 w-5 text-primary" />}
                            >
                                <div className="space-y-4 p-6">
                                    <SettingItem
                                        title="Quiz Responses"
                                        description="When participants complete your quizzes"
                                    >
                                        <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                    </SettingItem>

                                    <SettingItem
                                        title="Comments & Ratings"
                                        description="When someone comments or rates your quizzes"
                                    >
                                        <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                    </SettingItem>

                                    <SettingItem
                                        title="Product Updates"
                                        description="New features and improvements"
                                    >
                                        <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                    </SettingItem>

                                    <SettingItem
                                        title="Marketing & Promotions"
                                        description="Special offers and promotions"
                                    >
                                        <Switch className="data-[state=checked]:bg-primary" />
                                    </SettingItem>
                                </div>
                            </SettingsCard>
                        </TabsContent>

                        <TabsContent value="billing">
                            <div className="space-y-6">
                                <SettingsCard
                                    title="Subscription Plan"
                                    description="Manage your subscription and usage"
                                    icon={<SparkleIcon className="h-5 w-5 text-primary" />}
                                >
                                    <div className="border-b p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <div className="flex items-center">
                                                    <h3 className="text-xl font-bold">Premium Plan</h3>
                                                    <Badge className="ml-2 bg-primary/15 border-primary/20 text-primary">Active</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">$15.00 billed monthly</p>
                                            </div>
                                            <Button variant="outline" size="sm">Change Plan</Button>
                                        </div>

                                        {/* Plan features */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="rounded-lg border p-4 flex items-start gap-3 bg-primary/5">
                                                <div className="mt-0.5 bg-primary/15 p-2 rounded-full">
                                                    <Zap className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">Unlimited Quizzes</h4>
                                                    <p className="text-xs text-muted-foreground">Create as many quizzes as you need</p>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border p-4 flex items-start gap-3 bg-primary/5">
                                                <div className="mt-0.5 bg-primary/15 p-2 rounded-full">
                                                    <TrendingUp className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">Advanced Analytics</h4>
                                                    <p className="text-xs text-muted-foreground">Detailed insights and performance metrics</p>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border p-4 flex items-start gap-3 bg-primary/5">
                                                <div className="mt-0.5 bg-primary/15 p-2 rounded-full">
                                                    <Star className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">Custom Branding</h4>
                                                    <p className="text-xs text-muted-foreground">Add your own logo and branding</p>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border p-4 flex items-start gap-3 bg-primary/5">
                                                <div className="mt-0.5 bg-primary/15 p-2 rounded-full">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">Priority Support</h4>
                                                    <p className="text-xs text-muted-foreground">Get help when you need it most</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usage metrics */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Usage Metrics</h4>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span>Storage (5GB/10GB)</span>
                                                        <span className="text-muted-foreground">50%</span>
                                                    </div>
                                                    <Progress value={50} className="h-2" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span>API Calls (8,500/10,000)</span>
                                                        <span className="text-muted-foreground">85%</span>
                                                    </div>
                                                    <Progress value={85} className="h-2" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span>Participants (156/Unlimited)</span>
                                                        <span className="text-muted-foreground">∞</span>
                                                    </div>
                                                    <Progress value={100} className="h-2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck className="h-4 w-4 text-primary" />
                                            <span className="text-sm">Next billing on July 15, 2024</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                            Cancel Subscription
                                        </Button>
                                    </div>
                                </SettingsCard>

                                <SettingsCard
                                    title="Payment Methods"
                                    description="Manage your payment details"
                                    icon={<CreditCard className="h-5 w-5 text-primary" />}
                                >
                                    <div className="p-6 space-y-6">
                                        {/* Current payment method */}
                                        <div className="rounded-lg border p-4 relative overflow-hidden">
                                            {/* Credit card visual design */}
                                            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-primary to-primary-foreground" />

                                            <div className="flex justify-between items-start relative">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                                                        <CreditCard className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">Visa ending in 4242</h4>
                                                        <p className="text-sm text-muted-foreground">Expires 12/24</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-xs px-2 py-0">Default</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-x-2">
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                    <Button variant="ghost" size="sm">Remove</Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add new payment method */}
                                        <Button variant="outline" className="w-full">
                                            <span className="mr-2">+</span> Add Payment Method
                                        </Button>
                                    </div>
                                </SettingsCard>

                                <SettingsCard
                                    title="Billing History"
                                    description="View and download your invoices"
                                    icon={<Receipt className="h-5 w-5 text-primary" />}
                                >
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {[
                                                { date: 'Jun 1, 2024', amount: '$15.00', id: 'INV-2024-0612' },
                                                { date: 'May 1, 2024', amount: '$15.00', id: 'INV-2024-0512' },
                                                { date: 'Apr 1, 2024', amount: '$15.00', id: 'INV-2024-0412' }
                                            ].map((invoice, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                                                    <div>
                                                        <p className="font-medium">{invoice.date}</p>
                                                        <p className="text-sm text-muted-foreground">{invoice.id}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Badge variant="outline">{invoice.amount}</Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Download Invoice">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* View all button */}
                                        <div className="mt-4 text-center">
                                            <Button variant="link" size="sm">View All Invoices</Button>
                                        </div>
                                    </div>
                                </SettingsCard>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}