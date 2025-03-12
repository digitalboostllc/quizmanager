"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Book,
  Brain,
  Calendar,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname() || '';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
        isScrolled
          ? "border-border/70 shadow-sm"
          : "border-border/40"
      )}
    >
      <div className="container h-16">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo and brand name */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-rooftop font-bold tracking-tight hover:opacity-90 transition-opacity"
            >
              {/* If you have a logo, uncomment this */}
              {/* <Image 
                src="/logo.svg" 
                alt="FB Quiz Logo" 
                width={32} 
                height={32} 
                className="h-8 w-auto" 
              /> */}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FB Quiz
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "px-3 gap-1",
                  pathname.startsWith("/quizzes") || pathname.startsWith("/templates")
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  Content <ChevronDown className="w-4 h-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/quizzes" className="w-full cursor-pointer">
                    Quizzes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/templates" className="w-full cursor-pointer">
                    Templates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/smart-generator" className="w-full cursor-pointer flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Smart Generator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/quizzes/new" className="w-full cursor-pointer flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create New Quiz
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild className={cn(
              "px-3",
              pathname.startsWith("/dictionary")
                ? "text-foreground"
                : "text-muted-foreground"
            )}>
              <Link href="/dictionary" className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                Dictionary
              </Link>
            </Button>

            <Button variant="ghost" asChild className={cn(
              "px-3",
              pathname.startsWith("/calendar")
                ? "text-foreground"
                : "text-muted-foreground"
            )}>
              <Link href="/calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Right side actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Search className="w-4 h-4" />
              </Button>

              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full cursor-pointer flex items-center gap-2">
                      <UserCircle className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full cursor-pointer flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/quizzes/new" className="w-full cursor-pointer flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create Quiz
                    </Link>
                  </DropdownMenuItem>
                  {isAuthenticated && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/auth/logout"
                        className="cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-rooftop">FB Quiz</SheetTitle>
                </SheetHeader>
                <div className="py-6 flex flex-col gap-4">
                  <Link
                    href="/quizzes"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    Quizzes
                  </Link>
                  <Link
                    href="/templates"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    Templates
                  </Link>
                  <Link
                    href="/smart-generator"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    <Brain className="w-4 h-4" />
                    Smart Generator
                  </Link>
                  <Link
                    href="/dictionary"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    <Book className="w-4 h-4" />
                    Dictionary
                  </Link>
                  <Link
                    href="/calendar"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <div className="mt-4 border-t pt-4">
                    <Button asChild className="w-full">
                      <Link href="/quizzes/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quiz
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 