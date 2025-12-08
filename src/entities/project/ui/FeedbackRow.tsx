import {
  ThumbsUp,
  MessageCircle,
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquareText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, Badge, Avatar } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";

// ========== 타입 ==========

export type FeedbackType = "bug" | "feature" | "improvement" | "question";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";

export interface FeedbackAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface FeedbackData {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  title: string;
  content: string;
  images?: string[];
  author: FeedbackAuthor;
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  hasDevResponse?: boolean;
  createdAt: string;
}

// ========== 상수 ==========

export const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", icon: Bug, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
  feature: { label: "기능 요청", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  improvement: { label: "개선 제안", icon: Sparkles, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20" },
  question: { label: "질문", icon: MessageSquareText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
};

export const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", icon: AlertCircle, color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", icon: Clock, color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", icon: X, color: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
};

// ========== Props ==========

export interface FeedbackRowProps {
  /** 피드백 데이터 */
  feedback: FeedbackData;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 투표 핸들러 */
  onVote?: () => void;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 피드백 Row 컴포넌트
 * 
 * 피드백 목록에서 각 피드백을 표시하는 Row 컴포넌트입니다.
 * GitHub Issues 스타일을 참고하여 구현되었습니다.
 */
export function FeedbackRow({
  feedback,
  onClick,
  onVote,
  compact = false,
}: FeedbackRowProps) {
  const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
  const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700",
          "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
          onClick && "cursor-pointer"
        )}
      >
        {/* Vote Count */}
        <div
          className={cn(
            "flex items-center justify-center h-8 min-w-[36px] rounded text-xs font-bold shrink-0",
            feedback.isVoted
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              : "bg-surface-100 text-surface-500 dark:bg-surface-800"
          )}
        >
          {formatNumber(feedback.votesCount)}
        </div>

        {/* Type Icon */}
        <div className={cn("p-1.5 rounded", typeInfo.color)}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-surface-900 dark:text-surface-50 truncate">
            {feedback.title}
          </h4>
        </div>

        {/* Status & Comments */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("text-[10px]", statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          {feedback.commentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-surface-400">
              <MessageCircle className="h-3 w-3" />
              {feedback.commentsCount}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Vote Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVote?.();
            }}
            className={cn(
              "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors",
              feedback.isVoted
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
            )}
          >
            <ThumbsUp className={cn("h-4 w-4", feedback.isVoted && "fill-current")} />
            <span className="text-sm font-semibold mt-0.5">{formatNumber(feedback.votesCount)}</span>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", typeInfo.color)}>
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </span>
              <Badge className={cn("flex items-center gap-1", statusInfo.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
              {feedback.hasDevResponse && (
                <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-[10px]">
                  개발팀 답변
                </Badge>
              )}
              {feedback.images && feedback.images.length > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-surface-400">
                  <ImageIcon className="h-3 w-3" />
                  {feedback.images.length}
                </span>
              )}
              {onClick && <ChevronRight className="h-4 w-4 text-surface-400 ml-auto shrink-0" />}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
              {feedback.title}
            </h3>

            {/* Content Preview */}
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-2">
              {feedback.content}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-surface-500">
              <div className="flex items-center gap-1.5">
                <Avatar fallback={feedback.author.displayName} size="xs" className="h-4 w-4" />
                <span>@{feedback.author.username}</span>
              </div>
              <span>{formatRelativeTime(feedback.createdAt)}</span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {feedback.commentsCount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

