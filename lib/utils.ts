import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCardDate(date: string, now: Date = new Date()) {
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));

  if (years >= 1) {
    return `${years}년 전`;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(target);
}
