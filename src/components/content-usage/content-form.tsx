"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define form schema
const contentFormSchema = z.object({
    contentType: z.enum(["WORD", "NUMBER", "SEQUENCE", "CONCEPT", "RHYME", "CUSTOM"], {
        required_error: "Please select a content type",
    }),
    value: z.string().min(1, "Value is required"),
    format: z.string().optional(),
    metadata: z.string().optional(),
    isUsed: z.boolean().default(true),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ContentForm({ open, onOpenChange, onSuccess }: ContentFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Define form
    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentFormSchema),
        defaultValues: {
            contentType: "WORD",
            value: "",
            format: "",
            metadata: "",
            isUsed: true,
        },
    });

    // Form submission handler
    const onSubmit = async (data: ContentFormValues) => {
        setIsSubmitting(true);
        try {
            // Parse metadata if provided
            let parsedMetadata = {};
            if (data.metadata) {
                try {
                    parsedMetadata = JSON.parse(data.metadata);
                } catch (error) {
                    // If not valid JSON, treat as a simple string
                    parsedMetadata = { value: data.metadata };
                }
            }

            // Send API request
            const response = await fetchApi("/content-usage", {
                method: "POST",
                body: {
                    ...data,
                    metadata: parsedMetadata,
                },
            });

            // Show success message
            toast({
                title: "Content created",
                description: "New content has been added successfully.",
            });

            // Reset form
            form.reset();

            // Close dialog
            onOpenChange(false);

            // Trigger callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to create content:", error);

            // Handle specific error cases
            if (error.status === 409) {
                toast({
                    title: "Content already exists",
                    description: "This content has already been added to the system.",
                    variant: "destructive",
                });
            } else if (error.status === 401) {
                toast({
                    title: "Authentication error",
                    description: "Please sign in again to continue.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: error.message || "Failed to create content",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Content</DialogTitle>
                    <DialogDescription>
                        Add new content that can be used in quizzes and templates.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="contentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a content type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="WORD">Word</SelectItem>
                                            <SelectItem value="NUMBER">Number</SelectItem>
                                            <SelectItem value="SEQUENCE">Sequence</SelectItem>
                                            <SelectItem value="CONCEPT">Concept</SelectItem>
                                            <SelectItem value="RHYME">Rhyme</SelectItem>
                                            <SelectItem value="CUSTOM">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter the content value"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="format"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Format (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="E.g., 'en' for language, 'integer' for number type"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="metadata"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Metadata (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={`Enter JSON metadata, e.g., {"difficulty": "easy", "category": "science"}`}
                                            className="resize-none"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isUsed"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Mark as Used</FormLabel>
                                        <FormDescription className="text-xs text-muted-foreground">
                                            Already used in content or available for use
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Add Content"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 