import { Skeleton } from "./Skeleton";

interface ProjectsLoadingProps {
  /** 스켈레톤 프로젝트 개수 (기본값: 5) */
  count?: number;
}

/**
 * 프로젝트 목록 로딩 상태를 표시하는 컴포넌트
 * ProjectListItem 구조에 맞춘 스켈레톤 UI를 제공합니다.
 */
export function ProjectsLoading({ count = 5 }: ProjectsLoadingProps) {
  return (
    <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start gap-4 py-5 px-4">
          {/* 썸네일/아이콘 스켈레톤 */}
          <div className="shrink-0">
            <Skeleton variant="rectangular" className="h-16 w-16 rounded-2xl" />
          </div>

          {/* 콘텐츠 영역 */}
          <div className="min-w-0 flex-1 pt-0.5 space-y-2">
            {/* 제목 스켈레톤 */}
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-5 w-8" />
              <Skeleton variant="text" className="h-5 w-48" />
            </div>

            {/* 설명 스켈레톤 */}
            <Skeleton variant="text" className="h-4 w-full max-w-md" />

            {/* 카테고리/기술 스택 스켈레톤 */}
            <div className="flex items-center gap-1.5">
              <Skeleton variant="text" className="h-3 w-16" />
              <Skeleton variant="text" className="h-3 w-12" />
              <Skeleton variant="text" className="h-3 w-20" />
            </div>
          </div>

          {/* 액션 버튼 영역 */}
          <div className="flex items-center gap-2 pt-1">
            {/* 댓글 버튼 스켈레톤 */}
            <Skeleton variant="rectangular" className="h-14 w-[52px] rounded-lg" />
            {/* 좋아요 버튼 스켈레톤 */}
            <Skeleton variant="rectangular" className="h-14 w-[52px] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

