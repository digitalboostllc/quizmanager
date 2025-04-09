import { DashboardGuard } from "@/components/dashboard/DashboardGuard";
import { UserRole } from '@/hooks/useAuth';

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardGuard requiredRole={UserRole.ADMIN}>
            {children}
        </DashboardGuard>
    );
} 