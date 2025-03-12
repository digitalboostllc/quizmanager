'use client';

import { WordUsageHistoryModal } from '@/components/dictionary/WordUsageHistoryModal';
import { DictionaryLayout } from '@/components/DictionaryLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageDictionary } from '@/hooks/useLanguageDictionary';
import { useWordUsage } from '@/hooks/useWordUsage';
import { LANGUAGES, Language } from '@/lib/types';
import { AlertCircle, Book, BookText, CheckCircle2, Clock, GraduationCap, Languages, ListFilter, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import the Word type from the hooks to ensure consistency
import type { Word } from '@/hooks/useDictionary';

export default function DictionaryPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedUsage, setSelectedUsage] = useState<string>('all');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { dictionary, isLoading: dictLoading, error, searchWords } = useLanguageDictionary(selectedLanguage);
  const { isAuthenticated, user } = useAuth();
  const {
    usedWords,
    loading: usageLoading,
    fetchUsedWords,
    toggleWordUsage,
    resetAllWordUsage
  } = useWordUsage(selectedLanguage);

  const { toast } = useToast();

  // Load user's word usage data when authenticated or language changes
  useEffect(() => {
    // Always fetch word usage data, the hook will handle authentication status internally
    fetchUsedWords();
  }, [fetchUsedWords, selectedLanguage]);

  // Prepare the words list with usage status
  const allWords: Word[] = !dictLoading && dictionary ? [
    ...dictionary.words.easy.map(word => ({
      ...word,
      difficulty: 'easy' as const,
      isUsed: usedWords.some(uw => uw.word === word.word && uw.language === selectedLanguage)
    })),
    ...dictionary.words.medium.map(word => ({
      ...word,
      difficulty: 'medium' as const,
      isUsed: usedWords.some(uw => uw.word === word.word && uw.language === selectedLanguage)
    })),
    ...dictionary.words.hard.map(word => ({
      ...word,
      difficulty: 'hard' as const,
      isUsed: usedWords.some(uw => uw.word === word.word && uw.language === selectedLanguage)
    }))
  ] : [];

  // Apply filters and search
  const filteredWords = !dictLoading && dictionary ?
    searchTerm
      ? [] // Will be populated by searchWords
      : allWords.filter(word => {
        if (selectedType !== 'all' && word.type !== selectedType) return false;
        if (selectedDifficulty !== 'all' && word.difficulty !== selectedDifficulty) return false;
        if (selectedUsage !== 'all') {
          if (selectedUsage === 'used' && !word.isUsed) return false;
          if (selectedUsage === 'unused' && word.isUsed) return false;
        }
        return true;
      })
    : [];

  // Handle search when term changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || !dictionary) return;

      try {
        setIsLoading(true);
        const results = await searchWords(searchTerm);

        // Apply additional filters
        const filtered = results.filter(word => {
          if (selectedType !== 'all' && word.type !== selectedType) return false;
          if (selectedDifficulty !== 'all' && word.difficulty !== selectedDifficulty) return false;
          if (selectedUsage !== 'all') {
            if (selectedUsage === 'used' && !word.isUsed) return false;
            if (selectedUsage === 'unused' && word.isUsed) return false;
          }
          return true;
        });

        setFilteredResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, dictionary, selectedType, selectedDifficulty, selectedUsage, searchWords]);

  // Store search results in state
  const [filteredResults, setFilteredResults] = useState<Word[]>([]);

  // Final words to display
  const displayWords = searchTerm ? filteredResults : filteredWords;

  // Handle toggling word usage state
  const handleToggleUsage = async (word: Word) => {
    if (!isAuthenticated) {
      // Show temporary message to indicate auth is required
      toast({
        title: "Authentication Disabled",
        description: "Word usage tracking is not available when authentication is disabled.",
        variant: "default",
      });
      return;
    }

    await toggleWordUsage(word.word, !word.isUsed);
  };

  const handleResetAllWords = async () => {
    if (!isAuthenticated) {
      // Show temporary message to indicate auth is required
      toast({
        title: "Authentication Disabled",
        description: "Word usage tracking is not available when authentication is disabled.",
        variant: "default",
      });
      return;
    }

    await resetAllWordUsage();
    toast({
      description: "All words have been reset to available",
    });
  };

  // Handle language change
  const handleLanguageChange = (lang: Language) => {
    setSearchTerm('');
    setSelectedLanguage(lang);
  };

  if (error) {
    return (
      <div className="container py-8 space-y-8">
        <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <h3 className="font-medium">Error</h3>
          </div>
          <p className="mt-1 text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Page header with modern styling */}
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Language Resources
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Word Dictionary</h1>
          {isAuthenticated ? (
            <Button
              onClick={() => setIsHistoryModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Clock className="h-4 w-4" /> Word Usage History
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1"
            >
              <a href="/auth/login?callbackUrl=/dictionary">
                Login to track word usage
              </a>
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Browse and search words for your quizzes
        </p>
      </div>

      {!isAuthenticated && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>Login to track which words you've already used in your quizzes.</div>
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/login?callbackUrl=/dictionary">Login</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and filter bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 bg-accent/5 p-4 rounded-lg border border-border/50">
        <div className="relative md:col-span-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search words..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="bg-background w-full">
              <div className="flex items-center">
                <BookText className="mr-2 h-4 w-4" />
                <span>Type</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="NOUN">Nouns</SelectItem>
              <SelectItem value="VERB">Verbs</SelectItem>
              <SelectItem value="ADJECTIVE">Adjectives</SelectItem>
              <SelectItem value="COMMON">Common</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="bg-background w-full">
              <div className="flex items-center">
                <ListFilter className="mr-2 h-4 w-4" />
                <span>Level</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select value={selectedUsage} onValueChange={setSelectedUsage}>
            <SelectTrigger className="bg-background w-full">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Usage</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Words</SelectItem>
              <SelectItem value="used">Used Words</SelectItem>
              <SelectItem value="unused">Available Words</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={selectedLanguage}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="bg-background w-full">
              <div className="flex items-center">
                <Languages className="mr-2 h-4 w-4" />
                <span>Language</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(LANGUAGES) as [Language, string][]).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dictionary content - conditionally render loading state */}
      {dictLoading || usageLoading || isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array(8).fill(0).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <DictionaryLayout
          words={displayWords}
          onToggleUsage={isAuthenticated ? handleToggleUsage : undefined}
        />
      )}

      {/* Word usage history modal */}
      {isAuthenticated && !dictLoading && dictionary && (
        <WordUsageHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          words={allWords.filter(word => word.isUsed)}
          onResetAllWords={handleResetAllWords}
        />
      )}

      {/* Optional stats section at the bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-blue-500">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Words</p>
                <h3 className="text-3xl font-bold">{allWords.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-green-500">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground">Languages</p>
                <h3 className="text-3xl font-bold">{Object.keys(LANGUAGES).length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-purple-500">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-muted-foreground">Selected</p>
                <h3 className="text-3xl font-bold capitalize">
                  {LANGUAGES[selectedLanguage]}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 