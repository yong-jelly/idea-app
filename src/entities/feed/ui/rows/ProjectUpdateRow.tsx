import { UserAvatar } from "@/entities/user";
import type { ProjectUpdatePost } from "../../model/feed.types";
import {
  FeedRowWrapper,
  AuthorHeader,
  FeedSourceFooter,
  ContentArea,
  InteractionButtons,
  PostTypeBadge,
} from "../FeedRowBase";

export interface ProjectUpdateRowProps {
  post: ProjectUpdatePost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 프로젝트 업데이트 Row
 * 
 * 프로젝트의 새로운 업데이트(릴리즈, 변경사항 등)를 알리는 포스트입니다.
 * 프로젝트 링크와 함께 표시됩니다.
 */
export function ProjectUpdateRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: ProjectUpdateRowProps) {
  // 미니멀 아이콘
  const UpdateIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1a5 5 0 110 10A5 5 0 018 3zm-.5 2v3.5l2.5 1.5.5-.87-2-1.19V5H7.5z"/>
    </svg>
  );

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
      <AuthorHeader author={post.author} createdAt={post.createdAt} showMoreButton={false} />
      
      <PostTypeBadge
        icon={<UpdateIcon />}
        label="업데이트"
        colorClass="text-primary-600 dark:text-primary-400"
        bgClass="bg-primary-50 dark:bg-primary-950/30"
        projectTitle={post.projectTitle}
        projectId={post.projectId}
        isBookmarked={post.source?.isBookmarked}
      />
      
      <ContentArea 
        content={post.content} 
        images={post.images}
        maxLength={300}
        collapseNewlines={true}
      />
      
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
