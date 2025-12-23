import { Card, CardContent, Skeleton } from "@/shared/ui";

/**
 * MilestoneDetailPage 스켈레톤 컴포넌트
 * 마일스톤 상세 페이지의 로딩 상태를 표시합니다.
 */
export function MilestoneDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* 뒤로가기 링크 스켈레톤 */}
          <Skeleton variant="rectangular" className="h-4 w-48 mb-4" />

          <div className="flex items-start gap-4">
            {/* Progress Circle 스켈레톤 */}
            <Skeleton variant="rectangular" className="h-[60px] w-[60px] rounded-xl shrink-0" />

            {/* Title & Description 영역 */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* 제목 스켈레톤 */}
              <Skeleton variant="text" className="h-7 w-3/4" />

              {/* 설명 스켈레톤 */}
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-5/6" />
              </div>

              {/* Stats 스켈레톤 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Skeleton variant="rectangular" className="h-4 w-20 rounded" />
                <Skeleton variant="rectangular" className="h-4 w-20 rounded" />
                <Skeleton variant="rectangular" className="h-4 w-24 rounded" />
              </div>

              {/* Progress Bar 스켈레톤 */}
              <Skeleton variant="rectangular" className="h-2 w-full max-w-sm rounded-full" />
            </div>
          </div>
        </div>

        {/* Tasks Section 스켈레톤 */}
        <div className="space-y-4">
          {/* Tasks Header 스켈레톤 */}
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="h-6 w-32" />
            <Skeleton variant="rectangular" className="h-9 w-24 rounded-lg" />
          </div>

          {/* Task Cards 스켈레톤 */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-surface-100 dark:border-surface-800">
                    {/* 체크박스 스켈레톤 */}
                    <Skeleton variant="circular" className="h-5 w-5 mt-0.5 shrink-0" />

                    {/* 태스크 내용 스켈레톤 */}
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-4 w-3/4" />
                      <Skeleton variant="text" className="h-3 w-1/2" />
                      <div className="flex items-center gap-2">
                        <Skeleton variant="rectangular" className="h-3 w-16 rounded" />
                        <Skeleton variant="rectangular" className="h-3 w-12 rounded" />
                      </div>
                    </div>

                    {/* 액션 버튼 스켈레톤 */}
                    <div className="flex items-center gap-1">
                      <Skeleton variant="circular" className="h-6 w-6" />
                      <Skeleton variant="circular" className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}






