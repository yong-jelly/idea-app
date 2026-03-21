/**
 * @file ProjectKeyCard.tsx
 * @description Supabase Project API 키 섹션과 유사한 프로젝트 공개 식별자(project key) 카드. 복사 버튼 포함.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/shared/ui";

type ProjectKeyCardProps = {
  projectKey: string;
  onRotateClick?: () => void;
};

export function ProjectKeyCard({ projectKey, onRotateClick }: ProjectKeyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-xl border border-surface-200 bg-surface-50/50 dark:border-surface-800 dark:bg-surface-900/40">
      <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-800">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">프로젝트 키</h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          LLM·클라이언트에서 이 프로젝트를 가리킬 때 사용하는 공개 식별자입니다. 문서·예제에 포함해도 됩니다.
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <code className="flex-1 min-w-0 rounded-lg bg-white px-3 py-2 font-mono text-sm text-surface-800 ring-1 ring-surface-200 dark:bg-surface-950 dark:text-surface-200 dark:ring-surface-700 truncate">
            {projectKey}
          </code>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100/90">
          비밀 토큰과 달리 이 값만으로는 쓰기 작업을 할 수 없습니다. 아래 액세스 토큰과 함께 사용하세요.
        </div>
      </div>
    </section>
  );
}
