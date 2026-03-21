/**
 * @file ProjectPublicLlmManualPage.tsx
 * @description 프로젝트별 공개 LLM·에이전트 연동 문서. 인증 없이 접근, MD 렌더 + 원문 복사.
 */

import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { buildLlmManualMarkdown } from "./build-llm-manual-markdown";
import { LlmPublicApiPlayground } from "./LlmPublicApiPlayground";

/** react-markdown용 기본 클래스 (typography 플러그인 없이 가독성 유지) */
const md = {
  h1: "text-2xl font-bold text-surface-900 dark:text-surface-50 mt-10 mb-4 pb-2 border-b border-surface-200 dark:border-surface-700 first:mt-0",
  h2: "text-xl font-semibold text-surface-900 dark:text-surface-50 mt-10 mb-3",
  h3: "text-lg font-semibold text-surface-800 dark:text-surface-100 mt-6 mb-2",
  p: "text-surface-700 dark:text-surface-300 leading-relaxed mb-4",
  ul: "list-disc pl-5 mb-4 space-y-1 text-surface-700 dark:text-surface-300",
  ol: "list-decimal pl-5 mb-4 space-y-1 text-surface-700 dark:text-surface-300",
  li: "marker:text-surface-400",
  blockquote: "border-l-4 border-primary-400/60 pl-4 py-1 my-4 text-surface-600 dark:text-surface-400 italic",
  code: "font-mono text-[0.85em] bg-surface-100 dark:bg-surface-800 px-1 py-0.5 rounded",
  pre: "bg-surface-900 dark:bg-surface-950 text-surface-100 rounded-xl p-4 overflow-x-auto text-sm mb-4",
  table: "w-full text-sm border-collapse border border-surface-200 dark:border-surface-700 mb-4",
  thead: "bg-surface-100 dark:bg-surface-800",
  th: "border border-surface-200 dark:border-surface-700 px-3 py-2 text-left font-semibold",
  td: "border border-surface-200 dark:border-surface-700 px-3 py-2 align-top",
  hr: "my-8 border-surface-200 dark:border-surface-700",
  a: "text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700",
};

export function ProjectPublicLlmManualPage() {
  const { id: projectId = "" } = useParams<{ id: string }>();
  const [copied, setCopied] = useState<"md" | "url" | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const markdown = useMemo(() => {
    if (!projectId) return "";
    return buildLlmManualMarkdown({ projectId, origin });
  }, [projectId, origin]);

  const pageUrl = useMemo(() => `${origin}/project/${projectId}/llm-manual`, [origin, projectId]);

  const copyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied("md");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, [markdown]);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied("url");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, [pageUrl]);

  if (!projectId) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-surface-600 dark:text-surface-400">
        프로젝트 ID가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50/50 dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <nav className="text-sm text-surface-500 dark:text-surface-400 mb-6">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link to={`/project/${projectId}`} className="hover:text-primary-600 dark:hover:text-primary-400">
            프로젝트
          </Link>
          <span className="mx-2">/</span>
          <span className="text-surface-700 dark:text-surface-200">LLM 연동 문서</span>
        </nav>

        <header className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400 mb-1">
                Public · LLM-optimized
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
                프로젝트 LLM·에이전트 연동 문서
              </h1>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 max-w-2xl">
                인증 없이 열람 가능한 공개 URL입니다. 비밀 토큰은 문서에 넣지 않으며, 발급은 프로젝트 소유자만 설정에서 할 수
                있습니다. 아래에서 <strong className="text-surface-800 dark:text-surface-200">공개 RPC</strong>를
                시험하거나, Markdown 본문을 복사해 Cursor·Claude 등에 붙여 넣을 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={copyUrl}>
                {copied === "url" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {copied === "url" ? "URL 복사됨" : "공개 URL 복사"}
              </Button>
              <Button type="button" size="sm" className="gap-1.5" onClick={copyMd}>
                {copied === "md" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "md" ? "Markdown 복사됨" : "Markdown 전체 복사"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(pageUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                새 탭
              </Button>
            </div>
          </div>
          <p className="mt-4 text-xs font-mono text-surface-500 dark:text-surface-400 break-all">{pageUrl}</p>
        </header>

        <LlmPublicApiPlayground projectId={projectId} />

        <article
          className={cn(
            "rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/80",
            "shadow-sm px-4 py-6 md:px-8 md:py-10",
          )}
        >
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
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <code className={className} {...props}>
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
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>

        <footer className="mt-8 text-center text-xs text-surface-500 dark:text-surface-500">
          <Link to={`/project/${projectId}/settings/access`} className="text-primary-600 hover:underline dark:text-primary-400">
            프로젝트 소유자: 토큰 발급·관리 (로그인 필요)
          </Link>
        </footer>
      </div>
    </div>
  );
}
