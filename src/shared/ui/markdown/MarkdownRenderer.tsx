/**
 * @file MarkdownRenderer.tsx
 * @description 공용 Markdown 렌더러. `react-markdown` + `remark-gfm`, 다크 모드 대응 클래스 맵.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";

/** react-markdown용 기본 클래스 (typography 플러그인 없이 가독성 유지) */
export const markdownClassMap = {
  h1: "text-2xl font-bold text-surface-900 dark:text-surface-50 mt-10 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700 first:mt-0",
  h2: "text-xl font-semibold text-surface-900 dark:text-surface-50 mt-10 mb-3",
  h3: "text-lg font-semibold text-surface-800 dark:text-surface-100 mt-6 mb-2",
  p: "text-surface-700 dark:text-surface-300 leading-relaxed mb-4",
  ul: "list-disc pl-5 mb-4 space-y-1 text-surface-700 dark:text-surface-300",
  ol: "list-decimal pl-5 mb-4 space-y-1 text-surface-700 dark:text-surface-300",
  li: "marker:text-surface-400",
  blockquote:
    "border-l-4 border-primary-400/60 pl-4 py-1 my-4 text-surface-600 dark:text-surface-400 italic",
  code: "font-mono text-[0.85em] bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded",
  pre: "bg-surface-900 dark:bg-surface-950 text-surface-100 rounded-xl p-4 overflow-x-auto text-sm mb-4",
  table: "w-full text-sm border-collapse border border-surface-200 dark:border-surface-700 mb-4",
  thead: "bg-surface-100 dark:bg-surface-800",
  th: "border border-surface-200 dark:border-surface-700 px-3 py-2 text-left font-semibold",
  td: "border border-surface-200 dark:border-surface-700 px-3 py-2 align-top",
  hr: "my-8 border-surface-200 dark:border-surface-700",
  a: "text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700",
};

/**
 * `/blog` 등에서 사용. 제목·표 헤더·강조를 bold/semibold 대신 medium으로 통일.
 */
export const markdownBlogClassMap = {
  ...markdownClassMap,
  h1: "text-2xl font-medium text-surface-900 dark:text-surface-50 mt-10 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700 first:mt-0",
  h2: "text-xl font-medium text-surface-900 dark:text-surface-50 mt-10 mb-3",
  h3: "text-lg font-medium text-surface-800 dark:text-surface-100 mt-6 mb-2",
  th: "border border-surface-200 dark:border-surface-700 px-3 py-2 text-left font-medium",
};

export interface MarkdownRendererProps {
  markdown: string;
  className?: string;
  /** `blog`: 제목·표·강조 태그를 bold 대신 medium 톤으로 맞춤 */
  variant?: "default" | "blog";
}

/** 블로그·LLM 매뉴얼 등에서 재사용. 외부 링크는 `target="_blank"` */
export function MarkdownRenderer({ markdown, className, variant = "default" }: MarkdownRendererProps) {
  const md = variant === "blog" ? markdownBlogClassMap : markdownClassMap;

  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={md.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={md.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={md.h3}>{children}</h3>,
          p: ({ children }) => <p className={md.p}>{children}</p>,
          ul: ({ children }) => <ul className={md.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={md.ol}>{children}</ol>,
          li: ({ children }) => <li className={md.li}>{children}</li>,
          blockquote: ({ children }) => <blockquote className={md.blockquote}>{children}</blockquote>,
          hr: () => <hr className={md.hr} />,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className={md.table}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className={md.thead}>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className={md.th}>{children}</th>,
          td: ({ children }) => <td className={md.td}>{children}</td>,
          code: ({ className: codeClass, children, ...props }) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <code className={codeClass} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={md.code} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className={md.pre}>{children}</pre>,
          a: ({ href, children }) => (
            <a href={href} className={md.a} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          /* 블로그 variant: **굵게**를 브라우저 기본 bold 대신 medium으로 */
          strong: ({ children }) =>
            variant === "blog" ? (
              <strong className="font-medium">{children}</strong>
            ) : (
              <strong>{children}</strong>
            ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
