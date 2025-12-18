import { Skeleton } from "./Skeleton";
import { cn } from "@/shared/lib/utils";

interface CommentsLoadingProps {
  /** 최소 높이 (px 단위, 기본값: 400) */
  minHeight?: number;
  /** 스켈레톤 댓글 개수 (기본값: 3) */
  skeletonCount?: number;
}

/**
 * 댓글 목록 로딩 상태를 표시하는 컴포넌트
 * 높이를 고정하여 로딩 중 레이아웃 시프트를 방지합니다.
 * 댓글 목록 영역만 표시합니다 (댓글 작성 폼 제외).
 */
export function CommentsLoading({ minHeight = 300, skeletonCount = 3 }: CommentsLoadingProps) {
  return (
    <div style={{ minHeight: `${minHeight}px` }}>
      {/* 댓글 스켈레톤 */}
      <div className="space-y-6">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="space-y-3">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-3 w-16" />
              </div>
            </div>

            {/* 댓글 내용 */}
            <div className="space-y-2 pl-[52px]">
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-5/6" />
              {index === 0 && <Skeleton variant="text" className="h-4 w-4/6" />}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-4 pl-[52px]">
              <Skeleton variant="rectangular" className="h-8 w-16" />
              <Skeleton variant="rectangular" className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

