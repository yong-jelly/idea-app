import { UserAvatar } from "@/entities/user";
import type { MilestoneAchievedPost } from "../../model/feed.types";
import {
  FeedRowWrapper,
  AuthorHeader,
  FeedSourceFooter,
  ContentArea,
  InteractionButtons,
  PostTypeBadge,
} from "../FeedRowBase";

export interface MilestoneAchievedRowProps {
  post: MilestoneAchievedPost;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

/**
 * 마일스톤 달성 Row
 * 
 * 프로젝트가 마일스톤을 달성했을 때 표시되는 포스트입니다.
 * 축하 분위기의 디자인과 마일스톤 제목을 함께 보여줍니다.
 */
export function MilestoneAchievedRow({
  post,
  onLike,
  onComment,
  onBookmark,
  onClick,
  className,
  isAuthenticated = true,
  onSignUpPrompt,
}: MilestoneAchievedRowProps) {
  // 미니멀 플래그 아이콘
  const FlagIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2v12h1V9h8l-2-3 2-3H4V2H3zm1 2h6.5l-1.5 2 1.5 2H4V4z"/>
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
        icon={<FlagIcon />}
        label="마일스톤"
        colorClass="text-emerald-600 dark:text-emerald-400"
        bgClass="bg-emerald-50 dark:bg-emerald-950/30"
        projectTitle={post.projectTitle}
        projectId={post.projectId}
        isBookmarked={post.source?.isBookmarked}
      />
      
      {/* 마일스톤 제목 */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
          </svg>
          {post.milestoneTitle}
        </span>
      </div>
      
      <ContentArea 
        content={post.content}
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
