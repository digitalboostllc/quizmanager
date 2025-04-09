"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    Activity,
    BarChart3,
    Brain,
    Calendar,
    FileQuestion,
    Gauge,
    LayoutDashboard,
    Lightning,
    Menu,
    Palette,
    Plus,
    Share2,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

// Mock data for charts
const activityData = [
    { date: "Mon", quizzes: 4, participants: 120, completion: 85 },
    { date: "Tue", quizzes: 3, participants: 98, completion: 78 },
    { date: "Wed", quizzes: 5, participants: 135, completion: 92 },
    { date: "Thu", quizzes: 2, participants: 87, completion: 71 },
    { date: "Fri", quizzes: 6, participants: 142, completion: 88 },
    { date: "Sat", quizzes: 4, participants: 110, completion: 82 },
    { date: "Sun", quizzes: 3, participants: 95, completion: 79 },
];

const performanceData = [
    { name: "Quiz A", score: 85, engagement: 92 },
    { name: "Quiz B", score: 78, engagement: 85 },
    { name: "Quiz C", score: 92, engagement: 95 },
    { name: "Quiz D", score: 88, engagement: 90 },
];

const radarData = [
    { subject: 'Engagement', A: 120, B: 110, fullMark: 150 },
    { subject: 'Completion', A: 98, B: 130, fullMark: 150 },
    { subject: 'Retention', A: 86, B: 130, fullMark: 150 },
    { subject: 'Sharing', A: 99, B: 100, fullMark: 150 },
    { subject: 'Feedback', A: 85, B: 90, fullMark: 150 },
    { subject: 'Growth', A: 65, B: 85, fullMark: 150 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const pieData = [
    { name: 'Trivia', value: 400 },
    { name: 'Personality', value: 300 },
    { name: 'Assessment', value: 300 },
    { name: 'Survey', value: 200 },
];

// Advanced 3D Card with mouse tracking effect
const TiltCard = ({ children, className }) => {
    const cardRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const shadowBlur = useMotionValue(15);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        rotateX.set(yPct * 10); // Rotate 10 degrees max
        rotateY.set(xPct * -10);
        shadowBlur.set(20);
    };

    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
        shadowBlur.set(15);
    };

    const transform = useMotionTemplate`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    const boxShadow = useMotionTemplate`0 ${shadowBlur}px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`;

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform, boxShadow }}
            className={cn("transition-shadow duration-300", className)}
            whileHover={{ scale: 1.02 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
        >
            {children}
        </motion.div>
    );
};

// Animated Stat Card with progress visualization
const AnimatedStatCard = ({ title, value, trend, icon: Icon, description, color = "primary" }) => {
    const { ref, inView } = useInView({
        threshold: 0.2,
        triggerOnce: true,
    });

    return (
        <TiltCard className="overflow-hidden relative">
            <Card className="border border-border/40 bg-gradient-to-br from-background/80 to-background via-background/95 backdrop-blur-sm overflow-hidden">
                <div className={`absolute inset-0 bg-${color}/5 rounded-xl opacity-50`} />
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-${color}/10 blur-3xl`} />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                    <CardTitle className="text-sm font-medium">
                        {title}
                    </CardTitle>
                    <div className={`p-2 rounded-full bg-${color}/10`}>
                        <Icon className={`h-4 w-4 text-${color}`} />
                    </div>
                </CardHeader>
                <CardContent className="z-10" ref={ref}>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="text-3xl font-bold">
                            {inView ? (
                                <CountUp
                                    end={parseFloat(value.replace('%', ''))}
                                    suffix={value.includes('%') ? '%' : ''}
                                    duration={2}
                                    delay={0.2}
                                />
                            ) : "0"}
                        </div>
                        <Badge variant={trend.type} className={`text-xs bg-${color}/20 text-${color}`}>
                            {trend.value}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>

                    {trend.type === "success" && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={inView ? { width: "70%" } : { width: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className={`h-1 mt-3 rounded-full bg-${color}/50`}
                        />
                    )}
                </CardContent>
            </Card>
        </TiltCard>
    );
};

// Activity feed component with animation
const ActivityFeed = ({ activities }) => {
    return (
        <div className="space-y-4">
            {activities.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <div className={`p-2 rounded-full ${item.bgColor}`}>
                        {item.icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {item.description}
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                        {item.badge && (
                            <Badge variant="outline" className="text-[10px] mt-1">{item.badge}</Badge>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// Quick actions with hover effects
const QuickAction = ({ icon: Icon, title, description, href, color = "primary" }) => (
    <Link href={href}>
        <motion.div
            whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)"
            }}
            className={`p-4 rounded-xl border border-border/60 cursor-pointer bg-gradient-to-br from-background to-${color}/5 group relative overflow-hidden`}
        >
            <div className={`absolute inset-0 bg-gradient-to-r from-${color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="flex items-center gap-3 z-10 relative">
                <div className={`p-2 rounded-full bg-${color}/10 text-${color} group-hover:bg-${color}/20 transition-colors`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-medium text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/60"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    </Link>
);

export function DashboardShell() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const [selectedMetric, setSelectedMetric] = useState("quizzes");
    const [activeTab, setActiveTab] = useState("overview");
    const { ref: statsRef, inView: statsInView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // Mock data for the activity feed
    const activities = [
        {
            icon: <Target className="w-4 h-4 text-emerald-500" />,
            title: "Quiz Completed",
            description: "Marketing Basics 101",
            time: "2 hours ago",
            badge: "High Score",
            bgColor: "bg-emerald-500/10",
        },
        {
            icon: <Share2 className="w-4 h-4 text-blue-500" />,
            title: "Quiz Shared",
            description: "Social Media Strategy",
            time: "5 hours ago",
            bgColor: "bg-blue-500/10",
        },
        {
            icon: <Lightning className="w-4 h-4 text-amber-500" />,
            title: "Streak Milestone",
            description: "7-day streak achieved!",
            time: "Yesterday",
            badge: "Achievement",
            bgColor: "bg-amber-500/10",
        },
        {
            icon: <Sparkles className="w-4 h-4 text-purple-500" />,
            title: "New Quiz Created",
            description: "Customer Analysis",
            time: "1 day ago",
            bgColor: "bg-purple-500/10",
        },
    ];

    const navItems = [
        {
            title: "Overview",
            icon: <LayoutDashboard className="w-4 h-4" />,
            variant: "default",
            href: "/dashboard",
        },
        {
            title: "Analytics",
            icon: <BarChart3 className="w-4 h-4" />,
            variant: "ghost",
            href: "/dashboard/analytics",
        },
        {
            title: "My Quizzes",
            icon: <FileQuestion className="w-4 h-4" />,
            variant: "ghost",
            href: "/quizzes",
        },
        {
            title: "Templates",
            icon: <Palette className="w-4 h-4" />,
            variant: "ghost",
            href: "/templates",
        },
        {
            title: "AI Generator",
            icon: <Brain className="w-4 h-4" />,
            variant: "ghost",
            href: "/smart-generator",
        },
        {
            title: "Calendar",
            icon: <Calendar className="w-4 h-4" />,
            variant: "ghost",
            href: "/calendar",
        },
    ];

    return (
        <div className="flex min-h-screen bg-background relative overflow-hidden">
            {/* Abstract background shapes */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -z-10 opacity-60" />

            {/* Sidebar for desktop */}
            <aside className="hidden lg:flex w-64 flex-col border-r border-border/40 backdrop-blur-sm bg-background/60 z-10">
                <div className="p-4 border-b border-border/40">
                    <h1 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        Quiz Manager
                    </h1>
                </div>
                <ScrollArea className="flex-1 py-6">
                    <div className="px-3 py-2">
                        <div className="mb-4">
                            <h2 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Main
                            </h2>
                            <div className="mt-2 space-y-1">
                                {navItems.map((item) => (
                                    <Button
                                        key={item.title}
                                        variant={
                                            pathname === item.href ? "secondary" : "ghost"
                                        }
                                        size="sm"
                                        className="w-full justify-start"
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span className="ml-2">{item.title}</span>
                                            {item.title === "Analytics" && (
                                                <Badge variant="outline" className="ml-auto text-[10px]">New</Badge>
                                            )}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h2 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Insights
                            </h2>
                            <div className="mt-2 space-y-1">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="ml-2">Reports</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <Users className="w-4 h-4" />
                                    <span className="ml-2">Audience</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/40">
                    <div className="flex items-center p-2 rounded-lg bg-muted/40">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-2">
                            <p className="text-sm font-medium truncate max-w-[120px]">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        className="lg:hidden px-4 py-2 fixed left-4 top-4"
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                    <ScrollArea className="flex-1 py-6">
                        <div className="px-4 py-4">
                            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                                Dashboard
                            </h2>
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <Button
                                        key={item.title}
                                        variant={
                                            pathname === item.href ? "secondary" : "ghost"
                                        }
                                        size="sm"
                                        className="w-full justify-start"
                                        asChild
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span className="ml-2">{item.title}</span>
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Main content */}
            <main className="flex-1 pt-16 lg:pt-0 px-4 md:px-6 lg:px-8 pb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="lg:flex items-center justify-between py-6 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <p className="text-muted-foreground">Welcome back, {user?.name || 'there'}! Here's what's happening.</p>
                        </div>
                        <div className="mt-4 lg:mt-0 flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Calendar className="mr-2 h-4 w-4" />
                                March 2025
                            </Button>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New Quiz
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            <TabsTrigger value="insights">Insights</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4 space-y-6">
                            {/* Stats row */}
                            <motion.div
                                ref={statsRef}
                                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                <AnimatedStatCard
                                    title="Total Quizzes"
                                    value="24"
                                    trend={{ type: "success", value: "+12%" }}
                                    icon={FileQuestion}
                                    description="12 new quizzes this month"
                                    color="primary"
                                />
                                <AnimatedStatCard
                                    title="Active Users"
                                    value="573"
                                    trend={{ type: "success", value: "+8%" }}
                                    icon={Users}
                                    description="54 more than last month"
                                    color="blue"
                                />
                                <AnimatedStatCard
                                    title="Engagement Rate"
                                    value="85%"
                                    trend={{ type: "default", value: "Stable" }}
                                    icon={Activity}
                                    description="Consistent user participation"
                                    color="green"
                                />
                                <AnimatedStatCard
                                    title="Performance Score"
                                    value="92"
                                    trend={{ type: "success", value: "+5" }}
                                    icon={Gauge}
                                    description="Above industry average"
                                    color="amber"
                                />
                            </motion.div>

                            {/* Charts row */}
                            <div className="grid gap-6 lg:grid-cols-7">
                                {/* Activity Chart */}
                                <TiltCard className="col-span-full lg:col-span-4">
                                    <Card className="h-full border-border/40 bg-background/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Activity Overview</CardTitle>
                                                    <CardDescription>
                                                        Quiz activity trends over time
                                                    </CardDescription>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant={selectedMetric === "quizzes" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setSelectedMetric("quizzes")}
                                                    >
                                                        Quizzes
                                                    </Button>
                                                    <Button
                                                        variant={selectedMetric === "participants" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setSelectedMetric("participants")}
                                                    >
                                                        Participants
                                                    </Button>
                                                    <Button
                                                        variant={selectedMetric === "completion" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setSelectedMetric("completion")}
                                                    >
                                                        Completion
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={activityData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--background))",
                                                                border: "1px solid hsl(var(--border))",
                                                                borderRadius: "6px",
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey={selectedMetric}
                                                            stroke="hsl(var(--primary))"
                                                            fillOpacity={1}
                                                            fill="url(#colorMetric)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TiltCard>

                                {/* Performance radar */}
                                <TiltCard className="col-span-full lg:col-span-3">
                                    <Card className="h-full border-border/40 bg-background/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle>Performance Metrics</CardTitle>
                                            <CardDescription>Compared to industry average</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart outerRadius={90} data={radarData}>
                                                        <PolarGrid strokeOpacity={0.2} />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))' }} />
                                                        <PolarRadiusAxis />
                                                        <Radar name="Your Quizzes" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                                                        <Radar name="Industry Average" dataKey="B" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                                                        <Legend />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TiltCard>
                            </div>

                            {/* Bottom row */}
                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Distribution chart */}
                                <TiltCard className="lg:col-span-1">
                                    <Card className="h-full border-border/40 bg-background/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle>Quiz Types</CardTitle>
                                            <CardDescription>Distribution by category</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[250px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            label
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TiltCard>

                                {/* Top performers */}
                                <TiltCard className="lg:col-span-1">
                                    <Card className="h-full border-border/40 bg-background/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle>Top Performers</CardTitle>
                                            <CardDescription>Best performing quizzes</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {[1, 2, 3].map((i) => (
                                                    <HoverCard key={i}>
                                                        <HoverCardTrigger asChild>
                                                            <motion.div
                                                                whileHover={{ x: 5 }}
                                                                className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                                            >
                                                                <div className="mr-3 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                                    <Trophy className="w-4 h-4 text-amber-500" />
                                                                </div>
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <p className="text-sm font-medium leading-none">
                                                                            Quiz Title {i}
                                                                        </p>
                                                                        <Star className="w-3 h-3 text-amber-500" />
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {90 - i * 5}% completion
                                                                        </p>
                                                                        <span className="text-xs text-emerald-500">↑{i * 2}%</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-80">
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold">Quiz Performance Details</h4>
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span>Participants:</span>
                                                                        <span className="font-medium">{120 - i * 20}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-sm">
                                                                        <span>Avg. Score:</span>
                                                                        <span className="font-medium">{85 - i * 3}%</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-sm">
                                                                        <span>Completion Time:</span>
                                                                        <span className="font-medium">{15 + i} min</span>
                                                                    </div>
                                                                    <div className="mt-2 pt-2 border-t">
                                                                        <div className="text-xs flex justify-between mb-1">
                                                                            <span>Engagement Score</span>
                                                                            <span className="font-medium">{95 - i * 5}/100</span>
                                                                        </div>
                                                                        <Progress value={95 - i * 5} className="h-1.5" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TiltCard>

                                {/* Activity feed */}
                                <TiltCard className="lg:col-span-1">
                                    <Card className="h-full border-border/40 bg-background/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle>Recent Activity</CardTitle>
                                            <CardDescription>Latest quiz interactions</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ActivityFeed activities={activities} />
                                        </CardContent>
                                    </Card>
                                </TiltCard>
                            </div>

                            {/* Quick actions */}
                            <div>
                                <h2 className="text-lg font-semibold mb-3 flex items-center">
                                    <Zap className="mr-2 h-5 w-5 text-primary" />
                                    Quick Actions
                                </h2>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                    <QuickAction
                                        icon={Plus}
                                        title="Create New Quiz"
                                        description="Build from scratch or template"
                                        href="/dashboard/quizzes/new"
                                        color="primary"
                                    />
                                    <QuickAction
                                        icon={Brain}
                                        title="AI Generator"
                                        description="Generate quiz content with AI"
                                        href="/smart-generator"
                                        color="purple"
                                    />
                                    <QuickAction
                                        icon={Calendar}
                                        title="Schedule Quiz"
                                        description="Plan your quiz distribution"
                                        href="/calendar"
                                        color="blue"
                                    />
                                    <QuickAction
                                        icon={TrendingUp}
                                        title="View Analytics"
                                        description="Track performance metrics"
                                        href="/dashboard/analytics"
                                        color="emerald"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            {/* Analytics content - we'd add this later */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detailed Analytics</CardTitle>
                                    <CardDescription>
                                        In-depth performance metrics and trends
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                                        Analytics content coming soon
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="insights" className="space-y-6">
                            {/* Insights content - we'd add this later */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quiz Insights</CardTitle>
                                    <CardDescription>
                                        AI-powered recommendations and insights
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                                        Insights content coming soon
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
} 