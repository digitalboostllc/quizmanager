import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "";
  
  return format(dateObj, "PPP");
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "";
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatScheduleTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValid(dateObj)) return "";
  
  return format(dateObj, "PPp");
} 