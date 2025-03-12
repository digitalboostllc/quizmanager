'use client';

import { ProfileLayout } from '@/components/profile/profile-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { simulateLoading } = useLoadingDelay();

    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(user);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Simulate loading user data with delay
    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);
            try {
                console.log('Profile Edit: Loading user data');
                // Simulate API call by wrapping the user data in a promise
                const data = await simulateLoading(Promise.resolve(user));
                console.log('Profile Edit: User data loaded');
                setUserData(data);

                // Set form values from user data
                setName(data?.name || '');
                setEmail(data?.email || '');
                setBio((data as any)?.bio || '');
                setLocation((data as any)?.location || '');
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [simulateLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        // In a real app, you'd make an API call to update the profile
        // For this demo, we'll just show a success toast and redirect
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });

            router.push('/profile');
        } catch (error) {
            toast({
                title: "Error",
                description: "There was an error updating your profile.",
                variant: "destructive",
            });
        } finally {
            setFormLoading(false);
        }
    };

    if (isLoading) {
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

    return (
        <ProfileLayout
            title="Edit Profile"
            description="Update your personal information and preferences"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                        Update your profile details visible to other users
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email"
                                    disabled // Email is usually not editable
                                />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, Country (Optional)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us a little about yourself (Optional)"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/profile')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={formLoading}
                        >
                            {formLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </ProfileLayout>
    );
} 