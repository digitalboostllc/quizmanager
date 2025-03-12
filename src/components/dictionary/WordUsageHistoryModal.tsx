'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Clock, RefreshCw } from "lucide-react";

interface Word {
    word: string;
    type: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';
    difficulty: 'easy' | 'medium' | 'hard';
    isUsed?: boolean;
    lastUsedAt?: string;
}

interface WordUsageHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    words: Word[];
    onResetAllWords: () => void;
}

export function WordUsageHistoryModal({ isOpen, onClose, words, onResetAllWords }: WordUsageHistoryProps) {
    // Get only used words with timestamps
    const usedWords = words
        .filter(word => word.isUsed && word.lastUsedAt)
        .sort((a, b) => {
            // Sort by most recently used first
            return new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime();
        });

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Word Usage History
                    </DialogTitle>
                    <DialogDescription>
                        View when words were marked as used and reset their status
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                        {usedWords.length} words currently marked as used
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={onResetAllWords}
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Reset All Words
                    </Button>
                </div>

                {usedWords.length > 0 ? (
                    <div className="border rounded-md max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Word</TableHead>
                                    <TableHead className="w-[20%]">Type</TableHead>
                                    <TableHead className="w-[20%]">Difficulty</TableHead>
                                    <TableHead className="w-[20%]">Marked Used On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usedWords.map((word) => (
                                    <TableRow key={word.word}>
                                        <TableCell className="font-medium">{word.word}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`word-type type-${word.type}`}>
                                                {word.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`difficulty-badge difficulty-${word.difficulty}`}>
                                                {word.difficulty}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(word.lastUsedAt!)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No words have been marked as used yet
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 