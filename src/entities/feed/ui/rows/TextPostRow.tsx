import { UserAvatar } from "@/entities/user";
import type { TextPost } from "../../model/feed.types";
import {
  FeedRowWrapper,
  AuthorHeader,
  FeedSourceFooter,
  ContentArea,
  InteractionButtons,
} from "../FeedRowBase";

export interface TextPostRowProps {
  post: TextPost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 일반 텍스트 포스트 Row
 * 
 * 사용자가 작성한 일반 텍스트 포스트를 표시합니다.
 * 이미지 첨부도 지원합니다.
 * 
 * 참여 중인 프로젝트/커뮤니티에서 온 글은 하단에 링크가 표시됩니다.
 */
export function TextPostRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: TextPostRowProps) {
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
      <AuthorHeader author={post.author} createdAt={post.createdAt} />
      
      <ContentArea content={post.content} images={post.images} />
      
      <InteractionButtons
        interactions={post.interactions}
        onLike={onLike}
        onComment={onComment}
        onBookmark={onBookmark}
        isAuthenticated={isAuthenticated}
        onSignUpPrompt={onSignUpPrompt}
      />

      {/* 참여 중인 프로젝트/커뮤니티일 때 하단 링크 표시 */}
      {post.source && <FeedSourceFooter source={post.source} />}
    </FeedRowWrapper>
  );
}
