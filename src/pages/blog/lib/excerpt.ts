/**
 * @file excerpt.ts
 * @description Markdown 본문에서 코드블록·마크업을 제거한 뒤 짧은 요약 문자열을 만든다. 목록 excerpt 자동 생성에 사용.
 */

/**
 * Markdown에서 짧은 요약 텍스트 생성
 * @param md 원본 Markdown
 * @param maxLen 잘라낼 최대 길이(기본 220)
 */
export function excerptFromMarkdown(md: string, maxLen = 220): string {
  const t = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\[\]`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}
