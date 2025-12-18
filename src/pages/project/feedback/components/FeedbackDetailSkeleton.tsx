import { Card, CardContent, Separator, Skeleton } from "@/shared/ui";

/**
 * FeedbackDetailPage 스켈레톤 컴포넌트
 * 피드백 상세 페이지의 로딩 상태를 표시합니다.
 */
export function FeedbackDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Skeleton variant="rectangular" className="h-4 w-48 mb-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Feedback Header Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Title Section */}
                <div className="p-6 pb-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
                    <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
                    <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
                  </div>

                  {/* Title */}
                  <Skeleton variant="text" className="h-7 w-3/4 mb-4" />

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" className="h-10 w-10" />
                    <div className="space-y-2">
                      <Skeleton variant="text" className="h-4 w-24" />
                      <Skeleton variant="text" className="h-3 w-32" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Content Section */}
                <div className="p-6">
                  <div className="space-y-2">
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-full" />
                    <Skeleton variant="text" className="h-4 w-5/6" />
                    <Skeleton variant="text" className="h-4 w-4/6" />
                  </div>
                </div>

                <Separator />

                {/* Actions Bar */}
                <div className="px-6 py-4 flex items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50">
                  <Skeleton variant="rectangular" className="h-9 w-20 rounded-lg" />
                  <Skeleton variant="rectangular" className="h-4 w-24" />
                  <div className="ml-auto flex items-center gap-2">
                    <Skeleton variant="rectangular" className="h-8 w-16 rounded-lg" />
                    <Skeleton variant="rectangular" className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                <Skeleton variant="text" className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton variant="text" className="h-4 w-20" />
                          <Skeleton variant="text" className="h-3 w-16" />
                        </div>
                        <Skeleton variant="text" className="h-4 w-full" />
                        <Skeleton variant="text" className="h-4 w-3/4" />
                        <div className="flex items-center gap-4 pt-1">
                          <Skeleton variant="rectangular" className="h-4 w-12" />
                          <Skeleton variant="rectangular" className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vote Card */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <Skeleton variant="text" className="h-8 w-16 mx-auto mb-1" />
                  <Skeleton variant="text" className="h-4 w-12 mx-auto" />
                </div>
                <Skeleton variant="rectangular" className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                  <Skeleton variant="text" className="h-4 w-20" />
                </div>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <Skeleton variant="text" className="h-4 w-16" />
                      <Skeleton variant="text" className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

