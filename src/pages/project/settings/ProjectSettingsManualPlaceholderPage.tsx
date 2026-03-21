/**
 * @file ProjectSettingsManualPlaceholderPage.tsx
 * @description 설정 내 연동 메뉴얼 탭. 공개 LLM 문서(별도 URL)로 안내.
 */

import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui";
import { useProjectSettingsContext } from "./project-settings-context";

export function ProjectSettingsManualPlaceholderPage() {
  const { projectId, project } = useProjectSettingsContext();
  const publicManualUrl = `/project/${projectId}/llm-manual`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">연동 메뉴얼</h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          LLM·에이전트용 <strong className="text-surface-800 dark:text-surface-200">공개 문서</strong>는 별도 URL에서
          제공합니다. 로그인 없이 열람·Markdown 복사가 가능하며, 토큰 등 비밀 값은 포함되지 않습니다.
        </p>
      </div>
      <div className="rounded-xl border border-surface-200 bg-white px-4 py-5 dark:border-surface-800 dark:bg-surface-900/60">
        <p className="text-sm text-surface-700 dark:text-surface-300 mb-3">
          {project ? (
            <>
              <span className="font-medium">{project.title}</span> 프로젝트의 공개 연동 사양은 아래에서 확인하세요.
            </>
          ) : (
            <>공개 연동 사양은 아래에서 확인하세요.</>
          )}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() =>
            window.open(
              `${typeof window !== "undefined" ? window.location.origin : ""}${publicManualUrl}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <ExternalLink className="h-4 w-4" />
          LLM 공개 연동 문서 열기
        </Button>
        <p className="mt-3 font-mono text-xs text-surface-500 break-all">
          {typeof window !== "undefined" ? `${window.location.origin}${publicManualUrl}` : publicManualUrl}
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50/80 px-4 py-6 text-center text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-900/40 dark:text-surface-400">
        <p className="font-mono text-xs text-surface-400 dark:text-surface-500 mb-2">project_id: {projectId}</p>
        <p>이 탭에 설정 전용 추가 안내를 넣을 수 있습니다. 상세 사양은 위 공개 문서를 기준으로 합니다.</p>
        <Link
          to={`/project/${projectId}/settings/access`}
          className="mt-3 inline-block text-primary-600 hover:underline dark:text-primary-400 text-sm"
        >
          액세스 토큰 발급으로 이동
        </Link>
      </div>
    </div>
  );
}
