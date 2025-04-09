"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BookmarkIcon, BookOpen, History, Search } from "lucide-react";
import { useState } from "react";

// Example quiz-related terms for the dictionary
const DICTIONARY_TERMS = [
    {
        term: "Wordle",
        definition: "A word guessing game where players attempt to guess a five-letter word within six attempts. Feedback is given for each guess in the form of colored tiles.",
        category: "Quiz Types"
    },
    {
        term: "Number Sequence",
        definition: "A quiz format where participants must identify the pattern in a series of numbers and determine what number comes next.",
        category: "Quiz Types"
    },
    {
        term: "Rhyme Time",
        definition: "A quiz format featuring rhyming word pairs, where participants need to guess one or both words in the pair based on clues.",
        category: "Quiz Types"
    },
    {
        term: "Quiz Template",
        definition: "A reusable structure for creating quizzes with predefined formats, styles, and question types.",
        category: "Technical"
    },
    {
        term: "Distractors",
        definition: "In multiple choice questions, these are the incorrect answer options that are designed to seem plausible.",
        category: "Question Design"
    },
    {
        term: "Item Analysis",
        definition: "The process of examining how participants responded to quiz items to evaluate the quality and efficacy of the questions.",
        category: "Analytics"
    },
    {
        term: "Difficulty Index",
        definition: "A measure of how hard a quiz question is, typically determined by the percentage of participants who answer it correctly.",
        category: "Analytics"
    },
    {
        term: "Discrimination Index",
        definition: "A measure of how well a quiz question distinguishes between high and low performers.",
        category: "Analytics"
    }
];

export default function DictionaryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Filter terms based on search query and active tab
    const filteredTerms = DICTIONARY_TERMS.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeTab === "all" || term.category.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    // Get unique categories for tab filtering
    const categories = ["all", ...new Set(DICTIONARY_TERMS.map(term => term.category.toLowerCase()))];

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Quiz Dictionary</h1>
                <p className="text-muted-foreground">
                    Explore terms and concepts related to quiz creation and management.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search terms..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <History className="mr-2 h-4 w-4" />
                        Recent
                    </Button>
                    <Button variant="outline" size="sm">
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Bookmarks
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted">
                    {categories.map(category => (
                        <TabsTrigger
                            key={category}
                            value={category}
                            className="capitalize"
                        >
                            {category === "all" ? "All Terms" : category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {filteredTerms.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {filteredTerms.map((term, index) => (
                                <Card key={index}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl">{term.term}</CardTitle>
                                            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                {term.category}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{term.definition}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No terms found</h3>
                            <p className="mt-2 mb-4 text-sm text-muted-foreground">
                                {searchQuery ? "Try a different search term or category" : "No terms available in this category"}
                            </p>
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Dictionary Resources</CardTitle>
                    <CardDescription>
                        Additional resources to expand your quiz knowledge
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 hover:bg-muted rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span>Quiz Design Best Practices</span>
                        </div>
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-muted rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span>Question Writing Guide</span>
                        </div>
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-muted rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span>Analytics Terminology</span>
                        </div>
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 