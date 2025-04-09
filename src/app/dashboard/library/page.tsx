'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Download,
    FileIcon,
    Filter,
    Grid2X2,
    ImageIcon,
    List,
    MoreVertical,
    Pencil,
    Search,
    Trash2,
    Upload
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Mock data for content library
const LIBRARY_ITEMS = [
    {
        id: "1",
        name: "quiz-header-1.jpg",
        type: "image",
        size: "1.2 MB",
        dimensions: "1200 x 630",
        createdAt: "2023-10-15",
        thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=240&q=80",
        tags: ["header", "background"]
    },
    {
        id: "2",
        name: "math-symbols.svg",
        type: "vector",
        size: "45 KB",
        dimensions: "Scalable",
        createdAt: "2023-10-12",
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=240&q=80",
        tags: ["math", "symbols", "vector"]
    },
    {
        id: "3",
        name: "quiz-logo.png",
        type: "image",
        size: "325 KB",
        dimensions: "512 x 512",
        createdAt: "2023-10-10",
        thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=240&q=80",
        tags: ["logo", "branding"]
    },
    {
        id: "4",
        name: "quiz-template.json",
        type: "json",
        size: "8 KB",
        createdAt: "2023-10-08",
        tags: ["template", "config"]
    },
    {
        id: "5",
        name: "sound-effect.mp3",
        type: "audio",
        size: "1.8 MB",
        duration: "00:04",
        createdAt: "2023-10-05",
        tags: ["audio", "effect", "feedback"]
    },
    {
        id: "6",
        name: "background-pattern.jpg",
        type: "image",
        size: "450 KB",
        dimensions: "1920 x 1080",
        createdAt: "2023-10-03",
        thumbnail: "https://images.unsplash.com/photo-1614850523459-c2f4c699c32a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=240&q=80",
        tags: ["background", "pattern", "texture"]
    },
    {
        id: "7",
        name: "confetti.json",
        type: "lottie",
        size: "32 KB",
        createdAt: "2023-10-01",
        tags: ["animation", "celebration", "lottie"]
    },
    {
        id: "8",
        name: "quiz-types.csv",
        type: "csv",
        size: "3 KB",
        createdAt: "2023-09-28",
        tags: ["data", "reference"]
    }
];

// Helper function to get icon for file type
const getFileIcon = (type: string) => {
    switch (type) {
        case "image":
        case "vector":
            return <ImageIcon className="h-8 w-8 text-blue-500" />;
        case "audio":
            return <FileIcon className="h-8 w-8 text-emerald-500" />;
        case "json":
        case "lottie":
            return <FileIcon className="h-8 w-8 text-amber-500" />;
        case "csv":
            return <FileIcon className="h-8 w-8 text-purple-500" />;
        default:
            return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
};

export default function ContentLibraryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const toggleSelection = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const selectAll = () => {
        if (selectedItems.length === LIBRARY_ITEMS.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(LIBRARY_ITEMS.map(item => item.id));
        }
    };

    const filteredItems = LIBRARY_ITEMS.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start gap-2">
                <div className="flex w-full flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
                        <p className="text-muted-foreground">
                            Manage your quiz assets and media files.
                        </p>
                    </div>
                    <Button onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All Files</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search files..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className={viewMode === "grid" ? "bg-muted" : ""}
                        >
                            <Grid2X2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode("list")}
                            className={viewMode === "list" ? "bg-muted" : ""}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                                <DropdownMenuItem>Sort by Size</DropdownMenuItem>
                                <DropdownMenuItem>Sort by Date</DropdownMenuItem>
                                <DropdownMenuItem>Filter by Type</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <TabsContent value="all" className="mt-0">
                    {selectedItems.length > 0 && (
                        <div className="flex items-center justify-between p-2 mb-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedItems.length === LIBRARY_ITEMS.length}
                                    onClick={selectAll}
                                />
                                <span>{selectedItems.length} item(s) selected</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}

                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredItems.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <div className="relative">
                                        <div className="absolute top-2 left-2 z-10">
                                            <Checkbox
                                                checked={selectedItems.includes(item.id)}
                                                onClick={() => toggleSelection(item.id)}
                                            />
                                        </div>

                                        <div className="h-36 flex items-center justify-center bg-muted">
                                            {item.thumbnail ? (
                                                <div className="w-full h-full relative">
                                                    <Image
                                                        src={item.thumbnail}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center">
                                                    {getFileIcon(item.type)}
                                                    <span className="text-xs font-medium mt-1 uppercase">{item.type}</span>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-1 truncate">
                                                    <p className="font-medium text-sm truncate" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.size} • {item.createdAt}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {item.tags && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.tags.slice(0, 2).map((tag) => (
                                                        <Badge key={tag} variant="outline" className="text-xs py-0">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {item.tags.length > 2 && (
                                                        <Badge variant="outline" className="text-xs py-0">
                                                            +{item.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium text-sm">
                                <div className="col-span-1"></div>
                                <div className="col-span-5">Name</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2">Size</div>
                                <div className="col-span-2">Created</div>
                            </div>
                            <ScrollArea className="h-[550px]">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-12 gap-2 p-3 border-b hover:bg-muted/50 items-center text-sm"
                                    >
                                        <div className="col-span-1 flex items-center">
                                            <Checkbox
                                                checked={selectedItems.includes(item.id)}
                                                onClick={() => toggleSelection(item.id)}
                                            />
                                        </div>
                                        <div className="col-span-5 flex items-center gap-2 truncate">
                                            {item.thumbnail ? (
                                                <div className="w-8 h-8 relative rounded overflow-hidden shrink-0">
                                                    <Image
                                                        src={item.thumbnail}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                                                    {getFileIcon(item.type)}
                                                </div>
                                            )}
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                        <div className="col-span-2 capitalize">{item.type}</div>
                                        <div className="col-span-2">{item.size}</div>
                                        <div className="col-span-2">{item.createdAt}</div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="images">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredItems
                            .filter(item => item.type === "image" || item.type === "vector")
                            .map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <div className="relative">
                                        <div className="absolute top-2 left-2 z-10">
                                            <Checkbox
                                                checked={selectedItems.includes(item.id)}
                                                onClick={() => toggleSelection(item.id)}
                                            />
                                        </div>

                                        <div className="h-36 flex items-center justify-center bg-muted">
                                            {item.thumbnail ? (
                                                <div className="w-full h-full relative">
                                                    <Image
                                                        src={item.thumbnail}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center">
                                                    <ImageIcon className="h-8 w-8 text-blue-500" />
                                                    <span className="text-xs font-medium mt-1 uppercase">{item.type}</span>
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-1 truncate">
                                                    <p className="font-medium text-sm truncate" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.size} • {item.dimensions}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="audio">
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No audio files yet</h3>
                        <p className="text-muted-foreground mt-1">
                            Upload audio files for your quizzes.
                        </p>
                        <Button className="mt-4" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Audio
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="documents">
                    <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-2 p-3 border-b font-medium text-sm">
                            <div className="col-span-6">Name</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Size</div>
                            <div className="col-span-2">Actions</div>
                        </div>
                        <ScrollArea className="h-[400px]">
                            {filteredItems
                                .filter(item => ["json", "csv", "lottie"].includes(item.type))
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-12 gap-2 p-3 border-b hover:bg-muted/50 items-center text-sm"
                                    >
                                        <div className="col-span-6 flex items-center gap-2 truncate">
                                            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                                                {getFileIcon(item.type)}
                                            </div>
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                        <div className="col-span-2 capitalize">{item.type}</div>
                                        <div className="col-span-2">{item.size}</div>
                                        <div className="col-span-2">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                            Upload files to your content library. Maximum file size is 10MB.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                            <div className="rounded-full bg-primary/10 p-3 mb-3">
                                <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium">Drag and drop files here</p>
                            <p className="text-xs text-muted-foreground mb-3">or</p>
                            <Button size="sm">Browse files</Button>
                            <p className="text-xs text-muted-foreground mt-4">
                                Supported formats: PNG, JPG, SVG, MP3, WAV, JSON, CSV
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button disabled>Upload Files</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 