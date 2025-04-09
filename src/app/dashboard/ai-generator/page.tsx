"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    AwardIcon,
    BookOpen,
    BrainCircuit,
    CheckCircle,
    Clock,
    FileText,
    Plus,
    Save,
    Shuffle,
    Sparkles,
    Target,
    Wand2
} from "lucide-react";
import { useState } from "react";

export default function AIGeneratorPage() {
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setGenerated(true);
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">AI Quiz Generator</h1>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Beta
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Generate quizzes instantly with our AI-powered quiz creation tool.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a New Quiz</CardTitle>
                            <CardDescription>
                                Describe your quiz, select options, and let AI do the work.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="topic">Quiz Topic</Label>
                                <Input
                                    id="topic"
                                    placeholder="E.g., World Geography, Renaissance Art, Basic Chemistry..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Detailed Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide more details about your quiz. Include specific subtopics, themes, or concepts you want to cover."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="difficulty">Difficulty Level</Label>
                                    <Select defaultValue="medium">
                                        <SelectTrigger id="difficulty">
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                            <SelectItem value="expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="question-count">Number of Questions</Label>
                                    <Select defaultValue="10">
                                        <SelectTrigger id="question-count">
                                            <SelectValue placeholder="Select number" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5 Questions</SelectItem>
                                            <SelectItem value="10">10 Questions</SelectItem>
                                            <SelectItem value="15">15 Questions</SelectItem>
                                            <SelectItem value="20">20 Questions</SelectItem>
                                            <SelectItem value="25">25 Questions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quiz-type">Quiz Type</Label>
                                <Select defaultValue="multiple-choice">
                                    <SelectTrigger id="quiz-type">
                                        <SelectValue placeholder="Select quiz type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                        <SelectItem value="true-false">True/False</SelectItem>
                                        <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                                        <SelectItem value="matching">Matching</SelectItem>
                                        <SelectItem value="mixed">Mixed Types</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Advanced Options</h3>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="explanation">Include Explanations</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Add explanations for correct answers
                                        </p>
                                    </div>
                                    <Switch id="explanation" defaultChecked />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="images">Suggest Image Prompts</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Generate image prompts for visual content
                                        </p>
                                    </div>
                                    <Switch id="images" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="age-appropriate">Age-Appropriate Content</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Target specific age group
                                        </p>
                                    </div>
                                    <Select defaultValue="all">
                                        <SelectTrigger id="age-appropriate" className="w-[180px]">
                                            <SelectValue placeholder="Select age group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Ages</SelectItem>
                                            <SelectItem value="elementary">Elementary (6-10)</SelectItem>
                                            <SelectItem value="middle">Middle School (11-13)</SelectItem>
                                            <SelectItem value="high">High School (14-18)</SelectItem>
                                            <SelectItem value="college">College (18+)</SelectItem>
                                            <SelectItem value="adult">Adult</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                <Sparkles className="inline-block h-4 w-4 mr-1 text-primary" />
                                AI credits: <span className="font-medium">27 remaining</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setGenerated(false)}>
                                    <Shuffle className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button onClick={handleGenerate} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Generate Quiz
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                    {generated && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Generated Quiz</CardTitle>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Ready to Use
                                    </Badge>
                                </div>
                                <CardDescription>
                                    World Geography: Countries and Capitals (10 Questions)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="rounded-md border p-4">
                                        <div className="font-medium mb-2">Question 1</div>
                                        <p>What is the capital city of Australia?</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Sydney</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Melbourne</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20">
                                                <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                                                <span>Canberra</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Perth</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
                                            <strong>Explanation:</strong> Canberra is the capital city of Australia, not Sydney or Melbourne as commonly mistaken.
                                        </div>
                                    </div>

                                    <div className="rounded-md border p-4">
                                        <div className="font-medium mb-2">Question 2</div>
                                        <p>Which country is home to the ancient city of Machu Picchu?</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Bolivia</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20">
                                                <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                                                <span>Peru</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Chile</span>
                                            </div>
                                            <div className="flex items-center border rounded-md p-2">
                                                <div className="h-4 w-4 rounded-full border-2 border-primary mr-2"></div>
                                                <span>Ecuador</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
                                            <strong>Explanation:</strong> Machu Picchu is an ancient Incan citadel located in Peru, specifically in the Cusco Region.
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <Button variant="ghost" className="text-primary">
                                            Show All 10 Questions
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t px-6 py-4">
                                <Button variant="outline">
                                    <Shuffle className="mr-2 h-4 w-4" />
                                    Regenerate
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button variant="default">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Quiz
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Templates</CardTitle>
                            <CardDescription>
                                Start with a template to speed up creation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="font-medium">Literature Quiz</h3>
                                        <p className="text-xs text-muted-foreground">Classic novels and authors</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="font-medium">History Timeline</h3>
                                        <p className="text-xs text-muted-foreground">Major historical events</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <AwardIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="font-medium">Science Trivia</h3>
                                        <p className="text-xs text-muted-foreground">Fun and educational facts</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit className="h-5 w-5 text-primary" />
                                    <div>
                                        <h3 className="font-medium">Math Challenge</h3>
                                        <p className="text-xs text-muted-foreground">Problem-solving questions</p>
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                View All Templates
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tips for Better Results</CardTitle>
                            <CardDescription>
                                How to get the most from AI generation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold">1</span>
                                    </div>
                                    <p className="text-sm">Be specific with your topic description. Include the exact subjects you want to cover.</p>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold">2</span>
                                    </div>
                                    <p className="text-sm">Set the appropriate difficulty level for your intended audience.</p>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold">3</span>
                                    </div>
                                    <p className="text-sm">Enable explanations for educational quizzes to provide context for answers.</p>
                                </div>

                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold">4</span>
                                    </div>
                                    <p className="text-sm">You can always edit the generated questions before saving your quiz.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button variant="ghost" className="w-full text-primary">
                                View Full Guide
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="w-full mb-4">
                    <TabsTrigger value="history" className="flex-1">Generation History</TabsTrigger>
                    <TabsTrigger value="saved" className="flex-1">Saved Generations</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Recent Generations</CardTitle>
                            <CardDescription>
                                Your recent AI-generated quizzes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                                            <Wand2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Famous Artists Quiz</h3>
                                            <p className="text-xs text-muted-foreground">15 questions • Medium difficulty</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Generated 2 days ago
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                                            <Wand2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Periodic Table Challenge</h3>
                                            <p className="text-xs text-muted-foreground">10 questions • Hard difficulty</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Generated 1 week ago
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                                            <Wand2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Space Exploration Quiz</h3>
                                            <p className="text-xs text-muted-foreground">20 questions • Medium difficulty</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Generated 2 weeks ago
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="saved" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Saved Generations</CardTitle>
                            <CardDescription>
                                AI-generated quizzes you've saved
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Save className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">No saved generations yet</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Generated quizzes that you save will appear here
                                </p>
                                <Button className="mt-4" variant="outline">
                                    Generate a Quiz
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 