'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Clock,
  GraduationCap,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { DictionaryTable } from './DictionaryTable';

interface Word {
  word: string;
  type: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';
  difficulty: 'easy' | 'medium' | 'hard';
  isUsed?: boolean;
  lastUsedAt?: string;
}

interface DictionaryLayoutProps {
  words: Word[];
  onSelectWord?: (word: Word) => void;
  onToggleUsage?: (word: Word) => void;
}

const ITEMS_PER_PAGE = 20;

export function DictionaryLayout({ words, onSelectWord, onToggleUsage }: DictionaryLayoutProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate statistics
  const stats = {
    byType: {
      NOUN: words.filter(w => w.type === 'NOUN').length,
      VERB: words.filter(w => w.type === 'VERB').length,
      ADJECTIVE: words.filter(w => w.type === 'ADJECTIVE').length,
      COMMON: words.filter(w => w.type === 'COMMON').length,
    },
    byDifficulty: {
      easy: words.filter(w => w.difficulty === 'easy').length,
      medium: words.filter(w => w.difficulty === 'medium').length,
      hard: words.filter(w => w.difficulty === 'hard').length,
    },
    byUsage: {
      used: words.filter(w => w.isUsed).length,
      unused: words.filter(w => !w.isUsed).length,
    }
  };

  // Calculate usage percentage
  const usagePercentage = words.length > 0
    ? Math.round((stats.byUsage.used / words.length) * 100)
    : 0;

  // Calculate pagination
  const totalPages = Math.ceil(words.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWords = words.slice(startIndex, endIndex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      <div className="space-y-6">
        <DictionaryTable
          words={currentWords}
          onSelectWord={onSelectWord}
          onToggleUsage={onToggleUsage}
        />

        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first page, last page, and pages around current page
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <div className="space-y-6">
        {/* Statistics Card */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Statistics
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">By Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="justify-between">
                    {type}
                    <span className="ml-2 text-muted-foreground">{count}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-muted-foreground mb-2">By Difficulty</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.byDifficulty).map(([difficulty, count]) => (
                  <Badge key={difficulty} variant="outline" className={`justify-between difficulty-badge difficulty-${difficulty}`}>
                    {difficulty}
                    <span className="ml-2">{count}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Usage Status</h4>
              <div className="mb-2">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">{usagePercentage}% Used</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline" className="justify-between bg-gray-100 text-gray-500 border-gray-200">
                  Used
                  <span className="ml-2">{stats.byUsage.used}</span>
                </Badge>
                <Badge variant="outline" className="justify-between bg-green-50 text-green-600 border-green-200">
                  Available
                  <span className="ml-2">{stats.byUsage.unused}</span>
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Words Card */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Words
          </h3>
          <div className="space-y-2">
            {words.slice(0, 5).map(word => (
              <div
                key={word.word}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelectWord?.(word)}
              >
                <span className="font-medium">{word.word}</span>
                <div className="flex items-center gap-2">
                  {word.isUsed && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
                      Used
                    </Badge>
                  )}
                  <Badge variant="outline" className={`word-type type-${word.type} text-xs`}>
                    {word.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Access Card */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="h-4 w-4" />
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              Nouns
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              Verbs
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              Easy
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
              Hard
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
} 