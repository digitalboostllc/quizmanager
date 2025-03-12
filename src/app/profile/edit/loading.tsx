'use client';

import { ProfileLayout } from '@/components/profile/profile-layout';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function EditProfileLoading() {
    return (
        <ProfileLayout
            title="Edit Profile"
            description="Update your personal information and preferences"
        >
            <Card className="animate-pulse">
                <CardHeader>
                    <div className="h-6 w-40 bg-muted rounded"></div>
                    <div className="h-4 w-60 bg-muted rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-muted rounded"></div>
                            <div className="h-10 w-full bg-muted rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-muted rounded"></div>
                            <div className="h-10 w-full bg-muted rounded"></div>
                            <div className="h-4 w-40 bg-muted rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-muted rounded"></div>
                        <div className="h-10 w-full bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-muted rounded"></div>
                        <div className="h-24 w-full bg-muted rounded"></div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                    <div className="h-10 w-24 bg-muted rounded"></div>
                    <div className="h-10 w-24 bg-muted rounded"></div>
                </CardFooter>
            </Card>
        </ProfileLayout>
    );
} 