"use client";

import { ContentForm } from "@/components/content-usage/content-form";
import { TypeBadge } from "@/components/type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
    AlertTriangle,
    ArrowDownUp,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Database,
    Eye,
    Filter,
    FolderClosed,
    FolderOpen,
    FolderPlus,
    Loader2,
    PlusCircle,
    RotateCcw,
    Search,
    Settings,
    Sparkles,
    Tag,
    Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

// Type definitions based on our database schema
interface ContentUsageItem {
    id: string;
    contentType: "WORD" | "NUMBER" | "SEQUENCE" | "CONCEPT" | "RHYME" | "CUSTOM";
    value: string;
    format?: string | null;
    isUsed: boolean;
    usedAt: string;
    createdAt: string;
    metadata?: Record<string, any> | null;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface StatsData {
    total: number;
    used: number;
    unused: number;
    byType: Array<{
        contentType: string;
        _count: number;
    }>;
}

// Helper function to format date
function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Type Badge component
function TypeBadge({ type }: { type: string }) {
    const typeStyles: Record<string, string> = {
        "WORD": "bg-blue-500/10 text-blue-600 border-blue-200",
        "NUMBER": "bg-amber-500/10 text-amber-600 border-amber-200",
        "SEQUENCE": "bg-green-500/10 text-green-600 border-green-200",
        "CONCEPT": "bg-purple-500/10 text-purple-600 border-purple-200",
        "RHYME": "bg-pink-500/10 text-pink-600 border-pink-200",
        "CUSTOM": "bg-slate-500/10 text-slate-600 border-slate-200",
    };

    return (
        <Badge
            variant="outline"
            className={typeStyles[type] || ""}
        >
            {type}
        </Badge>
    );
}

export default function ContentUsagePage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [contentItems, setContentItems] = useState<ContentUsageItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
    const [newCollection, setNewCollection] = useState({ name: "", description: "" });

    // State for data
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });
    const [stats, setStats] = useState<StatsData>({
        total: 0,
        used: 0,
        unused: 0,
        byType: []
    });

    // State for UI
    const [activeTab, setActiveTab] = useState("all");
    const { toast } = useToast();
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reuseDialogOpen, setReuseDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ContentUsageItem | null>(null);

    // Load content data
    const loadContentData = async (page = pagination.page) => {
        setIsLoading(true);
        try {
            // Determine usage filter based on active tab
            let isUsedParam = undefined;
            if (activeTab === "used") isUsedParam = "true";
            if (activeTab === "unused") isUsedParam = "false";

            // Build query params
            const queryParams = new URLSearchParams();
            if (selectedType !== "all") queryParams.append("contentType", selectedType);
            if (isUsedParam !== undefined) queryParams.append("isUsed", isUsedParam);
            if (searchTerm) queryParams.append("search", searchTerm);
            queryParams.append("page", page.toString());
            queryParams.append("limit", pagination.limit.toString());

            // Fetch data
            const response = await fetchApi<{
                items: ContentUsageItem[];
                pagination: PaginationData;
                stats: StatsData;
            }>(`/content-usage?${queryParams.toString()}`);

            // Update state
            setContentItems(response.items || []);
            setPagination(response.pagination);
            setStats(response.stats);
        } catch (error) {
            console.error("Failed to load content usage data:", error);
            toast({
                title: "Error",
                description: "Failed to load content usage data. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        loadContentData(1);
    }, [activeTab, selectedType]); // Reload when tab or type filter changes

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            loadContentData(1); // Reset to page 1 when search changes
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Function to handle content reuse
    const handleReuse = async (id: string) => {
        setIsActionLoading(true);
        try {
            await fetchApi(`/content-usage/${id}`, {
                method: 'PUT',
                body: { isUsed: true }
            });

            // Refresh data
            await loadContentData();

            toast({
                title: "Content marked as used",
                description: "The content has been marked as used successfully.",
            });
            setReuseDialogOpen(false);
        } catch (error) {
            console.error("Failed to mark content as used:", error);
            toast({
                title: "Error",
                description: "Failed to mark content as used. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    // Function to handle content deletion
    const handleDelete = async (id: string) => {
        setIsActionLoading(true);
        try {
            await fetchApi(`/content-usage/${id}`, {
                method: 'DELETE'
            });

            // Refresh data
            await loadContentData();

            toast({
                title: "Content deleted",
                description: "The content has been deleted successfully.",
            });
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete content:", error);
            toast({
                title: "Error",
                description: "Failed to delete content. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    // Function to handle adding new content
    const handleAddContent = () => {
        setIsAddContentOpen(true);
    };

    // Handler for refresh button
    const handleRefresh = () => {
        loadContentData();
        toast({
            title: "Refreshing data",
            description: "The latest content usage data is being loaded.",
        });
    };

    const handleCreateCollection = async () => {
        try {
            setIsActionLoading(true);
            const response = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCollection),
            });

            if (!response.ok) throw new Error("Failed to create collection");

            const collection = await response.json();
            setCollections([...collections, collection]);
            setNewCollection({ name: "", description: "" });
            setIsCollectionDialogOpen(false);
            toast.success("Collection created successfully");
        } catch (error) {
            toast.error("Failed to create collection");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddToCollection = async (contentId: string, collectionId: string) => {
        try {
            setIsActionLoading(true);
            const response = await fetch(`/api/collections/${collectionId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentId }),
            });

            if (!response.ok) throw new Error("Failed to add item to collection");

            toast.success("Item added to collection");
        } catch (error) {
            toast.error("Failed to add item to collection");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <Database className="h-3.5 w-3.5 mr-1.5" />
                                    Content Management
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Content Usage Manager</h1>
                                <p className="text-muted-foreground">
                                    Track and manage content used across your quizzes
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                    Refresh
                                </Button>
                                <Button onClick={handleAddContent}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Content
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tracked content items in the database
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Used Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.used.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-medium">
                                {stats.total > 0 ? (stats.used / stats.total * 100).toFixed(1) + '%' : '0%'}
                            </span> usage rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Unused Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unused.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-amber-500 font-medium">
                                {stats.total > 0 ? (stats.unused / stats.total * 100).toFixed(1) + '%' : '0%'}
                            </span> available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Content Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.byType.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Most common: <span className="font-medium">
                                {stats.byType.length > 0 ? stats.byType[0].contentType : 'None'}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main content management */}
            <Card className="border shadow-sm">
                <CardHeader className="border-b pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Content Usage Library</CardTitle>
                            <CardDescription>
                                View and manage all content used in your quizzes
                            </CardDescription>
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="grid grid-cols-3 h-8">
                                <TabsTrigger value="all" className="text-xs">All Content</TabsTrigger>
                                <TabsTrigger value="used" className="text-xs">Used</TabsTrigger>
                                <TabsTrigger value="unused" className="text-xs">Unused</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Filters and search */}
                    <div className="border-b p-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search content..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="WORD">Words</SelectItem>
                                    <SelectItem value="NUMBER">Numbers</SelectItem>
                                    <SelectItem value="SEQUENCE">Sequences</SelectItem>
                                    <SelectItem value="CONCEPT">Concepts</SelectItem>
                                    <SelectItem value="RHYME">Rhymes</SelectItem>
                                    <SelectItem value="CUSTOM">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="w-full md:w-auto gap-2">
                                <Filter className="h-4 w-4" />
                                More Filters
                            </Button>
                            <Button variant="outline" className="w-full md:w-auto gap-2 ml-auto">
                                <ArrowDownUp className="h-4 w-4" />
                                Sort
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="border-b p-4 bg-muted/5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Tag className="h-4 w-4" />
                                Mark Selected as Used
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Selected
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowDownUp className="h-4 w-4" />
                                Export Selected
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Add to Collection
                            </Button>
                        </div>
                    </div>

                    {/* Content table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/20 text-xs">
                                    <th className="px-4 py-3 text-left font-medium w-12">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">Content</th>
                                    <th className="px-4 py-3 text-left font-medium">Type</th>
                                    <th className="px-4 py-3 text-left font-medium">Format</th>
                                    <th className="px-4 py-3 text-left font-medium w-32">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Last Used</th>
                                    <th className="px-4 py-3 text-left font-medium">Collection</th>
                                    <th className="px-4 py-3 text-left font-medium">Metadata</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                <h3 className="mt-2 text-lg font-medium">Loading content...</h3>
                                            </div>
                                        </td>
                                    </tr>
                                ) : contentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <Database className="h-8 w-8 text-muted-foreground/40" />
                                                <h3 className="mt-2 text-lg font-medium">No content found</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Try adjusting your search or filters
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    contentItems.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/10">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.value}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <TypeBadge type={item.contentType} />
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {item.format || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.isUsed ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Used
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                                        Unused
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(item.usedAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="sm" className="h-7 px-2">
                                                    <PlusCircle className="mr-1 h-3 w-3" />
                                                    Add to Collection
                                                </Button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.metadata && Object.entries(item.metadata).map(([key, value]) => (
                                                        <Badge key={key} variant="outline" className="text-[10px]">
                                                            {key}: {value as string}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => toast({
                                                            title: "View content",
                                                            description: `Viewing details for "${item.value}"`,
                                                        })}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">View</span>
                                                    </Button>
                                                    {!item.isUsed && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setReuseDialogOpen(true);
                                                            }}
                                                            disabled={isActionLoading}
                                                        >
                                                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                                                            <span className="sr-only">Mark as Used</span>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        disabled={isActionLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{contentItems.length}</span> of{" "}
                            <span className="font-medium">{pagination.total}</span> items
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadContentData(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous</span>
                            </Button>
                            <div className="text-sm">
                                Page <span className="font-medium">{pagination.page}</span> of{" "}
                                <span className="font-medium">{pagination.totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadContentData(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages || isLoading}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t p-4 bg-muted/5">
                    <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => toast({
                                title: "Content usage settings",
                                description: "Configure how content usage is tracked and managed.",
                            })}
                            className="sm:w-auto w-full"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Content Usage Settings
                        </Button>
                        <Button
                            onClick={handleAddContent}
                            className="sm:w-auto w-full"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Content
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Usage Analytics */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Content Usage Analytics</CardTitle>
                            <CardDescription>
                                Insights about how content is being used across your quizzes
                            </CardDescription>
                        </div>
                        <Select defaultValue="7d">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">Last 24 hours</SelectItem>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Usage Trends */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Usage Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[100px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">+12.5%</div>
                                        <p className="text-xs text-muted-foreground">vs last period</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Distribution */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Content Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[100px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">8:2</div>
                                        <p className="text-xs text-muted-foreground">Used:Unused ratio</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Engagement Rate */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[100px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">85%</div>
                                        <p className="text-xs text-muted-foreground">Content engagement</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Health */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Content Health</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[100px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">92%</div>
                                        <p className="text-xs text-muted-foreground">Healthy content</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Analytics */}
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {/* Content Type Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Content Type Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">Coming Soon</div>
                                        <p className="text-xs text-muted-foreground">Interactive chart visualization</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Usage Patterns */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Usage Patterns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">Coming Soon</div>
                                        <p className="text-xs text-muted-foreground">Time-based usage analysis</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Insights */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">AI-Powered Insights</CardTitle>
                            <CardDescription>
                                Smart recommendations based on your content usage patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Content Optimization</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Consider adding more content in the "SEQUENCE" category as it shows high engagement rates.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Usage Pattern</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Your content usage peaks during weekdays. Consider scheduling content updates accordingly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            {/* Content form dialog */}
            <ContentForm
                open={isAddContentOpen}
                onOpenChange={setIsAddContentOpen}
                onSuccess={() => loadContentData()}
            />

            {/* Collection Management Dialog */}
            <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Collection</DialogTitle>
                        <DialogDescription>
                            Organize your content into collections for better management.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Collection Name</Label>
                            <Input
                                id="name"
                                value={newCollection.name}
                                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                                placeholder="Enter collection name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newCollection.description}
                                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                                placeholder="Enter collection description"
                            />
                        </div>
                        <Button onClick={handleCreateCollection} disabled={isActionLoading}>
                            {isActionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Create Collection
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collection Selection Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Add to Collection
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add to Collection</DialogTitle>
                        <DialogDescription>
                            Select a collection to add the selected items.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            {collections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <FolderClosed className="h-8 w-8 mb-2" />
                                    <p>No collections found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {collections.map((collection) => (
                                        <div
                                            key={collection.id}
                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                                            onClick={() => {
                                                selectedItems.forEach((itemId) => {
                                                    handleAddToCollection(itemId, collection.id)
                                                })
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="h-4 w-4" />
                                                <span>{collection.name}</span>
                                            </div>
                                            <Badge variant="outline">{collection.itemCount} items</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <Button onClick={() => setIsCollectionDialogOpen(true)} variant="outline">
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create New Collection
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Content</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this content? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {selectedItem && (
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="font-medium">{selectedItem.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Type: <TypeBadge type={selectedItem.contentType} />
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isActionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => selectedItem && handleDelete(selectedItem.id)}
                                disabled={isActionLoading}
                            >
                                {isActionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reuse Confirmation Dialog */}
            <Dialog open={reuseDialogOpen} onOpenChange={setReuseDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mark Content as Used</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to mark this content as used?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {selectedItem && (
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="font-medium">{selectedItem.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Type: <TypeBadge type={selectedItem.contentType} />
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setReuseDialogOpen(false)}
                                disabled={isActionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => selectedItem && handleReuse(selectedItem.id)}
                                disabled={isActionLoading}
                            >
                                {isActionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Tag className="mr-2 h-4 w-4" />
                                        Mark as Used
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 