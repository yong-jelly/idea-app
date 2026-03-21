/**
 * @file ProjectSettingsAccessPage.tsx
 * @description 프로젝트 설정 > LLM 및 API. 공개 프로젝트 키 + Supabase RPC로 액세스 토큰 목록·발급·폐기.
 */

import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, FileText } from "lucide-react";
import { Button } from "@/shared/ui";
import { useProjectSettingsContext } from "./project-settings-context";
import { useProjectAccessTokens } from "./hooks/useProjectAccessTokens";
import { GenerateAccessTokenModal } from "@/widgets/modal/generate-access-token.modal";
import { ProjectKeyCard } from "./components/ProjectKeyCard";
import { AccessTokenTable } from "./components/AccessTokenTable";

export function ProjectSettingsAccessPage() {
  const { projectId } = useProjectSettingsContext();
  const { projectKey, tokens, isLoading, error, createToken, revokeToken } = useProjectAccessTokens(projectId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">LLM 및 API</h2>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 max-w-2xl">
            프로젝트 키는 공개해도 되는 식별자이며, 액세스 토큰은 비밀로 보관해야 합니다. LLM·API 연동 시 두
            값을 함께 사용하고, 토큰은 필요한 최소 권한으로 발급한 뒤 더 이상 쓰지 않으면 회수하세요.
          </p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => setModalOpen(true)} disabled={isLoading}>
          새 토큰 생성
        </Button>
      </div>

      <ProjectKeyCard projectKey={projectKey} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-sm">
        <Link
          to={`/project/${projectId}/llm-manual`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/80 px-3 py-2 font-medium text-primary-800 hover:bg-primary-100/90 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-200 dark:hover:bg-primary-900/50"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span>
            LLM 공개 연동 문서
            <span className="block text-xs font-normal text-primary-600/90 dark:text-primary-300/80">
              인증 없이 열리는 공개 URL · Markdown 복사 가능
            </span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:ml-1">
          <Link
            to={`/project/${projectId}/settings/manual`}
            className="inline-flex items-center gap-1.5 text-primary-600 hover:underline dark:text-primary-400"
          >
            <BookOpen className="h-4 w-4" />
            연동 메뉴얼
          </Link>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <Link
            to={`/project/${projectId}/settings/echo`}
            className="text-primary-600 hover:underline dark:text-primary-400"
          >
            에코 테스트
          </Link>
        </div>
      </div>

      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">액세스 토큰</h3>
          <p className="mt-0.5 text-sm text-surface-600 dark:text-surface-400">
            이름·스코프·만료를 관리합니다. 평문은 발급 직후 한 번만 표시됩니다.
          </p>
        </div>
        {isLoading ? (
          <p className="text-sm text-surface-500 dark:text-surface-400 py-6 text-center">불러오는 중…</p>
        ) : (
          <AccessTokenTable tokens={tokens} onRevoke={revokeToken} />
        )}
      </section>

      <GenerateAccessTokenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(name, scopes, preset) => createToken(name, scopes, preset)}
      />
    </div>
  );
}
