/**
 * @file project-settings-context.tsx
 * @description 프로젝트 설정 하위 라우트에 공통으로 전달할 프로젝트 상세·로딩·오류 상태. 레이아웃에서 fetch 후 Provider로 주입.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Project } from "@/entities/project";

export type ProjectSettingsContextValue = {
  /** 현재 프로젝트 ID (URL) */
  projectId: string;
  /** fetchProjectDetail 결과 */
  project: Project | null;
  /** 초기 로딩 */
  isLoading: boolean;
  /** 로드 실패 메시지 */
  error: string | null;
  /** 현재 사용자가 프로젝트 작성자인지 */
  isOwner: boolean;
};

const ProjectSettingsContext = createContext<ProjectSettingsContextValue | null>(null);

export function ProjectSettingsProvider({
  value,
  children,
}: {
  value: ProjectSettingsContextValue;
  children: ReactNode;
}) {
  return <ProjectSettingsContext.Provider value={value}>{children}</ProjectSettingsContext.Provider>;
}

export function useProjectSettingsContext(): ProjectSettingsContextValue {
  const ctx = useContext(ProjectSettingsContext);
  if (!ctx) {
    throw new Error("useProjectSettingsContext must be used within ProjectSettingsProvider");
  }
  return ctx;
}
