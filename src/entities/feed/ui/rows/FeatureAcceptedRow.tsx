import { UserAvatar } from "@/entities/user";
import type { FeatureAcceptedPost } from "../../model/feed.types";
import {
  FeedRowWrapper,
  AuthorHeader,
  FeedSourceFooter,
  ContentArea,
  InteractionButtons,
  PostTypeBadge,
} from "../FeedRowBase";

export interface FeatureAcceptedRowProps {
  post: FeatureAcceptedPost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 기능 제안 수락 Row
 * 
 * 커뮤니티에서 요청한 기능이 수락되었을 때 표시되는 포스트입니다.
 * 어떤 기능이 수락되었는지 명확하게 보여줍니다.
 */
export function FeatureAcceptedRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: FeatureAcceptedRowProps) {
  // 미니멀 체크 아이콘
  const CheckIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"/>
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
        icon={<CheckIcon />}
        label="기능 수락"
        colorClass="text-sky-600 dark:text-sky-400"
        bgClass="bg-sky-50 dark:bg-sky-950/30"
        projectTitle={post.projectTitle}
        projectId={post.projectId}
        isBookmarked={post.source?.isBookmarked}
      />
      
      {/* 수락된 기능 제목 */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 text-sm font-medium">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a1 1 0 011 1v4.5h4.5a1 1 0 110 2H9V12a1 1 0 11-2 0V7.5H2.5a1 1 0 010-2H7V1a1 1 0 011-1z"/>
          </svg>
          {post.featureTitle}
        </span>
      </div>
      
      <ContentArea 
        content={post.content}
        maxLength={300}
        collapseNewlines={false}
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
