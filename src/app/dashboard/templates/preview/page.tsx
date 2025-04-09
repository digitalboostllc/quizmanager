"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Template } from "@/lib/types";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Template size constant - all templates are 1080x1080
const TEMPLATE_SIZE = 1080;

export default function TemplatePreviewTest() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [previewHtml, setPreviewHtml] = useState("");
    const [template, setTemplate] = useState<Template | null>(null);
    const [scale, setScale] = useState(60);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get template ID from query
    const templateId = searchParams.get("id");

    // Load template data
    useEffect(() => {
        async function loadTemplate() {
            if (!templateId) return;

            try {
                setIsLoading(true);
                const response = await fetch(`/api/templates/${templateId}`);

                if (!response.ok) {
                    throw new Error(`Failed to load template: ${response.status}`);
                }

                const data = await response.json();
                setTemplate(data);
                renderPreview(data);
            } catch (err) {
                toast({
                    variant: 'destructive',
                    description: err instanceof Error ? err.message : 'Failed to load template',
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadTemplate();
    }, [templateId, toast]);

    // Update scale when scale changes
    useEffect(() => {
        updateScale(scale);
    }, [scale]);

    // Update scale function
    const updateScale = (scaleValue: number) => {
        if (!containerRef.current || !iframeRef.current) return;

        const scalePercent = scaleValue / 100;

        // Update iframe transform
        if (iframeRef.current) {
            iframeRef.current.style.transform = `scale(${scalePercent})`;
        }

        // Update container dimensions
        if (containerRef.current) {
            containerRef.current.style.width = `${TEMPLATE_SIZE * scalePercent}px`;
            containerRef.current.style.height = `${TEMPLATE_SIZE * scalePercent}px`;
        }
    };

    // Render preview HTML
    const renderPreview = (template: Template) => {
        if (!template) return;

        try {
            // Replace variables in template
            let processedHtml = template.html || "";
            Object.entries(template.variables || {}).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(
                    new RegExp(`{{${key}}}`, "g"),
                    String(value)
                );
            });

            // Create a simplified HTML document
            const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=1080, height=1080, initial-scale=1, user-scalable=no">
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: ${TEMPLATE_SIZE}px;
                height: ${TEMPLATE_SIZE}px;
                overflow: hidden;
                background-color: white;
              }
              * {
                box-sizing: border-box;
              }
              /* Template CSS */
              ${template.css || ''}
            </style>
          </head>
          <body>
            ${processedHtml}
          </body>
        </html>
      `;

            setPreviewHtml(fullHtml);

            // Update scale after setting HTML
            setTimeout(() => updateScale(scale), 100);
        } catch (err) {
            console.error("Preview render error:", err);
            toast({
                title: "Error",
                description: "Failed to render template preview",
                variant: "destructive",
            });
        }
    };

    // Function to open preview in new window
    const openInNewWindow = () => {
        if (!previewHtml) return;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(previewHtml);
            newWindow.document.close();
        }
    };

    if (isLoading) {
        return (
            <div className="container py-10">
                <div className="text-center">Loading template preview...</div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="container py-10">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">No template found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex items-center mb-6 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="mr-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold">Template Preview: {template.name}</h1>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Template Preview</CardTitle>
                        <CardDescription>
                            Template Size: {TEMPLATE_SIZE}×{TEMPLATE_SIZE}px
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center gap-6">
                            {/* Scale controls */}
                            <div className="w-full flex items-center gap-4">
                                <Label htmlFor="scale-slider" className="w-16 flex-shrink-0">Scale:</Label>
                                <Input
                                    id="scale-slider"
                                    type="range"
                                    min="25"
                                    max="100"
                                    value={scale}
                                    onChange={(e) => setScale(parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="w-12 text-right">{scale}%</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openInNewWindow()}
                                    className="ml-2"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => renderPreview(template)}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>

                            {/* Preview container */}
                            <div className="relative mx-auto">
                                <div
                                    ref={containerRef}
                                    className="frame-container border-2 border-gray-300 relative mx-auto overflow-hidden"
                                    style={{ width: `${TEMPLATE_SIZE * (scale / 100)}px`, height: `${TEMPLATE_SIZE * (scale / 100)}px` }}
                                >
                                    <iframe
                                        ref={iframeRef}
                                        srcDoc={previewHtml}
                                        title="Template Preview"
                                        style={{
                                            width: `${TEMPLATE_SIZE}px`,
                                            height: `${TEMPLATE_SIZE}px`,
                                            transformOrigin: '0 0',
                                            transform: `scale(${scale / 100})`,
                                            border: 'none'
                                        }}
                                        sandbox="allow-same-origin allow-scripts"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground text-center mt-2">
                                    {TEMPLATE_SIZE}×{TEMPLATE_SIZE}px (scaled to {scale}%)
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Template info card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Template Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-medium">ID:</span>
                            <span className="ml-2 text-xs text-muted-foreground font-mono">{template.id}</span>
                        </div>
                        <div>
                            <span className="font-medium">Type:</span>
                            <span className="ml-2">{template.quizType || "Unknown"}</span>
                        </div>
                        <div>
                            <span className="font-medium">Variables:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {Object.keys(template.variables || {}).map(key => (
                                    <span key={key} className="text-xs bg-muted px-2 py-1 rounded">{key}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 