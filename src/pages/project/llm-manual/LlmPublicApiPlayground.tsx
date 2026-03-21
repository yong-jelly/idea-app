/**
 * @file LlmPublicApiPlayground.tsx
 * @description 공개 LLM API 시험용 — 엔드포인트 선택 + 추가 파라미터 JSON. 토큰은 브라우저 메모리에만 유지.
 */

import { useEffect, useMemo, useState } from "react";
import { deriveProjectKeyFromProjectId } from "@/features/project-settings";
import { callLlmPublicRpc, type LlmPublicRpcName } from "@/entities/project";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

type LlmPublicApiPlaygroundProps = {
  /** URL 파라미터의 프로젝트 UUID */
  projectId: string;
};

type EndpointOption = {
  /** v1_llm_public_* 함수명 */
  rpc: LlmPublicRpcName;
  /** 셀렉트 표시 라벨 */
  label: string;
  /** 필요 스코프 힌트 */
  scope: string;
};

const ENDPOINT_OPTIONS: EndpointOption[] = [
  { rpc: "v1_llm_public_echo", label: "에코", scope: "echo.invoke" },
  { rpc: "v1_llm_public_project_read", label: "프로젝트 읽기", scope: "project.read" },
  { rpc: "v1_llm_public_manual_read", label: "매뉴얼 메타 읽기", scope: "manual.read" },
  { rpc: "v1_llm_public_project_update", label: "프로젝트 수정", scope: "project.write" },
  { rpc: "v1_llm_public_announcement_list", label: "공지 목록", scope: "announcement.read" },
  { rpc: "v1_llm_public_announcement_create", label: "공지 생성", scope: "announcement.write" },
  { rpc: "v1_llm_public_announcement_update", label: "공지 수정", scope: "announcement.write" },
  { rpc: "v1_llm_public_announcement_delete", label: "공지 삭제", scope: "announcement.write" },
];

function buildExtraBodyTemplate(rpc: LlmPublicRpcName): string {
  switch (rpc) {
    case "v1_llm_public_echo":
      return '{\n  "p_payload": {\n    "message": "hello"\n  }\n}';
    case "v1_llm_public_project_read":
      return "{}";
    case "v1_llm_public_manual_read":
      return "{}";
    case "v1_llm_public_project_update":
      return '{\n  "p_title": "업데이트된 프로젝트 제목",\n  "p_short_description": "짧은 설명",\n  "p_full_description": "상세 설명"\n}';
    case "v1_llm_public_announcement_list":
      return '{\n  "p_post_type": "announcement",\n  "p_limit": 10,\n  "p_offset": 0\n}';
    case "v1_llm_public_announcement_create":
      return '{\n  "p_post_type": "announcement",\n  "p_title": "새 공지 제목",\n  "p_content": "공지 본문",\n  "p_is_pinned": false\n}';
    case "v1_llm_public_announcement_update":
      return '{\n  "p_post_id": "<수정할 post uuid>",\n  "p_title": "수정된 제목"\n}';
    case "v1_llm_public_announcement_delete":
      return '{\n  "p_post_id": "<삭제할 post uuid>"\n}';
    default:
      return "{}";
  }
}

export function LlmPublicApiPlayground({ projectId }: LlmPublicApiPlaygroundProps) {
  const defaultKey = useMemo(() => deriveProjectKeyFromProjectId(projectId), [projectId]);

  /** 사용자가 붙여 넣은 odd_pat_ 평문 */
  const [plainToken, setPlainToken] = useState("");
  /** project_key 수동 수정 허용 (기본은 파생값) */
  const [projectKey, setProjectKey] = useState(defaultKey);
  /** 선택한 RPC */
  const [selectedRpc, setSelectedRpc] = useState<LlmPublicRpcName>("v1_llm_public_echo");
  /** 엔드포인트별 추가 파라미터 JSON */
  const [extraBody, setExtraBody] = useState(buildExtraBodyTemplate("v1_llm_public_echo"));
  const [isLoading, setIsLoading] = useState(false);
  /** 마지막 응답 (원본 JSON 문자열) */
  const [lastRaw, setLastRaw] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const selectedOption = useMemo(
    () => ENDPOINT_OPTIONS.find((opt) => opt.rpc === selectedRpc) ?? ENDPOINT_OPTIONS[0],
    [selectedRpc],
  );

  useEffect(() => {
    setExtraBody(buildExtraBodyTemplate(selectedRpc));
  }, [selectedRpc]);

  const runSelectedRpc = async () => {
    setLastError(null);
    setLastRaw(null);

    if (!plainToken.trim()) {
      setLastError("액세스 토큰을 입력하세요.");
      return;
    }

    let extra: Record<string, unknown> = {};
    try {
      const parsed = extraBody.trim() ? JSON.parse(extraBody) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        extra = parsed as Record<string, unknown>;
      } else {
        setLastError("추가 파라미터는 JSON 객체여야 합니다.");
        return;
      }
    } catch {
      setLastError("추가 파라미터 JSON 형식이 올바르지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        p_plain_token: plainToken.trim(),
        p_project_id: projectId,
        p_project_key: projectKey.trim() || null,
        ...extra,
      };

      const { data, error, raw } = await callLlmPublicRpc(selectedRpc, body);
      setLastRaw(JSON.stringify(raw ?? data, null, 2));
      if (error) {
        setLastError(error.message);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "호출 실패");
    } finally {
      setIsLoading(false);
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
        공개 `v1_llm_public_*` RPC를 브라우저에서 직접 호출합니다. 토큰은 이 탭 메모리에만 유지되며 저장되지 않습니다.
        현재 선택한 엔드포인트의 필요 스코프는{" "}
        <code className="text-xs font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">
          {selectedOption.scope}
        </code>
        입니다.
      </p>

      <div className="space-y-4 max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
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
          </div>
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
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">엔드포인트</label>
          <select
            value={selectedRpc}
            onChange={(e) => setSelectedRpc(e.target.value as LlmPublicRpcName)}
            className={cn(
              "w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm",
              "text-surface-900 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
            )}
          >
            {ENDPOINT_OPTIONS.map((opt) => (
              <option key={opt.rpc} value={opt.rpc}>
                {opt.rpc} · {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">추가 파라미터 (JSON 객체)</label>
            <button
              type="button"
              className="text-xs text-primary-600 hover:underline dark:text-primary-400"
              onClick={() => setExtraBody(buildExtraBodyTemplate(selectedRpc))}
            >
              템플릿 복원
            </button>
          </div>
          <textarea
            value={extraBody}
            onChange={(e) => setExtraBody(e.target.value)}
            rows={10}
            className={cn(
              "w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-mono",
              "text-surface-900 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
            )}
          />
          <p className="text-xs text-surface-500 dark:text-surface-400">
            `p_plain_token`, `p_project_id`, `p_project_key`는 위 입력값으로 자동 주입됩니다. 여기에는 엔드포인트별 추가 필드만 넣으세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={isLoading} onClick={() => void runSelectedRpc()}>
            {isLoading ? "호출 중…" : selectedRpc}
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
