'use client';

import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const performLogout = async () => {
            // Clear localStorage items
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('next-auth')) {
                    localStorage.removeItem(key);
                }
            });

            // Clear cookies
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

                if (name.includes('next-auth') || name === process.env.NEXT_PUBLIC_COOKIE_NAME) {
                    document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
                    document.cookie = `${name}=; Max-Age=0; path=/`;
                }
            }

            // Call NextAuth signOut
            await signOut({ redirect: false });

            // Wait a moment to ensure everything is cleared
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 500);
        };

        performLogout();
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingIndicator />
            <h1 className="mt-4 text-2xl font-semibold">Logging out...</h1>
            <p className="mt-2 text-muted-foreground">Please wait while we sign you out.</p>
        </div>
    );
} 