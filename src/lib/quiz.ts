import { fetchApi } from "./api";
import { API_ENDPOINTS } from "./config";
import type { Quiz, CreateQuizInput, UpdateQuizInput } from "./types";

export async function getQuizzes(): Promise<Quiz[]> {
  return fetchApi<Quiz[]>(API_ENDPOINTS.QUIZZES);
}

export async function getQuiz(id: string): Promise<Quiz> {
  return fetchApi<Quiz>(`${API_ENDPOINTS.QUIZZES}/${id}`);
}

export async function createQuiz(data: CreateQuizInput): Promise<Quiz> {
  return fetchApi<Quiz>(API_ENDPOINTS.QUIZZES, {
    method: "POST",
    body: data,
  });
}

export async function updateQuiz(id: string, data: UpdateQuizInput): Promise<Quiz> {
  return fetchApi<Quiz>(`${API_ENDPOINTS.QUIZZES}/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteQuiz(id: string): Promise<void> {
  await fetchApi(`${API_ENDPOINTS.QUIZZES}/${id}`, {
    method: "DELETE",
  });
}

export async function publishQuiz(id: string): Promise<Quiz> {
  return fetchApi<Quiz>(`${API_ENDPOINTS.QUIZZES}/${id}/publish`, {
    method: "POST",
  });
}

export async function scheduleQuiz(id: string, scheduledFor: string): Promise<Quiz> {
  return fetchApi<Quiz>(`${API_ENDPOINTS.QUIZZES}/${id}/schedule`, {
    method: "POST",
    body: { scheduledFor },
  });
}

export async function generateQuizImage(id: string): Promise<{ imageUrl: string }> {
  return fetchApi<{ imageUrl: string }>(`${API_ENDPOINTS.QUIZZES}/${id}/image`, {
    method: "POST",
  });
}

export function formatQuizStatus(status: Quiz["status"]): string {
  return {
    DRAFT: "Draft",
    READY: "Ready",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    FAILED: "Failed",
  }[status];
}

export function getQuizStatusColor(status: Quiz["status"]): {
  text: string;
  bg: string;
} {
  switch (status) {
    case "PUBLISHED":
      return { text: "text-green-800", bg: "bg-green-100" };
    case "SCHEDULED":
      return { text: "text-blue-800", bg: "bg-blue-100" };
    case "READY":
      return { text: "text-purple-800", bg: "bg-purple-100" };
    case "FAILED":
      return { text: "text-red-800", bg: "bg-red-100" };
    default:
      return { text: "text-gray-800", bg: "bg-gray-100" };
  }
} 