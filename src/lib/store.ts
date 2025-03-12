import { create } from 'zustand';
import { Quiz, Template, CreateQuizInput } from './types';
import { createQuiz } from './quiz';

interface AppState {
  // Quiz Management
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
  setQuizzes: (quizzes: Quiz[]) => void;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  addQuiz: (input: CreateQuizInput) => Promise<Quiz>;
  updateQuiz: (quiz: Quiz) => void;
  deleteQuiz: (id: string) => void;

  // Template Management
  templates: Template[];
  selectedTemplate: Template | null;
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (template: Template | null) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;

  // UI State
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // Quiz Management
  quizzes: [],
  selectedQuiz: null,
  setQuizzes: (quizzes) => set({ quizzes }),
  setSelectedQuiz: (quiz) => set({ selectedQuiz: quiz }),
  addQuiz: async (input) => {
    const quiz = await createQuiz(input);
    set((state) => ({ quizzes: [...state.quizzes, quiz] }));
    return quiz;
  },
  updateQuiz: (quiz) =>
    set((state) => ({
      quizzes: state.quizzes.map((q) => (q.id === quiz.id ? quiz : q)),
    })),
  deleteQuiz: (id) =>
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    })),

  // Template Management
  templates: [],
  selectedTemplate: null,
  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (template) =>
    set((state) => ({
      templates: state.templates.map((t) => (t.id === template.id ? template : t)),
    })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),

  // UI State
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
})); 