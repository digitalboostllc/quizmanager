'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Calendar, Facebook, Bell, Clock, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const sidebarNavItems = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Facebook",
    href: "/settings/facebook",
    icon: Facebook,
  },
  {
    title: "Calendar",
    href: "/settings/calendar",
    icon: Calendar,
  },
  {
    title: "Auto Schedule",
    href: "/settings/auto-schedule",
    icon: Clock,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
];

// Add debug section only in development
if (process.env.NODE_ENV === 'development') {
  sidebarNavItems.push({
    title: "Debug",
    href: "/settings/debug",
    icon: Bug,
  });
}

export function SettingsNav() {
  const pathname = usePathname();
  
  return (
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
      {sidebarNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start w-full",
              isActive
                ? "bg-muted text-muted-foreground pointer-events-none"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              "transition-all"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
} 