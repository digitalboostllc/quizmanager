'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';

interface Word {
  word: string;
  type: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface DictionaryListProps {
  words: Word[];
  onSelectWord?: (word: Word) => void;
}

export function DictionaryList({ words, onSelectWord }: DictionaryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || word.type === selectedType;
      const matchesDifficulty = selectedDifficulty === 'all' || word.difficulty === selectedDifficulty;
      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [words, searchQuery, selectedType, selectedDifficulty]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="search-input-wrapper flex-1">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="NOUN">Nouns</SelectItem>
              <SelectItem value="VERB">Verbs</SelectItem>
              <SelectItem value="ADJECTIVE">Adjectives</SelectItem>
              <SelectItem value="COMMON">Common</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {filteredWords.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No words found
          </div>
        ) : (
          filteredWords.map((word) => (
            <div
              key={word.word}
              className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium">{word.word}</span>
                <Badge variant="outline" className={`word-type type-${word.type} text-xs`}>
                  {word.type}
                </Badge>
                <Badge variant="outline" className={`difficulty-badge difficulty-${word.difficulty} text-xs`}>
                  {word.difficulty}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onSelectWord?.(word)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 