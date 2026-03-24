/**
 * @file ProjectPublicLlmManualPage.tsx
 * @description 프로젝트별 공개 LLM·에이전트 연동 문서. 인증 없이 접근, MD 렌더 + 원문 복사.
 */

import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { MarkdownRenderer } from "@/shared/ui/markdown/MarkdownRenderer";
import { buildLlmManualMarkdown } from "./build-llm-manual-markdown";
import { LlmPublicApiPlayground } from "./LlmPublicApiPlayground";

export function ProjectPublicLlmManualPage() {
  const { id: projectId = "" } = useParams<{ id: string }>();
  /** 복사 버튼 피드백: Markdown 원문 또는 공개 URL */
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
          <MarkdownRenderer markdown={markdown} />
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
