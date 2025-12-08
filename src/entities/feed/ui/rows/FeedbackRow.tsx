import { Card, CardContent, Badge } from "@/shared/ui";
import { cn, formatRelativeTime, formatNumber } from "@/shared/lib/utils";
import type { FeedbackPost, FeedbackType } from "../../model/feed.types";
import { FEEDBACK_TYPE_INFO, FEEDBACK_STATUS_INFO } from "../../model/feed.types";

// 미니멀 아이콘들
const BugIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.5 2A2.5 2.5 0 002 4.5v2.879a2.5 2.5 0 00.732 1.767l1.56 1.56A2.5 2.5 0 006.06 11.5h3.879a2.5 2.5 0 001.768-.732l1.56-1.56A2.5 2.5 0 0014 7.379V4.5A2.5 2.5 0 0011.5 2h-7z"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a5 5 0 00-2 9.584V12a1 1 0 001 1h2a1 1 0 001-1v-1.416A5 5 0 008 1zM6 14a1 1 0 001 1h2a1 1 0 001-1v-.5H6v.5z"/>
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm6 4l.667 2 2 .667-2 .666L11 12l-.667-2.667L8 8.667l2-.667L11 6z"/>
  </svg>
);

const QuestionIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 11a1 1 0 110-2 1 1 0 010 2zm1-3.5V9H7v-.5c0-1.5 1.5-2 1.5-3C8.5 4.67 8 4.5 8 4.5s-.5.17-.5 1H6c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1.5-1 2-1 3z"/>
  </svg>
);

const ThumbsUpIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M4 7h1.5v6H4a1 1 0 01-1-1V8a1 1 0 011-1zm3-2.5c0-1.5 1-2.5 2-2.5.67 0 1 .33 1 1v2h2a2 2 0 012 2v.5l-1 4a2 2 0 01-2 1.5H7V4.5z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CommentIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V3z"/>
  </svg>
);

const FEEDBACK_ICONS: Record<FeedbackType, () => JSX.Element> = {
  bug: BugIcon,
  feature: LightbulbIcon,
  improvement: SparklesIcon,
  question: QuestionIcon,
};

export interface FeedbackRowProps {
  feedback: FeedbackPost;
  onVote?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * 피드백 Row
 * 
 * 버그 리포트, 기능 요청, 개선 제안, 질문 등 사용자 피드백을 표시합니다.
 * 투표 기능과 상태 표시가 포함됩니다.
 */
export function FeedbackRow({
  feedback,
  onVote,
  onClick,
  className,
}: FeedbackRowProps) {
  const TypeIcon = FEEDBACK_ICONS[feedback.type];
  const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
  const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];

  return (
    <Card 
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer",
        className
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
              "flex flex-col items-center justify-center min-w-[48px] py-2 rounded-xl transition-colors",
              feedback.isVoted
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
            )}
          >
            <ThumbsUpIcon filled={feedback.isVoted} />
            <span className="text-sm font-semibold mt-0.5 tabular-nums">{formatNumber(feedback.votesCount)}</span>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Type & Status Badges */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                typeInfo.colorClass
              )}>
                <TypeIcon />
                {typeInfo.label}
              </span>
              <Badge className={cn("rounded-full", statusInfo.colorClass)}>
                {statusInfo.label}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
              {feedback.title}
            </h3>

            {/* Content Preview */}
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              {feedback.content}
            </p>

            {/* Meta */}
            <div className="mt-2 flex items-center gap-3 text-xs text-surface-500">
              <span>@{feedback.author.username}</span>
              <span>{formatRelativeTime(feedback.createdAt)}</span>
              <span className="flex items-center gap-1">
                <CommentIcon />
                <span className="tabular-nums">{feedback.commentsCount}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== 피드백 타입별 스타일 변형 ==========

export function BugReportRow(props: Omit<FeedbackRowProps, 'feedback'> & { feedback: FeedbackPost }) {
  return <FeedbackRow {...props} />;
}

export function FeatureRequestRow(props: Omit<FeedbackRowProps, 'feedback'> & { feedback: FeedbackPost }) {
  return <FeedbackRow {...props} />;
}

export function ImprovementRow(props: Omit<FeedbackRowProps, 'feedback'> & { feedback: FeedbackPost }) {
  return <FeedbackRow {...props} />;
}

export function QuestionRow(props: Omit<FeedbackRowProps, 'feedback'> & { feedback: FeedbackPost }) {
  return <FeedbackRow {...props} />;
}
