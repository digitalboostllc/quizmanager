"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Bell,
    Book,
    Brain,
    Calendar,
    CreditCard,
    Database,
    FileQuestion,
    FolderOpen,
    HardDrive,
    LayoutDashboard,
    Link2,
    LogOut,
    Menu,
    Palette,
    Settings,
    ShieldAlert,
    Sparkles,
    Store,
    UserCircle,
    Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

interface NavItem {
    title: string;
    path: string;
    icon: ReactNode;
    section?: string; // For grouping in sidebar
    badge?: string; // Optional badge text
}

// Navigation items for the dashboard
const navItems: NavItem[] = [
    {
        title: "Overview",
        path: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        section: "main"
    },
    {
        title: "Quizzes",
        path: "/dashboard/quizzes",
        icon: <FileQuestion className="h-4 w-4" />,
        section: "main"
    },
    {
        title: "Templates",
        path: "/dashboard/templates",
        icon: <Palette className="h-4 w-4" />,
        section: "main"
    },
    {
        title: "Calendar",
        path: "/dashboard/calendar",
        icon: <Calendar className="h-4 w-4" />,
        section: "main"
    },
    {
        title: "Library",
        path: "/dashboard/library",
        icon: <FolderOpen className="h-4 w-4" />,
        section: "tools"
    },
    {
        title: "Dictionary",
        path: "/dashboard/dictionary",
        icon: <Book className="h-4 w-4" />,
        section: "tools"
    },
    {
        title: "AI Generator",
        path: "/dashboard/ai-generator",
        icon: <Brain className="h-4 w-4" />,
        badge: "Pro",
        section: "tools"
    },
    {
        title: "Smart Generator",
        path: "/dashboard/smart-generator",
        icon: <Sparkles className="h-4 w-4" />,
        section: "tools"
    },
    {
        title: "Team",
        path: "/dashboard/team",
        icon: <Users className="h-4 w-4" />,
        section: "management"
    },
    {
        title: "Integrations",
        path: "/dashboard/integrations",
        icon: <Link2 className="h-4 w-4" />,
        section: "management"
    },
    {
        title: "Analytics",
        path: "/dashboard/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        badge: "New",
        section: "insights"
    },
    {
        title: "Content Usage",
        path: "/dashboard/content-usage",
        icon: <Database className="h-4 w-4" />,
        badge: "New",
        section: "insights"
    },
    {
        title: "Notifications",
        path: "/dashboard/notifications",
        icon: <Bell className="h-4 w-4" />,
        section: "account"
    },
    {
        title: "Profile",
        path: "/dashboard/profile",
        icon: <UserCircle className="h-4 w-4" />,
        section: "account"
    },
    {
        title: "Settings",
        path: "/dashboard/settings",
        icon: <Settings className="h-4 w-4" />,
        section: "account"
    }
];

// Admin navigation items
const adminNavItems: NavItem[] = [
    {
        title: "Users",
        path: "/dashboard/admin/users",
        icon: <Users className="h-4 w-4" />,
        section: "admin"
    },
    {
        title: "Organizations",
        path: "/dashboard/admin/organizations",
        icon: <HardDrive className="h-4 w-4" />,
        section: "admin"
    },
    {
        title: "Subscriptions",
        path: "/dashboard/admin/subscriptions",
        icon: <CreditCard className="h-4 w-4" />,
        section: "admin"
    },
    {
        title: "Plans",
        path: "/dashboard/admin/plans",
        icon: <Store className="h-4 w-4" />,
        section: "admin"
    },
    {
        title: "Analytics",
        path: "/dashboard/admin/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        section: "admin"
    },
    {
        title: "Settings",
        path: "/dashboard/admin/settings",
        icon: <Settings className="h-4 w-4" />,
        section: "admin"
    }
];

// Group navigation items by section
const sections = {
    main: { label: "Main", items: navItems.filter(item => item.section === "main") },
    tools: { label: "Tools", items: navItems.filter(item => item.section === "tools") },
    management: { label: "Management", items: navItems.filter(item => item.section === "management") },
    insights: { label: "Insights", items: navItems.filter(item => item.section === "insights") },
    account: { label: "Account", items: navItems.filter(item => item.section === "account") },
};

export function AdaptiveDashboardShell({
    children
}: {
    children: ReactNode
}) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user, logout } = useAuth();

    // Combine regular nav items and admin items if user is admin
    const allNavItems = [...navItems, ...(user?.role === "ADMIN" ? adminNavItems : [])];

    // Enhanced sections object with admin section if user is admin
    const enhancedSections = {
        ...sections,
        ...(user?.role === "ADMIN" ? {
            admin: {
                label: "Administration",
                items: adminNavItems
            }
        } : {})
    };

    // Get current page title from all nav items
    const currentPage = allNavItems.find(item =>
        pathname === item.path ||
        (pathname.startsWith(item.path) && item.path !== '/dashboard')
    );

    // Check if current path is an admin path
    const isAdminPath = pathname.includes('/dashboard/admin');

    // Badge component with design system styling
    const NavBadge = ({ text, variant }: { text: string, variant?: 'new' | 'pro' | 'default' }) => {
        const badgeClasses = cn(
            "ml-auto text-xs font-medium px-1.5 py-0.5 rounded-sm",
            variant === 'new' ? "bg-blue-500/10 text-blue-500 border-blue-200" :
                variant === 'pro' ? "bg-amber-500/10 text-amber-500 border-amber-200" :
                    "bg-slate-500/10 text-slate-500 border-slate-200"
        );

        return <span className={badgeClasses}>{text}</span>;
    };

    // Navigation item component with design system typography
    const NavItemComponent = ({ item, onClick }: { item: NavItem, onClick?: () => void }) => {
        const isActive = pathname === item.path ||
            (pathname.startsWith(item.path) && item.path !== '/dashboard');

        return (
            <Link
                href={item.path}
                onClick={onClick}
                className={cn(
                    "flex items-center justify-between rounded-md py-1.5 px-3 text-sm transition-all duration-200",
                    isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:text-foreground hover:bg-primary/5"
                )}
            >
                <div className="flex items-center min-w-0">
                    <span className={cn(
                        "flex-shrink-0 mr-2 transition-transform duration-200",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        {item.icon}
                    </span>

                    <span className="truncate">{item.title}</span>
                </div>

                {item.badge && (
                    <NavBadge
                        text={item.badge}
                        variant={item.badge.toLowerCase() === 'new' ? 'new' :
                            item.badge.toLowerCase() === 'pro' ? 'pro' : 'default'}
                    />
                )}
            </Link>
        );
    };

    // Section heading component with design system typography
    const SectionHeading = ({ label, icon }: { label: string, icon?: ReactNode }) => (
        <h4 className="flex items-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-3 py-1">
            {icon && <span className="mr-1.5 opacity-70">{icon}</span>}
            {label}
        </h4>
    );

    return (
        <div className="flex min-h-screen relative overflow-hidden bg-background">
            {/* Abstract background shapes */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -z-10 opacity-60" />

            {/* Mobile navbar with correctly structured Sheet */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <div className="lg:hidden sticky top-0 z-40 h-16 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4">
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 border-primary/20 bg-primary/5"
                        >
                            <Menu className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>

                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold">{currentPage?.title || 'Dashboard'}</h1>
                        {isAdminPath && (
                            <span className="bg-primary/10 text-xs font-medium px-2 py-0.5 rounded">Admin</span>
                        )}
                    </div>
                </div>

                <SheetContent side="left" className="p-0 w-72">
                    {/* Logo restored - with equal spacing */}
                    <div className="flex items-center h-14 px-4 border-b border-primary/15 bg-primary/5">
                        <Link href="/" onClick={() => setIsMobileOpen(false)} className="transition-transform hover:scale-105">
                            <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-0">
                                Quizzer
                            </h2>
                        </Link>
                    </div>

                    {/* Mobile navigation - No logo, starts directly with navigation */}
                    <ScrollArea className="py-2 px-2 h-[calc(100vh-135px)]">
                        {/* User profile at top - more integrated design */}
                        <div className="mb-3 rounded-md bg-primary/10 p-2.5 border border-primary/15">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/90 to-blue-600/90 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-xs font-medium truncate">{user?.email || user?.name || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">Pro Plan</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        logout();
                                        setIsMobileOpen(false);
                                    }}
                                >
                                    <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="sr-only">Logout</span>
                                </Button>
                            </div>
                        </div>

                        <nav className="flex flex-col">
                            {Object.entries(enhancedSections).map(([key, section]) => (
                                <div key={key} className="mb-2">
                                    <SectionHeading label={section.label} />

                                    <div className="space-y-0.5 mt-1">
                                        {section.items.map((item) => (
                                            <NavItemComponent key={item.path} item={item} onClick={() => setIsMobileOpen(false)} />
                                        ))}
                                    </div>

                                    {key !== "account" && <div className="h-px bg-primary/10 mt-2" />}
                                </div>
                            ))}
                        </nav>
                    </ScrollArea>

                    {/* Create Quiz button for mobile */}
                    <div className="p-3 border-t border-primary/15">
                        <Link
                            href="/dashboard/quizzes/new"
                            onClick={() => setIsMobileOpen(false)}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200 text-primary"
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">Create Quiz</span>
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar - redesigned with no logo */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 border-r border-primary/20 bg-gradient-to-b from-primary/5 to-background backdrop-blur-sm z-50 h-screen w-56 shadow-sm">
                {/* Logo restored - with equal spacing */}
                <div className="flex items-center h-14 px-4 border-b border-primary/15 bg-primary/5 relative">
                    <div className="absolute -left-10 -top-10 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
                    <Link href="/" className="transition-transform hover:scale-105">
                        <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-0">
                            Quizzer
                        </h2>
                    </Link>
                </div>

                {/* Navigation - more compact */}
                <ScrollArea className="flex-1 py-3 px-3 overflow-x-hidden">
                    <nav className="flex flex-col space-y-1">
                        {Object.entries(enhancedSections).map(([key, section]) => (
                            <div key={key} className="py-2">
                                <SectionHeading label={section.label} />

                                <div className="space-y-1 mt-1">
                                    {section.items.map((item) => (
                                        <NavItemComponent key={item.path} item={item} />
                                    ))}
                                </div>

                                {key !== "account" && <div className="h-px bg-primary/10 mt-2" />}
                            </div>
                        ))}
                    </nav>

                    {/* Create Quiz button - more visible */}
                    <div className="mt-4 px-1">
                        <Link
                            href="/dashboard/quizzes/new"
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200 text-sm text-primary"
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">Create Quiz</span>
                        </Link>
                    </div>
                </ScrollArea>

                {/* User profile at the bottom */}
                <div className="p-3 border-t border-primary/10 mt-auto">
                    <div className="flex items-center rounded-md bg-primary/5 p-2.5 border border-primary/10">
                        <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/90 to-blue-600/90 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                        </div>
                        <div className="ml-2.5 overflow-hidden">
                            <p className="text-sm font-medium truncate max-w-[150px]">{user?.email || user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">Pro Plan</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-7 w-7"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content area - adjusted for wider sidebar */}
            <main className="flex-1 lg:ml-56">
                {/* Admin indicator - simple text, no special styling */}
                {isAdminPath && (
                    <div className="bg-primary/5 border-y border-primary/10 py-1.5 px-4 text-sm text-foreground flex items-center justify-center">
                        <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                        Admin Dashboard
                    </div>
                )}

                {/* Mobile header */}
                <header className="h-16 border-b bg-background/95 backdrop-blur-sm lg:hidden sticky top-0 z-40 flex items-center px-12">
                    <h1 className="text-xl font-bold">{currentPage?.title || 'Dashboard'}</h1>
                </header>

                {/* Admin breadcrumb with standard styling */}
                {isAdminPath && (
                    <nav className="flex py-2 px-4 bg-muted/10 border-b">
                        <ol className="flex items-center space-x-2 text-xs">
                            <li>
                                <Link href="/dashboard" className="text-foreground hover:text-primary">
                                    Dashboard
                                </Link>
                            </li>
                            <li className="text-muted-foreground">/</li>
                            <li>
                                <Link href="/dashboard/admin" className="text-foreground hover:text-primary">
                                    Admin
                                </Link>
                            </li>
                            <li className="text-muted-foreground">/</li>
                            <li className="text-primary font-medium">{currentPage?.title || 'Dashboard'}</li>
                        </ol>
                    </nav>
                )}

                {/* Page content */}
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
} 