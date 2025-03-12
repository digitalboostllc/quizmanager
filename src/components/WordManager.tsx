'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/api';
import type { Word } from '@/lib/types';

interface WordManagerProps {
  onWordSelect: (word: Word) => void;
}

export function WordManager({ onWordSelect }: WordManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [words, setWords] = useState<Word[]>([]);

  const handleSearch = async () => {
    try {
      const data = await fetchApi<Word[]>(`/words/search?q=${searchQuery}`);
      setWords(data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to search words',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search words..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {words.map((word) => (
          <Button
            key={word.id}
            variant="outline"
            className="justify-start"
            onClick={() => onWordSelect(word)}
          >
            {word.value}
          </Button>
        ))}
      </div>
    </div>
  );
} 