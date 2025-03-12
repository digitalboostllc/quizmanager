'use client';

import { ProfileLayout } from '@/components/profile/profile-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ChangePasswordPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { simulateLoading } = useLoadingDelay();

    const [isLoading, setIsLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Simulate loading user data with delay
    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);
            try {
                console.log('Change Password: Loading user data');
                // Simulate API call with loading delay
                await simulateLoading(Promise.resolve());
                console.log('Change Password: User data loaded');
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [simulateLoading]);

    const validateForm = () => {
        if (!currentPassword) {
            setError('Current password is required');
            return false;
        }

        if (!newPassword) {
            setError('New password is required');
            return false;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setFormLoading(true);

        // In a real app, you'd make an API call to change the password
        // For this demo, we'll just show a success toast and redirect
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            toast({
                title: "Password changed",
                description: "Your password has been changed successfully.",
            });

            // Clear the form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setFormLoading(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "There was an error changing your password.",
                variant: "destructive",
            });
            setFormLoading(false);
        }
    };

    // Password strength indicators
    const getPasswordStrength = (password: string) => {
        if (!password) return 0;
        let strength = 0;

        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;

        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        return Math.min(strength, 5);
    };

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strength = getPasswordStrength(newPassword);
    const strengthLabel = strengthLabels[strength];
    const strengthColors = ['bg-destructive/20', 'bg-destructive/50', 'bg-orange-500/50', 'bg-yellow-500/50', 'bg-green-500/50', 'bg-green-500'];

    if (isLoading) {
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

    return (
        <ProfileLayout
            title="Change Password"
            description="Update your password to keep your account secure"
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>
                        Keep your account secure by regularly updating your password
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Your current password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Your new password"
                            />

                            {/* Password strength meter */}
                            {newPassword && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Password Strength</span>
                                        <span className={strength > 2 ? 'text-green-600' : 'text-destructive'}>
                                            {strengthLabel}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strengthColors[strength]}`}
                                            style={{ width: `${(strength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-1">
                                Password must be at least 8 characters long and include uppercase, lowercase, numbers and special characters for best security
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button
                            type="submit"
                            disabled={formLoading}
                            className="ml-auto" // Right align the button
                        >
                            {formLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating Password...
                                </>
                            ) : 'Change Password'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </ProfileLayout>
    );
} 