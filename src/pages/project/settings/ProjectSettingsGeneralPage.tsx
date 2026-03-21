/**
 * @file ProjectSettingsGeneralPage.tsx
 * @description 프로젝트 설정 > 일반. 요약 카드와 기존 프로필 편집(/edit) 진입.
 */

import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { useProjectSettingsContext } from "./project-settings-context";

export function ProjectSettingsGeneralPage() {
  const { projectId, project } = useProjectSettingsContext();

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">일반</h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          프로젝트 이름, 소개, 이미지, 링크는 기존 편집 화면에서 수정할 수 있습니다.
        </p>
      </div>

      <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{project.title}</p>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              {project.shortDescription}
            </p>
          </div>
          <Link
            to={`/project/${projectId}/edit`}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-surface-100 px-4 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
          >
            프로필 편집
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
