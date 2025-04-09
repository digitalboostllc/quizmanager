import { create } from 'zustand';
import { createQuiz } from './quiz';
import { CreateQuizInput, Quiz, Template } from './types';

interface AppState {
  // Quiz Management
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
  setQuizzes: (quizzes: Quiz[]) => void;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  addQuiz: (input: CreateQuizInput) => Promise<Quiz>;
  updateQuiz: (quiz: Quiz) => void;
  deleteQuiz: (id: string) => void;
  regenerateQuizImage: (id: string, imageUrl: string, imagePrompt?: string) => void;

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
  regenerateQuizImage: (id, imageUrl, imagePrompt) =>
    set((state) => ({
      quizzes: state.quizzes.map((q) =>
        q.id === id ? { ...q, imageUrl, imagePrompt } : q
      ),
    })),

  // Template Management
  templates: [],
  selectedTemplate: null,
  setTemplates: (templates) => {
    console.log("Setting templates in store:", templates);
    console.log("Is templates an array?", Array.isArray(templates));

    // Force templates to be an array in all cases
    let templatesArray = [];

    if (typeof templates === 'function') {
      // If we're passing a function updater, ensure it receives an array and returns an array
      set((state) => {
        const prevTemplates = Array.isArray(state.templates) ? state.templates : [];
        const result = templates(prevTemplates);
        return {
          templates: Array.isArray(result) ? result : [result].filter(Boolean)
        };
      });
    } else {
      // Direct value assignment
      templatesArray = Array.isArray(templates) ? templates : [templates].filter(Boolean);
      set({ templates: templatesArray });
    }
  },
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  addTemplate: (template) =>
    set((state) => ({
      templates: Array.isArray(state.templates) ? [...state.templates, template] : [template]
    })),
  updateTemplate: (template) =>
    set((state) => {
      const templates = Array.isArray(state.templates) ? state.templates : [];
      return {
        templates: templates.map((t) => (t.id === template.id ? template : t)),
      };
    }),
  deleteTemplate: (id) =>
    set((state) => {
      const templates = Array.isArray(state.templates) ? state.templates : [];
      return {
        templates: templates.filter((t) => t.id !== id),
      };
    }),

  // UI State
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
})); 