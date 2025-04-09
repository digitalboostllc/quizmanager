"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LogIn, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname() || '';
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isScrolled
          ? "border-border/70 shadow-sm h-16"
          : "border-border/40 h-20"
      )}
    >
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo with animated gradient */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity group"
          >
            <div className="relative overflow-hidden">
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-violet-500 bg-clip-text text-transparent 
                              bg-[size:400%] animate-gradient group-hover:animate-gradient-fast">
                FB Quiz
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-violet-500/10 opacity-0 
                            group-hover:opacity-100 blur-xl transition-opacity duration-500 
                            rounded-full -z-10"></div>
            </div>
          </Link>

          {/* Login and Get Started buttons */}
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" className="px-4">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="px-2 sm:px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Get started now</span>
                    <span className="sm:hidden">Get started</span>
                  </Button>
                </Link>
                {/* Mobile login button */}
                <Link href="/auth/login" className="sm:hidden">
                  <Button variant="outline" size="icon" className="w-9 h-9">
                    <LogIn className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="outline" className="px-4">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 