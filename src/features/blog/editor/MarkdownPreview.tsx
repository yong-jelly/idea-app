/**
 * @file MarkdownPreview.tsx
 * @description 블로그 작성 화면용 Markdown 미리보기. 공유 `MarkdownRenderer`를 감싼다.
 */
import { MarkdownRenderer } from "@/shared/ui/markdown/MarkdownRenderer";

export interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

/** 빈 문자열이면 렌더러에 `""` 전달 */
export function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  return <MarkdownRenderer markdown={markdown || ""} className={className} variant="blog" />;
}
