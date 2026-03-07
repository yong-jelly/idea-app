import { useState } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { UserAvatar } from "@/entities/user";
import { Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { AnnouncementPost } from "../../model/feed.types";
import {
  FeedRowWrapper,
  AuthorHeader,
  ContentArea,
  InteractionButtons,
  FeedSourceFooter,
} from "../FeedRowBase";
import { DEV_POST_TYPE_INFO } from "../../model/feed.types";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export interface AnnouncementRowProps {
  post: AnnouncementPost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 공지/업데이트 Row
 * 
 * 개발사에서 발행하는 공지사항이나 업데이트 안내를 표시합니다.
 * 제목이 강조되어 표시되며, 피드 목록에서 사용 가능합니다.
 */
export function AnnouncementRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: AnnouncementRowProps) {
  const typeInfo = DEV_POST_TYPE_INFO[post.type === "vote" ? "announcement" : post.type] || DEV_POST_TYPE_INFO.announcement;
  
  // 프로젝트/커뮤니티에서 온 포스트인지 확인
  const hasSource = post.source && post.source.type !== "direct" && post.source.type !== "following";
  const projectSource = hasSource && post.source && (post.source.type === "project" || post.source.type === "subscribed" || post.source.type === "community")
    ? {
        id: post.source.id!,
        name: post.source.name!,
        emoji: post.source.emoji,
        isBookmarked: post.source.isBookmarked,
      }
    : undefined;

  return (
    <FeedRowWrapper
      className={className}
      onClick={onClick}
      avatar={
        <UserAvatar 
          user={post.author} 
          size="md" 
          linkToProfile 
        />
      }
    >
      <AuthorHeader 
        author={post.author} 
        createdAt={post.createdAt} 
        showMoreButton={false}
        projectSource={projectSource}
      />
      
      {/* 타입 배지 */}
      <div className="mb-2 flex items-center gap-2">
        <Badge className={cn("text-xs", typeInfo.colorClass)}>
          {typeInfo.label}
        </Badge>
      </div>

      {/* 제목 강조 */}
      <h3 className={cn(
        "font-medium text-base text-surface-800 dark:text-surface-200 mb-2",
        "leading-tight"
      )}>
        {post.title}
      </h3>
      
      <ContentArea 
        content={post.content} 
        images={post.images}
        maxLength={300}
        collapseNewlines={false}
      />

      {post.linkPreviews && post.linkPreviews.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {post.linkPreviews.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 px-3 py-1.5 text-xs text-surface-500 transition-colors hover:border-primary-300 hover:text-primary-500 dark:border-surface-700 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:text-primary-400"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>{extractDomain(link.url)}</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>
      )}
      
      <InteractionButtons
        interactions={post.interactions}
        onLike={onLike}
        onComment={onComment}
        onBookmark={onBookmark}
        isAuthenticated={isAuthenticated}
        onSignUpPrompt={onSignUpPrompt}
      />

      {post.source && <FeedSourceFooter source={post.source} />}
    </FeedRowWrapper>
  );
}

