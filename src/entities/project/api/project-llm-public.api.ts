/**
 * @file project-llm-public.api.ts
 * @description LLM 공개 RPC — anon 세션 + 액세스 토큰(평문) + 스코프 검증. DB `067~069_v1_llm_*.sql`.
 */

import { supabase } from "@/shared/lib/supabase";

/**
 * 공개 RPC 이름 목록. `llm-manual`에 문서화된 엔드포인트와 동일해야 한다.
 */
export type LlmPublicRpcName =
  | "v1_llm_public_echo"
  | "v1_llm_public_project_read"
  | "v1_llm_public_manual_read"
  | "v1_llm_public_project_update"
  | "v1_llm_public_announcement_list"
  | "v1_llm_public_announcement_create"
  | "v1_llm_public_announcement_update"
  | "v1_llm_public_announcement_delete";

/**
 * 공개 RPC 공통 에러 본문 (서버 `error` jsonb).
 */
export type LlmPublicErrorBody = {
  /** INVALID_TOKEN | INVALID_ARGUMENT | INVALID_PROJECT_KEY | NOT_FOUND | INSUFFICIENT_SCOPE | INTERNAL | VALIDATION_ERROR | FORBIDDEN */
  code: string;
  message: string;
  required_scopes?: unknown;
  token_scopes?: unknown;
};

/**
 * 공개 RPC 공통 성공 페이로드의 최소 형태.
 */
export type LlmPublicSuccessBase = {
  ok: true;
  project_id: string;
  project_key: string;
  token?: {
    id: string;
    prefix: string;
    scopes: unknown;
  };
};

/**
 * 에코 응답 요약.
 */
export type LlmPublicEchoSuccess = LlmPublicSuccessBase & {
  echo: {
    received: unknown;
    server_time: string;
  };
};

/**
 * 프로젝트 읽기 응답 요약.
 */
export type LlmPublicProjectReadSuccess = LlmPublicSuccessBase & {
  project: Record<string, unknown>;
};

/**
 * 공개 RPC 호출 결과 래퍼.
 */
export type LlmPublicRpcResult<T = Record<string, unknown>> = {
  data: T | null;
  error: Error | null;
  raw: unknown;
};

/**
 * `{ ok, error }` 형식 응답을 표준 래퍼로 정규화.
 */
function normalizeLlmPublicResult<T>(data: unknown, error: { message: string } | null): LlmPublicRpcResult<T> {
  if (error) {
    return { data: null, error: new Error(error.message), raw: null };
  }

  const row = data as Record<string, unknown> | null;
  if (!row) {
    return { data: null, error: new Error("응답이 없습니다"), raw: null };
  }

  if (row.ok === false) {
    const err = row.error as LlmPublicErrorBody | undefined;
    return {
      data: null,
      error: new Error(err?.message ?? `호출 거부 (${String(err?.code ?? "UNKNOWN")})`),
      raw: row,
    };
  }

  if (row.ok !== true) {
    return { data: null, error: new Error("알 수 없는 응답 형식입니다"), raw: row };
  }

  return { data: row as unknown as T, error: null, raw: row };
}

/**
 * 공개 RPC 공용 호출기. 플레이그라운드와 개별 헬퍼가 공유한다.
 * @param rpcName `v1_llm_public_*`
 * @param body RPC 본문
 */
export async function callLlmPublicRpc<T = Record<string, unknown>>(
  rpcName: LlmPublicRpcName,
  body: Record<string, unknown>,
): Promise<LlmPublicRpcResult<T>> {
  try {
    const { data, error } = await supabase.schema("odd").rpc(rpcName, body);
    return normalizeLlmPublicResult<T>(data, error);
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("알 수 없는 오류"),
      raw: null,
    };
  }
}

/**
 * 공개 에코 호출. 스코프 `echo.invoke` 필요.
 */
export async function llmPublicEcho(
  plainToken: string,
  projectId: string | null,
  projectKey: string | null,
  payload: Record<string, unknown> = {},
): Promise<LlmPublicRpcResult<LlmPublicEchoSuccess>> {
  return callLlmPublicRpc<LlmPublicEchoSuccess>("v1_llm_public_echo", {
    p_plain_token: plainToken.trim(),
    p_project_id: projectId,
    p_project_key: projectKey?.trim() || null,
    p_payload: payload,
  });
}

/**
 * 공개 프로젝트 요약 조회. 스코프 `project.read` 필요.
 */
export async function llmPublicProjectRead(
  plainToken: string,
  projectId: string | null,
  projectKey: string | null,
): Promise<LlmPublicRpcResult<LlmPublicProjectReadSuccess>> {
  return callLlmPublicRpc<LlmPublicProjectReadSuccess>("v1_llm_public_project_read", {
    p_plain_token: plainToken.trim(),
    p_project_id: projectId,
    p_project_key: projectKey?.trim() || null,
  });
}
