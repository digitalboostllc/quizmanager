import { LayoutClient } from "@/components/layout-client";
import { AuthErrorHandler } from '@/components/providers/AuthErrorHandler';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Toaster } from "@/components/toaster";
import { LoadingDelayProvider } from "@/contexts/LoadingDelayContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Quiz Generator",
  description: "Create engaging quiz content for Facebook",
};

// Force dynamic rendering to ensure fresh session on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <SessionProvider>
          <LoadingDelayProvider>
            <LayoutClient>{children}</LayoutClient>
            <Toaster />
            <AuthErrorHandler />
          </LoadingDelayProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
