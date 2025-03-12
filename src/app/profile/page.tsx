'use client';

import { ProfileLayout } from '@/components/profile/profile-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Mail, MapPin, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(user);

    // Simulate loading user data with delay
    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);
            try {
                console.log('Profile: Loading user data');
                // Simulate API call by wrapping the user data in a promise
                const data = await simulateLoading(Promise.resolve(user));
                console.log('Profile: User data loaded');
                setUserData(data);
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [simulateLoading]);

    const handleLogout = async () => {
        await logout();
        // No need to redirect here as logout function handles it
    };

    // Get initials for avatar fallback
    const getInitials = (name: string | null | undefined): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (isLoading) {
        return (
            <ProfileLayout
                title="Profile Overview"
                description="View and manage your account information"
            >
                <div className="space-y-6">
                    {/* Profile Card Skeleton */}
                    <Card className="overflow-hidden animate-pulse">
                        <div className="h-32 bg-muted"></div>
                        <CardContent className="pt-0">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="-mt-12">
                                    <div className="h-24 w-24 rounded-full bg-muted border-4 border-background"></div>
                                </div>
                                <div className="space-y-2 pt-2 w-full">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <Skeleton className="h-7 w-40" />
                                        <Skeleton className="h-5 w-20 ml-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-56" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions Card Skeleton */}
                    <Card className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-6 w-36" />
                            <Skeleton className="h-4 w-60" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <Skeleton className="h-20 w-full rounded-md" />
                                <Skeleton className="h-20 w-full rounded-md" />
                                <Skeleton className="h-20 w-full rounded-md" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Activity Card Skeleton */}
                    <Card className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-6 w-36" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ProfileLayout>
        );
    }

    return (
        <ProfileLayout
            title="Profile Overview"
            description="View and manage your account information"
        >
            <div className="space-y-6">
                {/* Profile Card */}
                <Card className="overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40"></div>
                    <CardContent className="pt-0">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="-mt-12">
                                <Avatar className="h-24 w-24 border-4 border-background">
                                    <AvatarImage src={userData?.image || ''} alt={userData?.name || 'User'} />
                                    <AvatarFallback className="text-xl">{getInitials(userData?.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-1 pt-2">
                                <div className="flex items-center flex-wrap gap-2">
                                    <h2 className="text-2xl font-semibold">{userData?.name || 'User'}</h2>
                                    <Badge variant="outline" className="capitalize ml-2">
                                        {userData?.role?.toLowerCase() || 'User'}
                                    </Badge>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <Mail className="h-4 w-4 mr-1" />
                                    <span>{userData?.email}</span>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>Location not specified</span>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    <span>Joined {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Quick Actions</CardTitle>
                        <CardDescription>Common tasks and actions for your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                className="h-auto py-4 justify-start"
                                onClick={() => router.push('/profile/edit')}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Edit Profile</span>
                                    <span className="text-xs text-muted-foreground">Update your information</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 justify-start"
                                onClick={() => router.push('/profile/change-password')}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Change Password</span>
                                    <span className="text-xs text-muted-foreground">Update your security</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto py-4 justify-start text-destructive"
                                onClick={handleLogout}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Logout</span>
                                    <span className="text-xs text-muted-foreground">Sign out of your account</span>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Activity Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Activity</CardTitle>
                        <CardDescription>Your latest account activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                    <UserRound className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Account Created</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                    <UserRound className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Last Login</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ProfileLayout>
    );
} 