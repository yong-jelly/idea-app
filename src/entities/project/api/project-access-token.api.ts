/**
 * @file project-access-token.api.ts
 * @description odd 스키마 RPC — 프로젝트 LLM/API 액세스 토큰 목록 조회·발급·폐기. 평문은 v1_create 응답에만 1회 포함.
 */

import { supabase } from "@/shared/lib/supabase";
import { PROJECT_ACCESS_TOKEN_NAME_MAX_LEN } from "../model/project-access-token.constants";

/**
 * 목록/표시용 토큰 행. DB의 token_name·token_prefix를 name·tokenPrefix로 정규화.
 */
export type ProjectAccessToken = {
  /** 행 PK (uuid) */
  id: string;
  /** 사용자 지정 표시 이름 */
  name: string;
  /** 목록 표시용 접두사 (평문 전체 아님) */
  tokenPrefix: string;
  /** 부여된 스코프 목록 */
  scopes: string[];
  /** 만료 시각 ISO 문자열, 없으면 null (무제한) */
  expiresAt: string | null;
  /** 마지막 사용 시각, 없으면 null */
  lastUsedAt: string | null;
  /** 생성 시각 ISO */
  createdAt: string;
  /** 폐기 여부 */
  isRevoked: boolean;
};

/**
 * RPC v1_create_project_access_token 성공 응답 (jsonb).
 */
export type CreateProjectAccessTokenData = {
  /** 새 행 id */
  id: string;
  /** DB에 저장되지 않는 평문 (1회만 클라이언트에 전달) */
  plainToken: string;
};

/**
 * 프로젝트 액세스 토큰 목록 조회 결과.
 */
export type FetchProjectAccessTokensResult = {
  tokens: ProjectAccessToken[];
  error: Error | null;
};

/**
 * 발급 결과.
 */
export type CreateProjectAccessTokenResult = {
  data: CreateProjectAccessTokenData | null;
  error: Error | null;
};

/**
 * 폐기 결과.
 */
export type RevokeProjectAccessTokenResult = {
  data: boolean | null;
  error: Error | null;
};

/**
 * jsonb / 배열 스코프를 string[]로 정규화.
 */
function normalizeScopes(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s));
  }
  return [];
}

/**
 * RPC fetch 행을 ProjectAccessToken으로 매핑.
 */
function mapAccessTokenRow(row: Record<string, unknown>): ProjectAccessToken {
  return {
    id: String(row.id ?? ""),
    name: String(row.token_name ?? ""),
    tokenPrefix: String(row.token_prefix ?? ""),
    scopes: normalizeScopes(row.scopes),
    expiresAt: row.expires_at == null ? null : String(row.expires_at),
    lastUsedAt: row.last_used_at == null ? null : String(row.last_used_at),
    createdAt: String(row.created_at ?? ""),
    isRevoked: Boolean(row.is_revoked),
  };
}

/**
 * 프로젝트 액세스 토큰 목록 조회 (작성자만).
 * @param projectId 프로젝트 UUID
 * @param includeRevoked true면 폐기된 토큰 포함
 */
export async function fetchProjectAccessTokens(
  projectId: string,
  includeRevoked = false,
): Promise<FetchProjectAccessTokensResult> {
  try {
    if (!projectId) {
      return { tokens: [], error: new Error("프로젝트 ID가 필요합니다") };
    }

    const { data, error } = await supabase.schema("odd").rpc("v1_fetch_project_access_tokens", {
      p_project_id: projectId,
      p_include_revoked: includeRevoked,
    });

    if (error) {
      console.error("액세스 토큰 목록 조회 에러:", error);
      return {
        tokens: [],
        error: new Error(error.message || "토큰 목록을 불러오는데 실패했습니다"),
      };
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const tokens = rows.map((row) => mapAccessTokenRow(row));

    return { tokens, error: null };
  } catch (err) {
    console.error("액세스 토큰 목록 조회 예외:", err);
    return {
      tokens: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 액세스 토큰 발급. 평문은 응답에만 포함되며 DB에는 해시만 저장됨.
 * @param projectId 프로젝트 UUID
 * @param tokenName 표시 이름 (1~15자, trim)
 * @param scopes 허용 스코프 (최소 1개)
 * @param expiresAtIso 만료 시각 ISO, 무제한이면 null
 */
export async function createProjectAccessToken(
  projectId: string,
  tokenName: string,
  scopes: string[],
  expiresAtIso: string | null,
): Promise<CreateProjectAccessTokenResult> {
  try {
    if (!projectId) {
      return { data: null, error: new Error("프로젝트 ID가 필요합니다") };
    }

    /* UI·입력에서 제한; RPC 전에 trim 후 최대 길이로 잘라 DB·RPC와 맞춤 */
    const resolvedName = (tokenName.trim() || "새 토큰").slice(0, PROJECT_ACCESS_TOKEN_NAME_MAX_LEN);

    const { data, error } = await supabase.schema("odd").rpc("v1_create_project_access_token", {
      p_project_id: projectId,
      p_token_name: resolvedName,
      p_scopes: scopes,
      p_expires_at: expiresAtIso,
    });

    if (error) {
      console.error("액세스 토큰 발급 에러:", error);
      return {
        data: null,
        error: new Error(error.message || "토큰을 발급할 수 없습니다"),
      };
    }

    /* jsonb 단일 반환 — snake_case 키 */
    const payload = data as { id?: string; plain_token?: string } | null;
    if (!payload?.id || !payload?.plain_token) {
      return { data: null, error: new Error("서버 응답 형식이 올바르지 않습니다") };
    }

    return {
      data: {
        id: payload.id,
        plainToken: payload.plain_token,
      },
      error: null,
    };
  } catch (err) {
    console.error("액세스 토큰 발급 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 액세스 토큰 폐기 (작성자만).
 * @param tokenId 행 PK (uuid)
 */
export async function revokeProjectAccessToken(tokenId: string): Promise<RevokeProjectAccessTokenResult> {
  try {
    if (!tokenId) {
      return { data: null, error: new Error("토큰 ID가 필요합니다") };
    }

    const { data, error } = await supabase.schema("odd").rpc("v1_revoke_project_access_token", {
      p_token_id: tokenId,
    });

    if (error) {
      console.error("액세스 토큰 폐기 에러:", error);
      return {
        data: null,
        error: new Error(error.message || "토큰을 폐기할 수 없습니다"),
      };
    }

    return { data: data === true, error: null };
  } catch (err) {
    console.error("액세스 토큰 폐기 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}
