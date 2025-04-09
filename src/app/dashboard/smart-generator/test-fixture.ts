import { QuizType } from "@/lib/types";

export interface TemplateFixture {
    id: string;
    name: string;
    quizType: QuizType;
    createdAt: string;
}

/**
 * Sample templates for development and testing
 * In a real application, these would come from the API
 */
export const SAMPLE_TEMPLATES: TemplateFixture[] = [
    {
        id: "template_1",
        name: "Basic Wordle Template",
        quizType: "WORDLE",
        createdAt: "2023-12-15T08:23:45Z"
    },
    {
        id: "template_2",
        name: "Advanced Wordle with Hints",
        quizType: "WORDLE",
        createdAt: "2023-12-18T14:30:12Z"
    },
    {
        id: "template_3",
        name: "Simple Number Sequence",
        quizType: "NUMBER_SEQUENCE",
        createdAt: "2023-12-20T10:15:22Z"
    },
    {
        id: "template_4",
        name: "Complex Number Patterns",
        quizType: "NUMBER_SEQUENCE",
        createdAt: "2023-12-22T16:45:33Z"
    },
    {
        id: "template_5",
        name: "Beginner Rhymes",
        quizType: "RHYME_TIME",
        createdAt: "2023-12-25T09:12:55Z"
    },
    {
        id: "template_6",
        name: "Expert Rhyming Challenges",
        quizType: "RHYME_TIME",
        createdAt: "2023-12-26T11:32:18Z"
    },
    {
        id: "template_7",
        name: "Basic Concept Connections",
        quizType: "CONCEPT_CONNECTION",
        createdAt: "2023-12-28T13:22:40Z"
    },
    {
        id: "template_8",
        name: "Advanced Concept Linkages",
        quizType: "CONCEPT_CONNECTION",
        createdAt: "2023-12-30T15:18:27Z"
    }
]; 