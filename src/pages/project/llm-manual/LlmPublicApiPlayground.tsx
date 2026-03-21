/**
 * @file LlmPublicApiPlayground.tsx
 * @description 공개 LLM API 시험용 — 프로젝트 키·토큰 입력 후 에코·프로젝트 조회 RPC 호출. 토큰은 브라우저 메모리에만 유지.
 */

import { useMemo, useState } from "react";
import { deriveProjectKeyFromProjectId } from "@/features/project-settings";
import { llmPublicEcho, llmPublicProjectRead } from "@/entities/project";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

type LlmPublicApiPlaygroundProps = {
  /** URL 파라미터의 프로젝트 UUID */
  projectId: string;
};

export function LlmPublicApiPlayground({ projectId }: LlmPublicApiPlaygroundProps) {
  const defaultKey = useMemo(() => deriveProjectKeyFromProjectId(projectId), [projectId]);

  /** 사용자가 붙여 넣은 odd_pat_ 평문 */
  const [plainToken, setPlainToken] = useState("");
  /** project_key 수동 수정 허용 (기본은 파생값) */
  const [projectKey, setProjectKey] = useState(defaultKey);
  /** 에코 JSON 본문 */
  const [echoJson, setEchoJson] = useState('{\n  "message": "hello"\n}');
  const [loading, setLoading] = useState<"echo" | "read" | null>(null);
  /** 마지막 응답 (원본 JSON 문자열) */
  const [lastRaw, setLastRaw] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const parsePayload = (): Record<string, unknown> => {
    const trimmed = echoJson.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed) as Record<string, unknown>;
  };

  const runEcho = async () => {
    setLastError(null);
    setLastRaw(null);
    if (!plainToken.trim()) {
      setLastError("액세스 토큰을 입력하세요.");
      return;
    }
    let payload: Record<string, unknown> = {};
    try {
      payload = parsePayload();
    } catch {
      setLastError("에코 본문이 올바른 JSON이 아닙니다.");
      return;
    }
    setLoading("echo");
    try {
      const { data, error, raw } = await llmPublicEcho(plainToken, projectId, projectKey.trim() || null, payload);
      setLastRaw(JSON.stringify(raw ?? data, null, 2));
      if (error) setLastError(error.message);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "호출 실패");
    } finally {
      setLoading(null);
    }
  };

  const runProjectRead = async () => {
    setLastError(null);
    setLastRaw(null);
    if (!plainToken.trim()) {
      setLastError("액세스 토큰을 입력하세요.");
      return;
    }
    setLoading("read");
    try {
      const { data, error, raw } = await llmPublicProjectRead(plainToken, projectId, projectKey.trim() || null);
      setLastRaw(JSON.stringify(raw ?? data, null, 2));
      if (error) setLastError(error.message);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "호출 실패");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/80",
        "shadow-sm p-4 md:p-6 mb-8",
      )}
    >
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">API 플레이그라운드</h2>
      <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 mb-4">
        Supabase 공개 RPC를 브라우저에서 직접 호출합니다. 토큰은 이 탭에만 입력하고 새로고침 시 사라집니다. 스코프{" "}
        <code className="text-xs font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">echo.invoke</code> /
        <code className="text-xs font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">project.read</code>가
        토큰에 포함되어 있어야 합니다.
      </p>

      <div className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">project_id (고정)</label>
          <Input readOnly value={projectId} className="font-mono text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">project_key</label>
          <Input
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)}
            className="font-mono text-sm"
            autoComplete="off"
          />
          <p className="text-xs text-surface-500">기본값은 이 프로젝트에서 파생된 공개 키입니다. API는 UUID 또는 키 중 하나로 식별할 수 있습니다.</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">액세스 토큰 (odd_pat_…)</label>
          <Input
            type="password"
            value={plainToken}
            onChange={(e) => setPlainToken(e.target.value)}
            placeholder="발급 직후 복사한 평문"
            className="font-mono text-xs"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">에코 본문 (JSON)</label>
          <textarea
            value={echoJson}
            onChange={(e) => setEchoJson(e.target.value)}
            rows={5}
            className={cn(
              "w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-mono",
              "text-surface-900 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
            )}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={loading !== null} onClick={() => void runEcho()}>
            {loading === "echo" ? "호출 중…" : "v1_llm_public_echo"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => void runProjectRead()}
          >
            {loading === "read" ? "호출 중…" : "v1_llm_public_project_read"}
          </Button>
        </div>
      </div>

      {lastError ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {lastError}
        </div>
      ) : null}

      {lastRaw ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-surface-500 mb-1">응답 (JSON)</p>
          <pre className="text-xs font-mono bg-surface-900 text-surface-100 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
            {lastRaw}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
