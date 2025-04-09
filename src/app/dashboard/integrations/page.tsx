'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    ArrowRight,
    Check,
    Code,
    Copy,
    Facebook,
    Instagram,
    Link2,
    RefreshCw,
    Shield,
    Twitter,
    Webhook
} from "lucide-react";

// Mock integrations data
const INTEGRATIONS = [
    {
        id: "1",
        name: "Twitter",
        icon: Twitter,
        description: "Share quizzes and results on Twitter automatically.",
        connected: true,
        status: "active"
    },
    {
        id: "2",
        name: "Facebook",
        icon: Facebook,
        description: "Post quizzes and track engagement through Facebook.",
        connected: true,
        status: "active"
    },
    {
        id: "3",
        name: "Instagram",
        icon: Instagram,
        description: "Share quiz results as Instagram stories.",
        connected: false,
        status: "disconnected"
    },
    {
        id: "4",
        name: "Slack",
        icon: Code,
        description: "Get quiz completion notifications in your Slack channels.",
        connected: true,
        status: "active"
    },
    {
        id: "5",
        name: "Zapier",
        icon: Webhook,
        description: "Connect quizzes to thousands of apps with Zapier workflows.",
        connected: false,
        status: "disconnected"
    }
];

// Mock API keys
const API_KEYS = [
    {
        id: "api_123456",
        name: "Production API Key",
        key: "qz_prod_7f89a3d5e6b2c1f0",
        created: "2023-09-15",
        lastUsed: "2023-10-25",
        permissions: ["read", "write", "delete"]
    },
    {
        id: "api_789012",
        name: "Development API Key",
        key: "qz_dev_3a4b5c6d7e8f9g0h",
        created: "2023-10-01",
        lastUsed: "2023-10-24",
        permissions: ["read", "write"]
    }
];

// Mock webhooks
const WEBHOOKS = [
    {
        id: "wh_123456",
        name: "Quiz Completion Webhook",
        url: "https://example.com/webhook/quiz-complete",
        events: ["quiz.completed"],
        active: true,
        created: "2023-09-20"
    },
    {
        id: "wh_789012",
        name: "User Registration",
        url: "https://example.com/webhook/new-user",
        events: ["user.created"],
        active: false,
        created: "2023-10-05"
    }
];

export default function IntegrationsPage() {
    const [apiKeys, setApiKeys] = useState(API_KEYS);
    const [webhooks, setWebhooks] = useState(WEBHOOKS);
    const [integrations, setIntegrations] = useState(INTEGRATIONS);

    const toggleWebhook = (id: string) => {
        setWebhooks(webhooks.map(webhook =>
            webhook.id === id ? { ...webhook, active: !webhook.active } : webhook
        ));
    };

    const toggleIntegration = (id: string) => {
        setIntegrations(integrations.map(integration =>
            integration.id === id ? { ...integration, connected: !integration.connected, status: integration.connected ? "disconnected" : "active" } : integration
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Integrations & API</h1>
                    <p className="text-muted-foreground">
                        Connect your quizzes with other platforms and services.
                    </p>
                </div>
                <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    API Documentation
                </Button>
            </div>

            <Tabs defaultValue="integrations" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                </TabsList>

                <TabsContent value="integrations" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {integrations.map((integration) => (
                            <Card key={integration.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <integration.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{integration.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {integration.connected ? (
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                                                        Connected
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                                                        Disconnected
                                                    </Badge>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={integration.connected}
                                        onCheckedChange={() => toggleIntegration(integration.id)}
                                    />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {integration.description}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" size="sm" className="w-full">
                                        {integration.connected ? "Manage Integration" : "Connect"}
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="api-keys" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>API Keys</CardTitle>
                                <Button size="sm">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Generate New Key
                                </Button>
                            </div>
                            <CardDescription>
                                Manage your API keys for direct access to the Quiz API.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border">
                                {apiKeys.map((apiKey, index) => (
                                    <div key={apiKey.id} className={`p-4 ${index !== apiKeys.length - 1 ? 'border-b' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <h3 className="font-medium">{apiKey.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center bg-muted p-1 rounded text-sm">
                                                        <code className="text-xs">
                                                            {apiKey.key.substring(0, 10)}••••••••
                                                        </code>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                                            <Copy className="h-3 w-3" />
                                                            <span className="sr-only">Copy</span>
                                                        </Button>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {apiKey.permissions.join(", ")}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <Button variant="outline" size="sm">
                                                    Revoke
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                            <span>Created: {apiKey.created}</span>
                                            <span className="mx-2">•</span>
                                            <span>Last used: {apiKey.lastUsed}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Never share your API keys in client-side code.
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>API Usage</CardTitle>
                            <CardDescription>
                                Sample API requests to get you started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm">Get All Quizzes</Label>
                                <div className="flex mt-1.5 bg-muted rounded-md p-2 text-sm">
                                    <code className="text-xs overflow-x-auto w-full">
                                        curl -X GET "https://api.quizzer.app/v1/quizzes" \<br />
                                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
                                    </code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                        <Copy className="h-3 w-3" />
                                        <span className="sr-only">Copy</span>
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm">Create a Quiz</Label>
                                <div className="flex mt-1.5 bg-muted rounded-md p-2 text-sm">
                                    <code className="text-xs overflow-x-auto w-full">
                                        curl -X POST "https://api.quizzer.app/v1/quizzes" \<br />
                                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br />
                                        &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                                        &nbsp;&nbsp;-d '{"title": "My Quiz", "description": "Quiz description", ...}'
                                    </code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                        <Copy className="h-3 w-3" />
                                        <span className="sr-only">Copy</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webhooks" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Webhooks</CardTitle>
                                <Button size="sm">
                                    <Webhook className="mr-2 h-4 w-4" />
                                    Add Webhook
                                </Button>
                            </div>
                            <CardDescription>
                                Configure endpoints to receive real-time event notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border">
                                {webhooks.map((webhook, index) => (
                                    <div key={webhook.id} className={`p-4 ${index !== webhooks.length - 1 ? 'border-b' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{webhook.name}</h3>
                                                    {webhook.active ? (
                                                        <Badge variant="outline" className="bg-green-100 text-green-800">
                                                            <Check className="mr-1 h-3 w-3" />
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center mt-1">
                                                    <Link2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {webhook.url}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <Switch
                                                    checked={webhook.active}
                                                    onCheckedChange={() => toggleWebhook(webhook.id)}
                                                />
                                                <Button variant="outline" size="sm">
                                                    <RefreshCw className="mr-2 h-3 w-3" />
                                                    Test
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {webhook.events.map((event) => (
                                                <Badge key={event} variant="secondary" className="text-xs">
                                                    {event}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="px-0">
                                Learn more about webhook events
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 