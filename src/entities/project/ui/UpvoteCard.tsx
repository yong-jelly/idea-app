import { ChevronUp, Trophy } from "lucide-react";
import { cn, formatNumber } from "@/shared/lib/utils";

export interface UpvoteCardProps {
  /** 현재 순위 */
  rank: number;
  /** 업보트 수 */
  upvoteCount: number;
  /** 업보트 여부 */
  isUpvoted?: boolean;
  /** 업보트 클릭 핸들러 */
  onUpvote?: () => void;
  /** 커스텀 클래스 */
  className?: string;
}

export function UpvoteCard({
  rank,
  upvoteCount,
  isUpvoted = false,
  onUpvote,
  className,
}: UpvoteCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg",
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-primary-100 text-sm font-medium">오늘의 순위</div>
            <div className="text-4xl font-bold">#{rank}</div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Trophy className="h-7 w-7" />
          </div>
        </div>
        <button
          onClick={onUpvote}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-lg transition-all",
            isUpvoted
              ? "bg-white text-primary-600"
              : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
          )}
        >
          <ChevronUp className={cn("h-6 w-6", isUpvoted && "text-primary-500")} />
          {isUpvoted ? "응원함" : "응원하기"} • {formatNumber(upvoteCount)}
        </button>
      </div>
    </div>
  );
}

