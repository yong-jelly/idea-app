import { Card, CardContent } from "@/shared/ui";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * DevPostCard 스켈레톤 컴포넌트
 * 공지사항 카드의 로딩 상태를 표시합니다.
 */
export function DevPostCardSkeleton() {
  return (
    <Card 
      variant="bordered"
      className="border-surface-200/80 dark:border-surface-800 shadow-none"
    >
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 아바타 스켈레톤 */}
            <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
            
            <div className="flex-1 min-w-0 space-y-3">
              {/* 작성자 정보 스켈레톤 */}
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-3 w-16" />
                <Skeleton variant="text" className="h-3 w-20" />
              </div>
              
              {/* 제목 스켈레톤 */}
              <Skeleton variant="text" className="h-5 w-3/4" />
              
              {/* 내용 스켈레톤 */}
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-5/6" />
                <Skeleton variant="text" className="h-4 w-4/6" />
              </div>
              
              {/* 액션 버튼 스켈레톤 */}
              <div className="flex items-center gap-4 pt-2">
                <Skeleton variant="rectangular" className="h-5 w-12" />
                <Skeleton variant="rectangular" className="h-5 w-12" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

