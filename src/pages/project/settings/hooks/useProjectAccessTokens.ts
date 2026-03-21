/**
 * @file useProjectAccessTokens.ts
 * @description 프로젝트 설정 > LLM/API 액세스 토큰 목록·발급·폐기. 마운트 시 RPC로 목록 로드, 생성 후 목록 재조회.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProjectAccessToken,
  fetchProjectAccessTokens,
  revokeProjectAccessToken,
  type ProjectAccessToken,
} from "@/entities/project";
import { deriveProjectKeyFromProjectId, expirationPresetToExpiresAt, type ExpirationPreset } from "@/features/project-settings";

export function useProjectAccessTokens(projectId: string) {
  const projectKey = useMemo(() => deriveProjectKeyFromProjectId(projectId), [projectId]);

  /** RPC에서 가져온 토큰 행 목록 */
  const [tokens, setTokens] = useState<ProjectAccessToken[]>([]);
  /** 초기·재조회 로딩 */
  const [isLoading, setIsLoading] = useState(true);
  /** 목록/뮤테이션 에러 메시지 */
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    if (!projectId) {
      setTokens([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { tokens: rows, error: err } = await fetchProjectAccessTokens(projectId, false);
    if (err) {
      setError(err.message);
      setTokens([]);
    } else {
      setTokens(rows);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  /**
   * 토큰 생성 후 평문 반환. 실패 시 Error throw (모달에서 처리).
   */
  const createToken = useCallback(
    async (name: string, scopes: string[], preset: ExpirationPreset) => {
      const expiresAt = expirationPresetToExpiresAt(preset);
      const { data, error: createErr } = await createProjectAccessToken(
        projectId,
        name.trim() || "새 토큰",
        scopes,
        expiresAt,
      );
      if (createErr || !data) {
        throw createErr ?? new Error("토큰 발급에 실패했습니다");
      }
      await loadTokens();
      return data.plainToken;
    },
    [projectId, loadTokens],
  );

  const revokeToken = useCallback(
    async (id: string) => {
      setError(null);
      const { error: revokeErr } = await revokeProjectAccessToken(id);
      if (revokeErr) {
        setError(revokeErr.message);
        return;
      }
      await loadTokens();
    },
    [loadTokens],
  );

  return {
    projectKey,
    tokens,
    isLoading,
    error,
    refetch: loadTokens,
    createToken,
    revokeToken,
  };
}
