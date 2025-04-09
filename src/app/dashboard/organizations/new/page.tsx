"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const organizationFormSchema = z.object({
    name: z.string().min(3, {
        message: "Organization name must be at least 3 characters.",
    }),
    customSlug: z.string().min(3, {
        message: "Slug must be at least 3 characters.",
    }).optional(),
    description: z.string().optional(),
    website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
    logoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
});

export default function NewOrganizationPage() {
    const [creating, setCreating] = useState(false);
    const [generatedSlug, setGeneratedSlug] = useState("");
    const [customSlugEnabled, setCustomSlugEnabled] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof organizationFormSchema>>({
        resolver: zodResolver(organizationFormSchema),
        defaultValues: {
            name: "",
            customSlug: "",
            description: "",
            website: "",
            logoUrl: "",
        },
    });

    // Auto-generate slug when name changes
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "name" && value.name) {
                const slug = slugify(value.name);
                setGeneratedSlug(slug);
                if (!customSlugEnabled) {
                    form.setValue("customSlug", slug);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [form, customSlugEnabled]);

    const onSubmit = async (values: z.infer<typeof organizationFormSchema>) => {
        setCreating(true);
        try {
            const payload = {
                name: values.name,
                slug: customSlugEnabled ? values.customSlug : undefined,
                description: values.description,
                website: values.website,
                logoUrl: values.logoUrl,
            };

            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create organization");
            }

            const data = await response.json();

            toast({
                title: "Success",
                description: "Organization created successfully",
            });

            // Redirect to the new organization
            router.push(`/dashboard/organizations/${data.id}`);
        } catch (error) {
            console.error("Error creating organization:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create organization",
            });
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-1">
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <span
                        className="hover:underline cursor-pointer"
                        onClick={() => router.push("/dashboard/organizations")}
                    >
                        Organizations
                    </span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span>New Organization</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push("/dashboard/organizations")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Organization</h1>
                    </div>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>
                        Provide information about your new organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organization Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Organization" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Your organization's public display name
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Slug</FormLabel>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setCustomSlugEnabled(!customSlugEnabled);
                                            if (!customSlugEnabled) {
                                                // When enabling custom slug, keep current value
                                                form.setValue("customSlug", generatedSlug);
                                            } else {
                                                // When disabling, reset to generated value
                                                const name = form.getValues("name");
                                                const slug = name ? slugify(name) : "";
                                                form.setValue("customSlug", slug);
                                            }
                                        }}
                                        className="h-7 px-2 text-xs"
                                    >
                                        {customSlugEnabled ? "Auto-generate" : "Customize"}
                                    </Button>
                                </div>

                                {customSlugEnabled ? (
                                    <FormField
                                        control={form.control}
                                        name="customSlug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="my-organization" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Custom URL path for your organization (no spaces or special characters)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <div>
                                        <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                            {generatedSlug || "generated-slug"}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Auto-generated from organization name
                                        </p>
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Organization description (optional)"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Briefly describe your organization
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Your organization's website (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logo URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/logo.png" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                URL to your organization's logo (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={creating}>
                                    {creating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="mr-2 h-4 w-4" />
                                            Create Organization
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
} 