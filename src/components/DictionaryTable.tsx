'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Copy, Plus, RefreshCw } from 'lucide-react';

interface Word {
  word: string;
  type: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';
  difficulty: 'easy' | 'medium' | 'hard';
  isUsed?: boolean;
  lastUsedAt?: string;
}

interface DictionaryTableProps {
  words: Word[];
  onSelectWord?: (word: Word) => void;
  onToggleUsage?: (word: Word) => void;
}

export function DictionaryTable({ words, onSelectWord, onToggleUsage }: DictionaryTableProps) {
  const { toast } = useToast();

  const handleCopyWord = (word: string) => {
    navigator.clipboard.writeText(word);
    toast({
      description: "Word copied to clipboard",
    });
  };

  const handleToggleUsage = (word: Word) => {
    if (onToggleUsage) {
      onToggleUsage(word);
      // Toast will be shown by the parent component if needed
    }
  };

  return (
    <div className="border rounded-lg">
      <Table className="dictionary-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Word</TableHead>
            <TableHead className="w-[30%]">Type</TableHead>
            <TableHead className="w-[20%]">Difficulty</TableHead>
            <TableHead className="w-[10%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No words found
              </TableCell>
            </TableRow>
          ) : (
            words.map((word) => (
              <TableRow key={word.word} className="group">
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {word.isUsed && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                        Used
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyWord(word.word)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleToggleUsage(word)}
                      title={word.isUsed ? "Mark as available" : "Mark as used"}
                    >
                      {word.isUsed ?
                        <RefreshCw className="h-4 w-4 text-blue-500" /> :
                        <CheckCircle2 className="h-4 w-4 text-gray-500" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onSelectWord?.(word)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 