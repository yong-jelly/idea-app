/**
 * @file project-llm-public.api.ts
 * @description LLM 공개 RPC — anon 세션 + 액세스 토큰(평문) + 스코프 검증. DB `067_v1_llm_public_api.sql`.
 */

import { supabase } from "@/shared/lib/supabase";

/**
 * 공개 RPC 공통 에러 본문 (서버 `error` jsonb).
 */
export type LlmPublicErrorBody = {
  /** INVALID_TOKEN | INVALID_ARGUMENT | INVALID_PROJECT_KEY | NOT_FOUND | INSUFFICIENT_SCOPE | INTERNAL */
  code: string;
  message: string;
  required_scopes?: unknown;
  token_scopes?: unknown;
};

/**
 * v1_llm_public_echo 성공 페이로드 (요약).
 */
export type LlmPublicEchoSuccess = {
  ok: true;
  project_id: string;
  project_key: string;
  echo: {
    received: unknown;
    server_time: string;
  };
  token: {
    id: string;
    prefix: string;
    scopes: unknown;
  };
};

/**
 * v1_llm_public_project_read 성공 페이로드 (요약).
 */
export type LlmPublicProjectReadSuccess = {
  ok: true;
  project_id: string;
  project_key: string;
  project: Record<string, unknown>;
  token: {
    id: string;
    prefix: string;
    scopes: unknown;
  };
};

/**
 * 공개 에코 호출. 스코프 `echo.invoke` 필요.
 * @param plainToken odd_pat_… 평문
 * @param projectId 프로젝트 UUID (project_key 단독 사용 시 null)
 * @param projectKey prj_… (project_id 단독 사용 시 null)
 * @param payload 에코로 되돌릴 JSON
 */
export async function llmPublicEcho(
  plainToken: string,
  projectId: string | null,
  projectKey: string | null,
  payload: Record<string, unknown> = {},
): Promise<{ data: LlmPublicEchoSuccess | null; error: Error | null; raw: unknown }> {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_llm_public_echo", {
      p_plain_token: plainToken.trim(),
      p_project_id: projectId,
      p_project_key: projectKey?.trim() || null,
      p_payload: payload,
    });

    if (error) {
      return { data: null, error: new Error(error.message), raw: null };
    }

    const row = data as Record<string, unknown> | null;
    if (!row) {
      return { data: null, error: new Error("응답이 없습니다"), raw: null };
    }
    if (row.ok === false) {
      const err = row.error as LlmPublicErrorBody | undefined;
      const msg = err?.message ?? `에코 거부 (${String(err?.code ?? "UNKNOWN")})`;
      return { data: null, error: new Error(msg), raw: row };
    }
    if (row.ok !== true) {
      return { data: null, error: new Error("알 수 없는 응답 형식입니다"), raw: row };
    }

    return { data: row as unknown as LlmPublicEchoSuccess, error: null, raw: row };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("알 수 없는 오류"),
      raw: null,
    };
  }
}

/**
 * 공개 프로젝트 요약 조회. 스코프 `project.read` 필요.
 */
export async function llmPublicProjectRead(
  plainToken: string,
  projectId: string | null,
  projectKey: string | null,
): Promise<{ data: LlmPublicProjectReadSuccess | null; error: Error | null; raw: unknown }> {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_llm_public_project_read", {
      p_plain_token: plainToken.trim(),
      p_project_id: projectId,
      p_project_key: projectKey?.trim() || null,
    });

    if (error) {
      return { data: null, error: new Error(error.message), raw: null };
    }

    const row = data as Record<string, unknown> | null;
    if (!row) {
      return { data: null, error: new Error("응답이 없습니다"), raw: null };
    }
    if (row.ok === false) {
      const err = row.error as LlmPublicErrorBody | undefined;
      const msg = err?.message ?? `조회 거부 (${String(err?.code ?? "UNKNOWN")})`;
      return { data: null, error: new Error(msg), raw: row };
    }
    if (row.ok !== true) {
      return { data: null, error: new Error("알 수 없는 응답 형식입니다"), raw: row };
    }

    return { data: row as unknown as LlmPublicProjectReadSuccess, error: null, raw: row };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("알 수 없는 오류"),
      raw: null,
    };
  }
}
