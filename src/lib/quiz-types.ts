import { Grid, Hash, Music, Network } from "lucide-react";
import type { ComponentType } from 'react';
import { QuizType } from '@prisma/client';

export type QuizTypeDisplayInfo = {
  title: string;
  description: string;
  icon: ComponentType<React.ComponentProps<typeof Grid>> | null;
  label: string;
};

export const QUIZ_TYPE_DISPLAY: Record<QuizType, QuizTypeDisplayInfo> = {
  'WORDLE': {
    title: 'Wordle',
    description: 'A word guessing game where players try to guess a hidden word.',
    icon: Grid,
    label: 'Wordle'
  },
  'NUMBER_SEQUENCE': {
    title: 'Number Sequence',
    description: 'Find the pattern in a sequence of numbers.',
    icon: Hash,
    label: 'Number Sequence'
  },
  'RHYME_TIME': {
    title: 'Rhyme Time',
    description: 'Word pairs that rhyme with each other.',
    icon: Music,
    label: 'Rhyme Time'
  },
  'CONCEPT_CONNECTION': {
    title: 'Concept Connection',
    description: 'Connect related concepts or ideas.',
    icon: Network,
    label: 'Concept Connection'
  }
};

export const getAnswerPlaceholder = (type: QuizType): string => {
  switch (type) {
    case 'WORDLE':
      return 'Enter the 5-letter word answer';
    case 'NUMBER_SEQUENCE':
      return 'Enter the next number in the sequence';
    case 'RHYME_TIME':
      return 'Enter both rhyming words, separated by a comma';
    case 'CONCEPT_CONNECTION':
      return 'Enter the connecting concept';
    default:
      return 'Enter the answer';
  }
};

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  'WORDLE': 'Wordle',
  'NUMBER_SEQUENCE': 'Number Sequence',
  'RHYME_TIME': 'Rhyme Time',
  'CONCEPT_CONNECTION': 'Concept Connection'
} as const;

export const QUIZ_TYPES: { value: QuizType; label: string }[] = Object.entries(QUIZ_TYPE_LABELS)
  .map(([value, label]) => ({ value: value as QuizType, label })); 