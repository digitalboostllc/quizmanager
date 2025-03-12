'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface SideNavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
}

interface SideNavProps {
  items: SideNavItem[];
  className?: string;
}

export function SideNav({ items, className }: SideNavProps) {
  const pathname = usePathname();
  
  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start w-full",
            pathname === item.href
              ? "bg-muted text-muted-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            "transition-all"
          )}
        >
          {item.icon && <item.icon className="mr-2 h-4 w-4" />}
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 