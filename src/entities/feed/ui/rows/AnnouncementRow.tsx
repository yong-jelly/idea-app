import { useState } from "react";
import { Card, CardContent, Avatar, Badge } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import type { DevPost } from "../../model/feed.types";
import { AuthorHeader, SimpleInteractionButtons } from "../FeedRowBase";

export interface AnnouncementRowProps {
  post: DevPost;
  onLike?: () => void;
  onComment?: () => void;
  onExpand?: () => void;
  className?: string;
}

/**
 * 공지/업데이트 Row
 * 
 * 개발사에서 발행하는 공지사항이나 업데이트 안내를 표시합니다.
 * 고정 기능과 확장/축소가 가능합니다.
 */
// 미니멀 아이콘들
const BookmarkIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2a2 2 0 012-2h4a2 2 0 012 2v12l-4-2.5L4 14V2z"/>
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

export function AnnouncementRow({
  post,
  onLike,
  onComment,
  onExpand,
  className,
}: AnnouncementRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.interactions.isLiked);
  const [likesCount, setLikesCount] = useState(post.interactions.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const typeColors = {
    announcement: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400",
    update: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    discussion: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
  };

  const typeLabels = {
    announcement: "공지",
    update: "업데이트",
    discussion: "토론",
  };

  return (
    <Card className={cn(post.isPinned && "ring-2 ring-primary-200 dark:ring-primary-800", className)}>
      <CardContent className="p-0">
        <div
          className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
          onClick={handleToggle}
        >
          {/* Pinned indicator */}
          {post.isPinned && (
            <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
              <BookmarkIcon />
              고정됨
            </div>
          )}

          <div className="flex items-start gap-3">
            <Avatar 
              src={post.author.avatar} 
              fallback={post.author.displayName} 
              size="md" 
            />
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

              {/* Type badge & Title */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", typeColors[post.type])}>
                  {typeLabels[post.type]}
                </span>
              </div>

              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {post.title}
              </h3>
              
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
                <span className="text-surface-400">
                  {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

