import { Card, CardContent } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * FeedbackCard 스켈레톤 컴포넌트
 * 피드백 카드의 로딩 상태를 표시합니다.
 */
export function FeedbackCardSkeleton() {
  return (
    <Card className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* 투표 버튼 스켈레톤 */}
          <div className="flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg bg-surface-100 dark:bg-surface-800">
            <Skeleton variant="circular" className="h-4 w-4 mb-1" />
            <Skeleton variant="text" className="h-3 w-6" />
          </div>

          {/* 피드백 내용 스켈레톤 */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* 배지 및 액션 버튼 스켈레톤 */}
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" className="h-5 w-16 rounded-md" />
              <Skeleton variant="rectangular" className="h-5 w-12 rounded-md" />
              <Skeleton variant="rectangular" className="h-3 w-8" />
              <div className="ml-auto flex items-center gap-1">
                <Skeleton variant="circular" className="h-4 w-4" />
              </div>
            </div>

            {/* 제목 스켈레톤 */}
            <Skeleton variant="text" className="h-5 w-3/4" />

            {/* 내용 스켈레톤 (2줄) */}
            <div className="space-y-2">
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-5/6" />
            </div>

            {/* 작성자 정보 스켈레톤 */}
            <div className="flex items-center gap-3">
              <Skeleton variant="text" className="h-3 w-20" />
              <Skeleton variant="text" className="h-3 w-16" />
              <Skeleton variant="text" className="h-3 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




