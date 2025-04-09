'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BellOff,
    BellRing,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Heart,
    MessageSquare,
    Settings,
    Star,
    ThumbsUp,
    Trash,
    UserPlus
} from "lucide-react";
import { useState } from "react";

// Mock notifications data
const NOTIFICATIONS = [
    {
        id: "1",
        type: "quiz_completed",
        title: "New Quiz Completion",
        message: "Sarah J. completed your Math Quiz #4 with a score of 92%",
        time: "Just now",
        read: false,
        icon: CheckCircle,
        iconColor: "text-green-500"
    },
    {
        id: "2",
        type: "comment",
        title: "New Comment",
        message: "John D. commented on your Science Quiz: \"Great questions, very challenging!\"",
        time: "2 hours ago",
        read: false,
        icon: MessageSquare,
        iconColor: "text-blue-500"
    },
    {
        id: "3",
        type: "like",
        title: "Quiz Liked",
        message: "Your History Quiz was liked by 5 new users",
        time: "Yesterday",
        read: true,
        icon: Heart,
        iconColor: "text-pink-500"
    },
    {
        id: "4",
        type: "scheduled",
        title: "Quiz Published",
        message: "Your Geography Quiz #2 has been automatically published",
        time: "2 days ago",
        read: true,
        icon: Calendar,
        iconColor: "text-purple-500"
    },
    {
        id: "5",
        type: "team",
        title: "Team Invitation Accepted",
        message: "Casey Morgan accepted your invitation to join the team",
        time: "3 days ago",
        read: true,
        icon: UserPlus,
        iconColor: "text-teal-500"
    },
    {
        id: "6",
        type: "rating",
        title: "New Ratings",
        message: "Your quizzes received 12 new ratings this week, averaging 4.8/5",
        time: "4 days ago",
        read: true,
        icon: Star,
        iconColor: "text-amber-500"
    },
    {
        id: "7",
        type: "quiz_completed",
        title: "Quiz Milestone",
        message: "Your Math Quiz #3 has reached 100 completions!",
        time: "5 days ago",
        read: true,
        icon: ThumbsUp,
        iconColor: "text-indigo-500"
    }
];

// Notification preferences
const NOTIFICATION_PREFERENCES = [
    {
        id: "quiz_completions",
        title: "Quiz Completions",
        description: "Get notified when someone completes your quiz",
        email: true,
        push: true,
        inApp: true
    },
    {
        id: "comments",
        title: "Comments & Feedback",
        description: "Receive notifications for comments on your quizzes",
        email: true,
        push: true,
        inApp: true
    },
    {
        id: "likes",
        title: "Likes & Ratings",
        description: "Be notified when your quizzes receive likes or ratings",
        email: false,
        push: true,
        inApp: true
    },
    {
        id: "team",
        title: "Team Activity",
        description: "Updates about team members and collaboration",
        email: true,
        push: false,
        inApp: true
    },
    {
        id: "scheduled",
        title: "Scheduled Actions",
        description: "Notifications for scheduled publishing and other automated tasks",
        email: true,
        push: true,
        inApp: true
    },
    {
        id: "marketing",
        title: "Marketing & Tips",
        description: "Receive tips, best practices, and promotional updates",
        email: false,
        push: false,
        inApp: true
    }
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(NOTIFICATIONS);
    const [preferences, setPreferences] = useState(NOTIFICATION_PREFERENCES);
    const [filter, setFilter] = useState("all");

    const unreadCount = notifications.filter(n => !n.read).length;

    // Filter notifications based on selected tab
    const filteredNotifications = notifications.filter(notification => {
        if (filter === "all") return true;
        if (filter === "unread") return !notification.read;
        return true;
    });

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    };

    const removeNotification = (id: string) => {
        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    const togglePreference = (id: string, type: 'email' | 'push' | 'inApp') => {
        setPreferences(preferences.map(pref =>
            pref.id === id ? { ...pref, [type]: !pref[type] } : pref
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Manage all your notifications and preferences.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        <Eye className="mr-2 h-4 w-4" />
                        Mark All Read
                    </Button>
                    <Button variant="outline" onClick={clearAllNotifications} disabled={notifications.length === 0}>
                        <Trash className="mr-2 h-4 w-4" />
                        Clear All
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="notifications" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="notifications" className="relative">
                        Notifications
                        {unreadCount > 0 && (
                            <Badge className="ml-2 bg-primary text-primary-foreground hover:bg-primary">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                            <Button
                                variant={filter === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === "unread" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter("unread")}
                            >
                                Unread
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Recent Notifications</CardTitle>
                            <CardDescription>
                                {filteredNotifications.length === 0
                                    ? "No notifications to display"
                                    : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredNotifications.length > 0 ? (
                                <div className="divide-y">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start gap-4 p-4 ${!notification.read ? 'bg-muted/30' : ''}`}
                                        >
                                            <div className={`rounded-full p-2 ${notification.iconColor} bg-primary/10`}>
                                                <notification.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        {notification.title}
                                                    </p>
                                                    <div className="flex items-center">
                                                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                                                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!notification.read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Mark as read</span>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() => removeNotification(notification.id)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="rounded-full bg-muted p-3 mb-3">
                                        <BellOff className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium">No notifications found</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {filter === "unread"
                                            ? "You've read all your notifications. Check back later!"
                                            : "You don't have any notifications yet. Check back later!"}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        {filteredNotifications.length > 0 && (
                            <CardFooter className="border-t px-6 py-4">
                                <Button variant="link" className="mx-auto">
                                    View All Notifications
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Control what notifications you receive and how you receive them.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {preferences.map((preference) => (
                                    <div key={preference.id} className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="space-y-0.5">
                                                <h3 className="text-base font-medium">{preference.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {preference.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <Switch
                                                        id={`${preference.id}-email`}
                                                        checked={preference.email}
                                                        onCheckedChange={() => togglePreference(preference.id, 'email')}
                                                    />
                                                    <label
                                                        htmlFor={`${preference.id}-email`}
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Email
                                                    </label>
                                                </div>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <Switch
                                                        id={`${preference.id}-push`}
                                                        checked={preference.push}
                                                        onCheckedChange={() => togglePreference(preference.id, 'push')}
                                                    />
                                                    <label
                                                        htmlFor={`${preference.id}-push`}
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Push
                                                    </label>
                                                </div>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <Switch
                                                        id={`${preference.id}-inapp`}
                                                        checked={preference.inApp}
                                                        onCheckedChange={() => togglePreference(preference.id, 'inApp')}
                                                    />
                                                    <label
                                                        htmlFor={`${preference.id}-inapp`}
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        In-App
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex flex-col sm:flex-row sm:justify-between gap-4 px-6 py-4">
                            <div className="flex items-start gap-4">
                                <BellRing className="h-5 w-5 text-primary mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium">Need more granular control?</h4>
                                    <p className="text-xs text-muted-foreground">
                                        You can set up advanced notification rules for specific quizzes and team members.
                                    </p>
                                </div>
                            </div>
                            <Button className="sm:self-end" variant="outline">
                                <Settings className="mr-2 h-4 w-4" />
                                Advanced Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 