'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { cn } from "@/lib/utils";
import { ArrowRight, BarChart3, Brain, Calendar, Calendar as CalendarIcon, Check, ChevronRight, Clock, CreditCard, Gem, Image, Lightbulb, MessageSquare, Search, Shield, Sparkles, Star, Target, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  /* Custom CSS for full gradient coverage */
  const fullCoverageStyles = {
    heroGradient: "before:content-[''] before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-indigo-600 before:via-primary before:to-purple-700 before:top-[-20px] before:left-[-20px] before:right-[-20px] before:bottom-[-20px]",
    ctaGradient: "before:content-[''] before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-indigo-600 before:via-primary before:to-purple-700 before:top-[-20px] before:left-[-20px] before:right-[-20px] before:bottom-[-20px]"
  };

  // State for pricing toggle (monthly/annual)
  const [annualBilling, setAnnualBilling] = useState(true);
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  // Load page data with simulated delay
  useEffect(() => {
    const loadPageData = async () => {
      try {
        console.log("Loading home page data...");
        // Create a promise that resolves with the page data
        const dataPromise = Promise.resolve({
          loaded: true,
          timestamp: new Date().toISOString()
        });

        // Apply loading delay
        const data = await simulateLoading(dataPromise);
        console.log("Home page data loaded successfully");
        setPageData(data);
      } catch (error) {
        console.error("Error loading home page data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [simulateLoading]);

  // Hero section loading skeleton
  const HeroSkeleton = () => (
    <div className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl space-y-6 animate-pulse">
          <Skeleton className="h-16 w-3/4 md:h-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
      </div>
    </div>
  );

  // Features section loading skeleton
  const FeaturesSkeleton = () => (
    <div className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-pulse">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-6 bg-background rounded-lg shadow-sm border border-border/60 space-y-4 animate-pulse">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Pricing section loading skeleton
  const PricingSkeleton = () => (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-pulse">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className={cn("relative animate-pulse", i === 1 ? "border-primary/50 shadow-md" : "")}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-baseline mt-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-16 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(5).fill(0).map((_, j) => (
                  <div key={j} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <HeroSkeleton />
        <FeaturesSkeleton />
        <PricingSkeleton />
      </div>
    );
  }

  // Pricing plans data
  const pricingPlans = [
    {
      name: "Starter",
      description: "Perfect for individual content creators and small pages",
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        "Up to 10 quizzes per month",
        "Basic templates library",
        "Manual scheduling",
        "7-day post history",
        "Standard support"
      ],
      cta: "Start with Starter",
      icon: Brain,
      popular: false
    },
    {
      name: "Professional",
      description: "For growing brands and content professionals",
      monthlyPrice: 24.99,
      annualPrice: 249.99,
      features: [
        "Unlimited quizzes",
        "Full template library",
        "AI-powered scheduling",
        "30-day post history",
        "Advanced analytics",
        "Priority support",
        "Customizable branding"
      ],
      cta: "Go Professional",
      icon: Gem,
      popular: true
    },
    {
      name: "Enterprise",
      description: "For large teams and businesses with multiple accounts",
      monthlyPrice: 49.99,
      annualPrice: 499.99,
      features: [
        "Everything in Professional",
        "Multiple user accounts",
        "Team collaboration tools",
        "Unlimited post history",
        "Advanced customization",
        "Dedicated account manager",
        "API access",
        "Custom template creation"
      ],
      cta: "Contact Sales",
      icon: Shield,
      popular: false
    }
  ];

  // Example recent quizzes - this would come from a database in a real app
  const recentQuizzes = [
    {
      id: 1,
      title: "Geography Challenge",
      category: "Education",
      engagement: 87,
      date: "3 days ago"
    },
    {
      id: 2,
      title: "Movie Trivia",
      category: "Entertainment",
      engagement: 92,
      date: "1 week ago"
    },
    {
      id: 3,
      title: "Science Facts",
      category: "Education",
      engagement: 76,
      date: "2 weeks ago"
    }
  ];

  // Stats for the dashboard
  const stats = [
    { label: "Total Quizzes", value: "24", icon: Brain, color: "bg-blue-500" },
    { label: "Engagement Rate", value: "84%", icon: Target, color: "bg-green-500" },
    { label: "Quiz Views", value: "12.4K", icon: BarChart3, color: "bg-purple-500" },
    { label: "Scheduled", value: "8", icon: CalendarIcon, color: "bg-amber-500" }
  ];

  // Weekly schedule visualization
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const scheduledDays = [1, 3, 5]; // Example scheduled days (Tue, Thu, Sat)

  // Testimonials
  const testimonials = [
    {
      quote: "FB Quiz has completely transformed our social media engagement. Our audience loves the interactive content!",
      author: "Sarah Johnson",
      title: "Marketing Director",
      company: "Global Brands Inc."
    },
    {
      quote: "The scheduling features save us hours every week. Incredibly intuitive and powerful platform.",
      author: "Michael Chen",
      title: "Content Creator",
      company: "Digital Trends"
    },
    {
      quote: "Our quiz engagement rates are up 47% since switching to FB Quiz. The analytics are top-notch.",
      author: "Emily Rodriguez",
      title: "Social Media Manager",
      company: "Creative Solutions"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with enhanced productive gradient background */}
      <section className={`relative overflow-hidden py-12 md:py-16 ${fullCoverageStyles.heroGradient}`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        {/* Radial glow effects - extending past boundaries to ensure full coverage */}
        <div className="absolute top-0 left-0 right-0 bottom-0 -inset-4 bg-[radial-gradient(circle_800px_at_20%_20%,rgba(255,255,255,0.15),transparent)]"></div>
        <div className="absolute top-0 left-0 right-0 bottom-0 -inset-4 bg-[radial-gradient(circle_600px_at_80%_80%,rgba(120,0,255,0.2),transparent)]"></div>

        {/* Animated floating shapes */}
        <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[5%] w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse delay-1000"></div>

        <div className="container py-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Create, Schedule, Engage
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
                Supercharge Your Facebook Quiz Content
              </h1>

              <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                Build stunning quizzes, schedule posts automatically, and keep your audience engaged with FB Quiz—the all-in-one platform for social content creators.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-12 px-6 bg-white text-primary hover:bg-white/90 shadow-md">
                  <Link href="/quizzes/new" className="flex items-center">
                    Create a New Quiz <Zap className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button size="lg" variant="outline" className="h-12 px-6 bg-white/10 backdrop-blur-sm border-white/50 text-white hover:bg-white/20 hover:border-white">
                  <Link href="/templates" className="flex items-center">
                    Explore Templates <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-1.5 text-green-300" />
                  Beautiful Templates
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-1.5 text-green-300" />
                  Auto Scheduling
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-1.5 text-green-300" />
                  Performance Analytics
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-1.5 shadow-md border border-white/20 max-w-md mx-auto hover:shadow-lg transition-all duration-300">
                <div className="absolute -top-3 -right-3 bg-white rounded-full px-3 py-1 text-xs font-medium text-primary shadow-md flex items-center">
                  <Lightbulb className="h-3.5 w-3.5 mr-1" />
                  Preview Mode
                </div>

                <div className="bg-white/5 rounded-lg overflow-hidden">
                  <div className="h-12 bg-black/20 flex items-center justify-center text-white font-medium">
                    Geography Challenge
                  </div>
                  <div className="aspect-[4/3] bg-black/10 flex items-center justify-center p-6">
                    <div className="text-center text-white space-y-4">
                      <h3 className="text-xl font-semibold text-white">What is the capital of France?</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 hover:bg-white/20 transition py-2 px-3 rounded cursor-pointer">London</div>
                        <div className="bg-white/10 hover:bg-white/20 transition py-2 px-3 rounded cursor-pointer">Berlin</div>
                        <div className="bg-primary/50 hover:bg-primary/60 transition py-2 px-3 rounded cursor-pointer font-medium">Paris</div>
                        <div className="bg-white/10 hover:bg-white/20 transition py-2 px-3 rounded cursor-pointer">Madrid</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 -z-10 w-64 h-64 bg-accent/30 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -left-6 -z-10 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Quick Actions Bar */}
      <section className="py-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="container">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search for quizzes, templates..."
                className="w-full pl-9 rounded-md border border-input bg-background h-10 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/templates">
                  <Image className="h-4 w-4 mr-1" />
                  Templates
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dictionary">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Dictionary
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/quizzes/new">
                  <Zap className="h-4 w-4 mr-1" />
                  New Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Productivity Dashboard Preview */}
      <section className="py-16 bg-background">
        <div className="container py-8 space-y-8">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Dashboard
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Your Productivity Dashboard</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to manage your quiz content in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("rounded-full p-2", stat.color)}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">{stat.label}</p>
                      <h3 className="text-3xl font-bold">{stat.value}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Quizzes */}
            <Card className="col-span-2 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Recent Quizzes</CardTitle>
                  <CardDescription>Performance of your latest content</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link href="/quizzes">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0 last:pb-0 hover:bg-accent/5 transition-colors rounded-md p-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-primary/10 w-10 h-10 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">{quiz.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Engagement</p>
                          <p className="font-medium">{quiz.engagement}%</p>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-nowrap">{quiz.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between text-sm text-muted-foreground">
                <p>Updated 10 minutes ago</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics">View Analytics</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Weekly Schedule */}
            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Your upcoming quiz posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {weekDays.map((day, index) => (
                    <div key={day} className="text-center">
                      <p className="text-sm font-medium mb-2">{day}</p>
                      <div
                        className={cn(
                          "aspect-square rounded-md flex items-center justify-center text-sm",
                          scheduledDays.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/5 text-muted-foreground"
                        )}
                      >
                        {scheduledDays.includes(index) ? (
                          <CalendarIcon className="h-4 w-4" />
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/calendar" className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Go to Calendar
                  </Link>
                </Button>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between text-sm text-muted-foreground">
                <p>Next post: Tomorrow at 5:00 PM</p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights with visual elements */}
      <section className="py-16 bg-accent/5">
        <div className="container py-8 space-y-8">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Supercharge Your Content Strategy</h2>
            <p className="text-muted-foreground text-lg">
              Create, schedule, and analyze all your quiz content in one powerful platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background group">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Beautiful Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose from our library of professionally designed templates or easily create your own custom designs.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Multiple themes and layouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Customizable colors and fonts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Brand-consistent designs</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="gap-1 hover:bg-primary/5 transition-colors" asChild>
                  <Link href="/templates">
                    Browse Templates <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background group">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Intelligent Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Schedule your quizzes to post at the optimal times for maximum engagement and audience reach.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>AI-powered optimal timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Batch scheduling capabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Recurring post schedules</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="gap-1 hover:bg-primary/5 transition-colors" asChild>
                  <Link href="/calendar">
                    View Calendar <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background group">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track performance with comprehensive analytics to understand what resonates with your audience.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Engagement metrics & insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Audience response tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Performance comparisons</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="gap-1 hover:bg-primary/5 transition-colors" asChild>
                  <Link href="/analytics">
                    View Analytics <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-background">
        <div className="container py-8 space-y-8">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <Users className="h-4 w-4 mr-2" />
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tight">What Our Users Say</h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of content creators achieving success with FB Quiz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background overflow-hidden">
                <CardContent className="p-6 pt-8 relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/70 to-accent/70"></div>
                  <div className="mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="inline-block h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="italic text-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-accent/5">
        <div className="container py-8 space-y-8">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">
              Get quick answers to common questions about FB Quiz
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started with FB Quiz?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Getting started is simple! Sign up for an account, browse our template library, and create your first quiz. You can use our intuitive editor to customize questions, answers, and visuals.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background">
              <CardHeader>
                <CardTitle className="text-lg">Can I schedule posts in advance?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Our intelligent scheduling system allows you to plan your content calendar weeks or months in advance. You can also use our AI to determine optimal posting times.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background">
              <CardHeader>
                <CardTitle className="text-lg">What analytics do you provide?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  FB Quiz provides comprehensive analytics including engagement rates, audience demographics, quiz completion rates, and performance trends over time, helping you optimize your content strategy.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-background">
              <CardHeader>
                <CardTitle className="text-lg">How do I customize my quiz branding?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our platform offers extensive customization options. You can apply your brand colors, upload logos, customize fonts, and even create templates that match your brand identity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-16 bg-background">
        <div className="container py-8 space-y-8">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <CreditCard className="h-4 w-4 mr-2" />
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
            <p className="text-muted-foreground text-lg">
              Select the perfect plan for your content creation needs
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 bg-accent/10 p-1 rounded-lg">
              <button
                onClick={() => setAnnualBilling(false)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  !annualBilling
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnualBilling(true)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  annualBilling
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual <span className="text-primary text-xs font-semibold ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={plan.name}
                className={cn(
                  "border border-border/50 shadow-sm transition-all duration-300 relative overflow-hidden",
                  plan.popular ? "border-primary/50 shadow-md md:scale-105" : "hover:shadow-md"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground py-1 px-3 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <plan.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="min-h-12">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold">$</span>
                      <span className="text-5xl font-bold tracking-tight">
                        {annualBilling
                          ? Math.floor(plan.annualPrice / 12)
                          : Math.floor(plan.monthlyPrice)
                        }
                      </span>
                      <span className="text-xl ml-1.5">
                        {(annualBilling ? (plan.annualPrice / 12) : plan.monthlyPrice).toFixed(2).slice(-3)}
                      </span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    {annualBilling && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed ${plan.annualPrice.toFixed(2)} annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full gap-2",
                      plan.popular ? "bg-primary text-primary-foreground" : "bg-accent/20"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center pt-8">
            <p className="text-muted-foreground">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="h-4 w-4 mr-1.5 text-primary" />
                No setup fees
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="h-4 w-4 mr-1.5 text-primary" />
                Cancel anytime
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Check className="h-4 w-4 mr-1.5 text-primary" />
                Secure payments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with productivity focus */}
      <section className={`relative overflow-hidden py-20 ${fullCoverageStyles.ctaGradient}`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        {/* Radial glow effects - extended to ensure full coverage */}
        <div className="absolute top-0 left-0 right-0 bottom-0 -inset-4 bg-[radial-gradient(circle_800px_at_80%_20%,rgba(255,255,255,0.15),transparent)]"></div>

        {/* Animated floating shapes */}
        <div className="absolute top-[60%] right-[20%] w-64 h-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[30%] left-[15%] w-72 h-72 rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-700"></div>

        <div className="container py-8 space-y-8 text-center relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-2">
              <Zap className="h-4 w-4 mr-2" />
              Get Started Today
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your Quiz Strategy?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Join thousands of content creators who are engaging their audiences with FB Quiz.
              Start creating today and see the difference.
            </p>
          </div>

          <div>
            <Button
              size="lg"
              className="h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-md"
            >
              <Link href="/quizzes/new" className="flex items-center font-medium">
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 max-w-md mx-auto gap-4 pt-4">
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <span className="text-2xl font-bold text-white">5000+</span>
              <span className="text-sm text-white/80">Quizzes Created</span>
            </div>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <span className="text-2xl font-bold text-white">87%</span>
              <span className="text-sm text-white/80">Avg. Engagement</span>
            </div>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <span className="text-2xl font-bold text-white">12M+</span>
              <span className="text-sm text-white/80">Total Reach</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
