/**
 * @file ProjectSettingsLayout.tsx
 * @description 프로젝트 설정 공통 레이아웃. GitHub Settings 스타일 2단(좌 네비 + 우 본문), 소유자만 접근.
 */

import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { fetchProjectDetail, type Project } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { ProjectSettingsNav } from "./ProjectSettingsNav";
import { ProjectSettingsProvider } from "./project-settings-context";

export function ProjectSettingsLayout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("프로젝트 ID가 필요합니다");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      const { overview, error: fetchError } = await fetchProjectDetail(id);
      if (cancelled) return;

      if (fetchError || !overview.project) {
        setError(fetchError?.message || "프로젝트를 찾을 수 없습니다");
        setProject(null);
        setIsLoading(false);
        return;
      }

      setProject(overview.project);
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-surface-500 dark:text-surface-400">설정을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-surface-600 dark:text-surface-400 text-center">{error || "프로젝트를 찾을 수 없습니다"}</p>
        <Link
          to={`/project/${id}`}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          프로젝트로 돌아가기
        </Link>
      </div>
    );
  }

  const isOwner = user != null && user.id === project.author.id;

  if (!isOwner) {
    return <Navigate to={`/project/${id}`} replace />;
  }

  return (
    <ProjectSettingsProvider
      value={{
        projectId: id,
        project,
        isLoading: false,
        error: null,
        isOwner: true,
      }}
    >
      <div className="min-h-screen bg-white dark:bg-surface-950">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
          <div className="mb-6 flex items-start gap-3">
            <Link
              to={`/project/${id}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
              aria-label="프로젝트로 돌아가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
                프로젝트 설정
              </p>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 truncate">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
            <ProjectSettingsNav projectId={id} />
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </ProjectSettingsProvider>
  );
}
