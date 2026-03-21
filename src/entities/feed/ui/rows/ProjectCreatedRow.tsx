import { Link } from "react-router";
import { UserAvatar } from "@/entities/user";
import type { ProjectCreatedPost } from "../../model/feed.types";
import { LinkText } from "@/shared/ui";
import {
  FeedRowWrapper,
  AuthorHeader,
  FeedSourceFooter,
  ContentArea,
  InteractionButtons,
} from "../FeedRowBase";
import { cn } from "@/shared/lib/utils";

export interface ProjectCreatedRowProps {
  post: ProjectCreatedPost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 프로젝트 생성 피드 Row
 * 
 * 새로운 프로젝트가 생성되었을 때 Bot이 자동으로 생성하는 피드입니다.
 * 프로젝트 썸네일, 제목, 설명을 표시합니다.
 */
export function ProjectCreatedRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: ProjectCreatedRowProps) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <FeedRowWrapper
      className={className}
      onClick={handleClick}
      avatar={
        <UserAvatar 
          user={post.author} 
          size="md" 
          linkToProfile={false}  // Bot은 프로필 링크 비활성화
        />
      }
    >
      <AuthorHeader author={post.author} createdAt={post.createdAt} showMoreButton={false} />
      
      {/* 프로젝트 카드 */}
      <Link
        to={`/project/${post.projectId}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "block mb-3 rounded-xl border border-surface-200 dark:border-surface-700",
          "hover:border-primary-300 dark:hover:border-primary-700",
          "transition-colors overflow-hidden"
        )}
      >
        <div className="flex gap-3 p-3">
          {/* 프로젝트 썸네일 */}
          {post.projectThumbnail && (
            <div className="shrink-0">
              <img
                src={post.projectThumbnail}
                alt={post.projectTitle}
                className="h-16 w-16 rounded-lg object-cover"
              />
            </div>
          )}
          
          {/* 프로젝트 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚀</span>
              <h3 className={cn(
                "font-semibold text-lg text-surface-900 dark:text-surface-50",
                "line-clamp-1"
              )}>
                {post.projectTitle}
              </h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
              <LinkText stopPropagationOnLinkClick>{post.content}</LinkText>
            </p>
            <div className="mt-2 text-xs text-surface-500 dark:text-surface-500">
              프로젝트 보기 →
            </div>
          </div>
        </div>
      </Link>
      
      {/* 이미지가 있는 경우 표시 */}
      {post.images && post.images.length > 0 && (
        <ContentArea content="" images={post.images} />
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

