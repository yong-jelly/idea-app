import { Link } from "react-router";
import { Heart, MessageCircle, Repeat2, Bookmark, Share, MoreHorizontal, Milestone, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, Badge, Button } from "@/shared/ui";
import { cn, formatRelativeTime, formatNumber } from "@/shared/lib/utils";
import { UserAvatar } from "@/entities/user";
import type { Post } from "../model/post.types";

export interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({ post, onLike, onRepost, onBookmark, onComment, onShare }: PostCardProps) {
  const getPostTypeInfo = () => {
    switch (post.type) {
      case "milestone":
        return {
          icon: <Milestone className="h-3.5 w-3.5" />,
          label: "마일스톤 달성",
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        };
      case "project_update":
        return {
          icon: <Sparkles className="h-3.5 w-3.5" />,
          label: "프로젝트 업데이트",
          color: "text-primary-600 dark:text-primary-400",
          bgColor: "bg-primary-50 dark:bg-primary-950/30",
        };
      case "feature_accepted":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: "기능 제안 수락",
          color: "text-accent-blue dark:text-sky-400",
          bgColor: "bg-sky-50 dark:bg-sky-950/30",
        };
      default:
        return null;
    }
  };

  const typeInfo = getPostTypeInfo();

  return (
    <Card variant="bordered" className="p-4 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
      <div className="flex gap-3">
        <UserAvatar user={post.author} size="md" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0 text-sm">
              <Link
                to={`/profile/${post.author.username}`}
                className="font-semibold text-surface-900 dark:text-surface-50 hover:underline truncate"
              >
                {post.author.displayName}
              </Link>
              <span className="text-surface-400 dark:text-surface-500 truncate">
                @{post.author.username}
              </span>
              <span className="text-surface-300 dark:text-surface-600">·</span>
              <span className="text-surface-400 dark:text-surface-500 shrink-0">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Post Type Badge */}
          {typeInfo && (
            <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md mb-2", typeInfo.bgColor)}>
              <span className={typeInfo.color}>{typeInfo.icon}</span>
              <span className={cn("text-xs font-medium", typeInfo.color)}>{typeInfo.label}</span>
              {post.projectTitle && (
                <>
                  <span className="text-surface-300 dark:text-surface-600 mx-0.5">·</span>
                  <Link
                    to={`/project/${post.projectId}`}
                    className={cn("text-xs font-medium hover:underline", typeInfo.color)}
                  >
                    {post.projectTitle}
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Milestone/Feature Title */}
          {(post.milestoneTitle || post.featureTitle) && (
            <div className="mb-2">
              <Badge variant="outline">
                {post.milestoneTitle || post.featureTitle}
              </Badge>
            </div>
          )}

          {/* Content */}
          <div className="text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words mb-3 leading-relaxed">
            {post.content}
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-800">
              <img
                src={post.images[0]}
                alt="Post image"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between -ml-2 pt-1">
            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-sm">{formatNumber(post.commentsCount)}</span>
            </button>

            <button
              onClick={() => onRepost?.(post.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors",
                post.isReposted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              )}
            >
              <Repeat2 className="h-[18px] w-[18px]" />
              <span className="text-sm">{formatNumber(post.repostsCount)}</span>
            </button>

            <button
              onClick={() => onLike?.(post.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors",
                post.isLiked
                  ? "text-accent-rose"
                  : "text-surface-400 hover:text-accent-rose hover:bg-red-50 dark:hover:bg-red-950/30"
              )}
            >
              <Heart className={cn("h-[18px] w-[18px]", post.isLiked && "fill-current")} />
              <span className="text-sm">{formatNumber(post.likesCount)}</span>
            </button>

            <button
              onClick={() => onBookmark?.(post.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors",
                post.isBookmarked
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30"
              )}
            >
              <Bookmark className={cn("h-[18px] w-[18px]", post.isBookmarked && "fill-current")} />
            </button>

            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
            >
              <Share className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

