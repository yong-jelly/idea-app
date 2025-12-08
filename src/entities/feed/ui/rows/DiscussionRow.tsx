import { useState } from "react";
import { Card, CardContent, Avatar, Badge } from "@/shared/ui";
import { cn, formatRelativeTime, formatNumber } from "@/shared/lib/utils";
import type { DevPost } from "../../model/feed.types";
import { SimpleInteractionButtons } from "../FeedRowBase";

// 미니멀 아이콘들
const MessageIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V3z"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 8a3 3 0 100-6 3 3 0 000 6zm6-1a2 2 0 100-4 2 2 0 000 4zM5 9c-2.67 0-8 1.34-8 4v1h10v-1c0-2.66-5.33-4-8-4h1zm6 0c-.29 0-.62.02-.97.05A4.22 4.22 0 0114 13v1h2v-1c0-2.66-3.33-4-5-4z"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface DiscussionRowProps {
  post: DevPost;
  participantsCount?: number;
  onLike?: () => void;
  onComment?: () => void;
  onJoin?: () => void;
  className?: string;
}

/**
 * 토론 Row
 * 
 * 개발사에서 시작한 토론이나 투표를 표시합니다.
 * 참여자 수와 함께 커뮤니티 참여를 유도합니다.
 */
export function DiscussionRow({
  post,
  participantsCount = 0,
  onLike,
  onComment,
  onJoin,
  className,
}: DiscussionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.interactions.isLiked);
  const [likesCount, setLikesCount] = useState(post.interactions.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Discussion Header Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-4 py-2 border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <MessageIcon />
              <span className="text-sm font-medium">커뮤니티 토론</span>
            </div>
            {participantsCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                <UsersIcon />
                {formatNumber(participantsCount)}명 참여 중
              </div>
            )}
          </div>
        </div>

        <div
          className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-3">
            <Avatar fallback={post.author.displayName} size="md" />
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-surface-900 dark:text-surface-50">
                  {post.author.displayName}
                </span>
                {post.author.role && (
                  <Badge variant="secondary" className="text-[10px]">
                    {post.author.role}
                  </Badge>
                )}
                <span className="text-sm text-surface-400">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2 text-lg">
                💬 {post.title}
              </h3>
              
              {/* Content */}
              <p className={cn(
                "text-surface-600 dark:text-surface-400 whitespace-pre-wrap",
                !isExpanded && "line-clamp-3"
              )}>
                {post.content}
              </p>

              {/* Interactions */}
              <div className="mt-3 flex items-center justify-between">
                <SimpleInteractionButtons
                  interactions={{
                    likesCount,
                    commentsCount: post.interactions.commentsCount,
                    isLiked,
                  }}
                  onLike={handleLike}
                  onComment={onComment}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoin?.();
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 rounded-full transition-colors"
                  >
                    참여하기
                  </button>
                  <span className="text-surface-400">
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

