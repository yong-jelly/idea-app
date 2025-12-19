import { ReactNode } from "react";
import { ProjectListItem } from "./ProjectListItem";
import { ProjectsLoading } from "@/shared/ui/ProjectsLoading";
import { useUserStore } from "@/entities/user";
import { type Project } from "../model/project.types";

export interface ProjectListProps {
  /** 표시할 프로젝트 목록 */
  projects: Project[];
  /** 로딩 중인지 여부 */
  isLoading?: boolean;
  /** 에러 메시지 (에러가 있으면 표시) */
  error?: string | null;
  /** 빈 상태일 때 표시할 컴포넌트 */
  emptyState?: ReactNode;
  /** 프로젝트 좋아요 토글 핸들러 */
  onUpvote?: (projectId: string) => void;
  /** 순위 표시 여부 (기본값: false) */
  showRank?: boolean;
  /** 더 보기 버튼 표시 여부 */
  hasMore?: boolean;
  /** 더 보기 버튼 클릭 핸들러 */
  onLoadMore?: () => void;
  /** 더 보기 버튼 로딩 중인지 여부 */
  isLoadingMore?: boolean;
  /** 목록 구분선 스타일 (기본값: "divide-y divide-surface-100 dark:divide-surface-800/60") */
  dividerClassName?: string;
}

/**
 * 프로젝트 목록을 표시하는 공통 컴포넌트
 * 
 * 로딩, 에러, 빈 상태, 목록 표시를 모두 처리합니다.
 * 내 프로젝트 여부는 자동으로 확인하여 별표시를 표시합니다.
 * 
 * @example
 * ```tsx
 * <ProjectList
 *   projects={projects}
 *   isLoading={isLoading}
 *   error={error}
 *   onUpvote={handleUpvote}
 *   showRank={true}
 * />
 * ```
 */
export function ProjectList({
  projects,
  isLoading = false,
  error = null,
  emptyState,
  onUpvote,
  showRank = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  dividerClassName = "divide-y divide-surface-100 dark:divide-surface-800/60",
}: ProjectListProps) {
  const { user } = useUserStore();

  // 로딩 상태
  if (isLoading && projects.length === 0) {
    return <ProjectsLoading />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="px-4 py-8 text-center text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  // 빈 상태
  if (projects.length === 0) {
    return (
      <>
        {emptyState || (
          <div className="px-4 py-8 text-center text-surface-500 dark:text-surface-400">
            프로젝트가 없습니다.
          </div>
        )}
      </>
    );
  }

  // 프로젝트 목록
  return (
    <>
      <div className={dividerClassName}>
        {projects.map((project, index) => {
          // 내 프로젝트인지 확인
          const isMyProject = user && user.id === project.author.id;
          return (
            <ProjectListItem
              key={project.id}
              project={{
                ...project,
                isMyProject,
              }}
              rank={showRank ? index + 1 : undefined}
              onUpvote={onUpvote}
            />
          );
        })}
      </div>

      {/* 더 보기 버튼 */}
      {hasMore && onLoadMore && (
        <div className="py-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingMore ? "로딩 중..." : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}

