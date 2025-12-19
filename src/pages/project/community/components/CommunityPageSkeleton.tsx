import { Skeleton } from "@/shared/ui";

/**
 * ProjectCommunityPage 스켈레톤 컴포넌트
 * 커뮤니티 페이지의 로딩 상태를 표시합니다.
 */
export function CommunityPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* 뒤로가기 링크 스켈레톤 */}
          <Skeleton variant="rectangular" className="h-4 w-48 mb-4" />

          <div className="flex items-center gap-4">
            {/* 프로젝트 썸네일/아이콘 스켈레톤 */}
            <Skeleton variant="rectangular" className="h-14 w-14 rounded-xl shrink-0" />

            {/* 제목과 설명 영역 */}
            <div className="flex-1 space-y-2">
              {/* 제목 스켈레톤 */}
              <Skeleton variant="text" className="h-6 w-64" />
              {/* 설명 스켈레톤 */}
              <Skeleton variant="text" className="h-4 w-full max-w-md" />
            </div>
          </div>
        </div>

        {/* Tabs 스켈레톤 */}
        <div className="border-b border-surface-200 dark:border-surface-800 mb-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" className="h-12 w-20 rounded-t-lg" />
            ))}
          </div>
        </div>

        {/* Tab Content 스켈레톤 */}
        <div className="min-h-[60vh] space-y-4">
          <Skeleton variant="rectangular" className="h-32 w-full rounded-lg" />
          <Skeleton variant="rectangular" className="h-32 w-full rounded-lg" />
          <Skeleton variant="rectangular" className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

