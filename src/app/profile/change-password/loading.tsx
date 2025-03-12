'use client';

import { ProfileLayout } from '@/components/profile/profile-layout';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function ChangePasswordLoading() {
    return (
        <ProfileLayout
            title="Change Password"
            description="Update your account password and security settings"
        >
            <Card className="animate-pulse">
                <CardHeader>
                    <div className="h-6 w-40 bg-muted rounded"></div>
                    <div className="h-4 w-60 bg-muted rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="h-4 w-36 bg-muted rounded"></div>
                        <div className="h-10 w-full bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded"></div>
                        <div className="h-10 w-full bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-40 bg-muted rounded"></div>
                        <div className="h-10 w-full bg-muted rounded"></div>
                    </div>
                    <div className="h-16 w-full bg-muted rounded"></div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                    <div className="h-10 w-40 bg-muted rounded"></div>
                </CardFooter>
            </Card>
        </ProfileLayout>
    );
} 