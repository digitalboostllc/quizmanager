import '@/app/globals.css';
import { AdaptiveDashboardShell } from "@/components/dashboard/adaptive-shell";
import { DashboardGuard } from "@/components/dashboard/DashboardGuard";
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <DashboardGuard>
                <AdaptiveDashboardShell>{children}</AdaptiveDashboardShell>
            </DashboardGuard>
        </ThemeProvider>
    );
} 