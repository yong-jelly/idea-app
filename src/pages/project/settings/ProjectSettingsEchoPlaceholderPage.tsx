/**
 * @file ProjectSettingsEchoPlaceholderPage.tsx
 * @description 에코 API 테스트 자리. 추후 실제 엔드포인트와 연동.
 */

import { useProjectSettingsContext } from "./project-settings-context";

export function ProjectSettingsEchoPlaceholderPage() {
  const { projectId } = useProjectSettingsContext();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">에코 테스트</h2>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          토큰·프로젝트 키가 올바른지 확인하는 샘플 요청 UI가 여기에 들어갑니다.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50/80 px-4 py-10 text-center text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-900/40 dark:text-surface-400">
        <p className="font-mono text-xs text-surface-400 dark:text-surface-500">project_id: {projectId}</p>
        <p className="mt-2">API 연동 전입니다. LLM 및 API 탭에서 목업 토큰을 발급해 보세요.</p>
      </div>
    </div>
  );
}
