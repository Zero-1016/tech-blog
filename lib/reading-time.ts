export function readingTime(charCount: number): string {
  const minutes = Math.max(1, Math.round(charCount / 500));
  return `${minutes}분`;
}
