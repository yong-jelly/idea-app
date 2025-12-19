import { Link } from "react-router";
import { Badge, BotBadge } from "@/shared/ui";
import { cn, formatRelativeTime, formatNumber } from "@/shared/lib/utils";
import { isBot } from "@/entities/user";
import type { BaseAuthor, AuthorWithRole, ExtendedInteractions, BaseInteractions, FeedSourceInfo } from "../model/feed.types";

// ========== 공통 Props ==========

export interface FeedRowBaseProps {
  className?: string;
  children?: React.ReactNode;
}

// ========== 피드 출처 헤더 (프로젝트/커뮤니티 글일 때 상단에 표시) ==========

const ProjectIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 6h6M5 10h4" strokeLinecap="round" />
  </svg>
);

const CommunityIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="5" r="2.5" />
    <circle cx="4" cy="11" r="2" />
    <circle cx="12" cy="11" r="2" />
    <path d="M8 7.5v1M6 10l-1 .5M10 10l1 .5" strokeLinecap="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface FeedSourceHeaderProps {
  source: FeedSourceInfo;
  author: BaseAuthor;
  createdAt: string;
  showMoreButton?: boolean;
  onMoreClick?: () => void;
}

/**
 * 프로젝트/커뮤니티에서 온 피드의 상단 헤더
 * - 1줄: 프로젝트/커뮤니티 이름 + 아이콘
 * - 2줄: 작성자 · 시간
 */
export function FeedSourceHeader({ source, author, createdAt, showMoreButton = true, onMoreClick }: FeedSourceHeaderProps) {
  const isProject = source.type === "project" || source.type === "subscribed";
  const isCommunity = source.type === "community";
  
  const Icon = isCommunity ? CommunityIcon : ProjectIcon;
  const link = isCommunity 
    ? `/project/${source.id}/community` 
    : `/project/${source.id}`;

  return (
    <div className="flex items-start justify-between mb-2">
      <div className="min-w-0">
        {/* 1줄: 출처 이름 */}
        <Link 
          to={link}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {source.emoji ? (
            <span className="text-sm">{source.emoji}</span>
          ) : (
            <Icon />
          )}
          <span className="truncate">{source.name}</span>
          {isCommunity && <span className="text-surface-400 dark:text-surface-500 font-normal">커뮤니티</span>}
        </Link>
        
        {/* 2줄: 작성자 · 시간 */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to={`/profile/${author.username}`}
            className="font-semibold text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {author.displayName}
          </Link>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <time className="text-surface-400 dark:text-surface-500 shrink-0 tabular-nums">
            {formatRelativeTime(createdAt)}
          </time>
        </div>
      </div>
      
      {showMoreButton && (
        <button 
          onClick={(e) => { e.stopPropagation(); onMoreClick?.(); }}
          className="h-8 w-8 shrink-0 -mr-1 flex items-center justify-center rounded-full text-surface-400 opacity-0 group-hover/feed:opacity-100 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ========== 하단 커뮤니티/프로젝트 링크 (참여 중인 경우에만) ==========

export interface FeedSourceFooterProps {
  source: FeedSourceInfo;
}

/**
 * 내가 참여 중인 프로젝트/커뮤니티일 때 하단에 표시
 * 해당 공간으로 이동하는 링크 제공
 */
export function FeedSourceFooter({ source }: FeedSourceFooterProps) {
  if (!source.isJoined || source.type === "direct" || source.type === "following") {
    return null;
  }

  const isCommunity = source.type === "community";
  const link = isCommunity 
    ? `/project/${source.id}/community` 
    : `/project/${source.id}`;
  
  const label = isCommunity ? "참여 중인 커뮤니티" : "내 프로젝트";

  return (
    <div className="mt-2 pt-2 border-t border-surface-200 dark:border-surface-800">
      <Link
        to={link}
        className="flex items-center gap-2 text-[13px] text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors group"
        onClick={(e) => e.stopPropagation()}
      >
        {source.emoji ? (
          <span className="text-sm">{source.emoji}</span>
        ) : (
          isCommunity ? <CommunityIcon /> : <ProjectIcon />
        )}
        <span>{label}</span>
        <span className="text-surface-400 dark:text-surface-500">·</span>
        <span className="font-medium">{source.name}</span>
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

// ========== 작성자 헤더 (기본 피드용) ==========

export interface AuthorHeaderProps {
  author: BaseAuthor | AuthorWithRole;
  createdAt: string;
  showMoreButton?: boolean;
  badge?: React.ReactNode;
  onMoreClick?: () => void;
}

export function AuthorHeader({ author, createdAt, showMoreButton = true, badge, onMoreClick }: AuthorHeaderProps) {
  const role = "role" in author ? author.role : undefined;
  const isAuthorBot = isBot(author);

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 min-w-0 text-[14px]">
        <Link
          to={isAuthorBot ? "#" : `/profile/${author.username}`}
          className={cn(
            "font-semibold text-surface-900 dark:text-surface-50 truncate",
            isAuthorBot ? "cursor-default" : "hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          )}
          onClick={(e) => {
            if (isAuthorBot) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              e.stopPropagation();
            }
          }}
        >
          {author.displayName}
        </Link>
        {role && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium">
            {role}
          </Badge>
        )}
        {isAuthorBot && author.botRole && (
          <BotBadge role={author.botRole} size="sm" />
        )}
        <span className="text-surface-400 dark:text-surface-500 truncate font-normal">
          @{author.username}
        </span>
        <span className="text-surface-300 dark:text-surface-600">·</span>
        <time className="text-surface-400 dark:text-surface-500 shrink-0 tabular-nums">
          {formatRelativeTime(createdAt)}
        </time>
        {badge}
      </div>
      {showMoreButton && (
        <button 
          onClick={(e) => { e.stopPropagation(); onMoreClick?.(); }}
          className="h-8 w-8 shrink-0 -mr-1 flex items-center justify-center rounded-full text-surface-400 opacity-0 group-hover/feed:opacity-100 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ========== 미니멀 아이콘 컴포넌트들 ==========

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 10h.01M10 10h.01M14 10h.01M5 16l-1.5 2.5V16H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ========== 인터랙션 버튼들 ==========

export interface InteractionButtonsProps {
  interactions: ExtendedInteractions;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
  isAuthenticated?: boolean;
  onSignUpPrompt?: () => void;
}

export function InteractionButtons({
  interactions,
  onLike,
  onComment,
  onBookmark,
  isAuthenticated = true,
  onSignUpPrompt,
}: InteractionButtonsProps) {
  const handleInteraction = (e: React.MouseEvent, handler?: () => void, requiresAuth = false) => {
    e.stopPropagation();
    if (requiresAuth && !isAuthenticated && onSignUpPrompt) {
      onSignUpPrompt();
      return;
    }
    handler?.();
  };

  return (
    <div className="flex items-center gap-1 -ml-2 mt-3">
      {/* 댓글 */}
      <button
        onClick={(e) => handleInteraction(e, onComment)}
        className="group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-surface-500 hover:text-primary-600 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 dark:hover:text-primary-400 transition-all duration-200"
      >
        <CommentIcon className="h-[18px] w-[18px] group-hover/btn:scale-110 transition-transform duration-200" />
        <span className="text-[13px] font-medium tabular-nums min-w-[1.25rem]">{formatNumber(interactions.commentsCount)}</span>
      </button>

      {/* 좋아요 */}
      <button
        onClick={(e) => handleInteraction(e, onLike, true)}
        className={cn(
          "group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200",
          interactions.isLiked
            ? "text-rose-500"
            : "text-surface-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
        )}
      >
        <HeartIcon className={cn(
          "h-[18px] w-[18px] transition-all duration-200",
          interactions.isLiked ? "scale-110 drop-shadow-sm" : "group-hover/btn:scale-110"
        )} filled={interactions.isLiked} />
        <span className="text-[13px] font-medium tabular-nums min-w-[1.25rem]">{formatNumber(interactions.likesCount)}</span>
      </button>

      {/* 북마크 */}
      <button
        onClick={(e) => handleInteraction(e, onBookmark, true)}
        className={cn(
          "group/btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 ml-auto",
          interactions.isBookmarked
            ? "text-primary-600 dark:text-primary-400"
            : "text-surface-500 hover:text-primary-600 hover:bg-primary-50/60 dark:hover:bg-primary-950/30 dark:hover:text-primary-400"
        )}
      >
        <BookmarkIcon className={cn(
          "h-[18px] w-[18px] transition-all duration-200",
          interactions.isBookmarked ? "scale-110 drop-shadow-sm" : "group-hover/btn:scale-110"
        )} filled={interactions.isBookmarked} />
      </button>
    </div>
  );
}

// ========== 간단한 인터랙션 버튼 ==========

export interface SimpleInteractionProps {
  interactions: BaseInteractions;
  onLike?: () => void;
  onComment?: () => void;
}

export function SimpleInteractionButtons({ interactions, onLike, onComment }: SimpleInteractionProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={(e) => { e.stopPropagation(); onLike?.(); }}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          interactions.isLiked ? "text-rose-500" : "text-surface-500 hover:text-rose-500"
        )}
      >
        <HeartIcon className="h-4 w-4" filled={interactions.isLiked} />
        <span className="tabular-nums">{formatNumber(interactions.likesCount)}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onComment?.(); }}
        className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
      >
        <CommentIcon className="h-4 w-4" />
        <span className="tabular-nums">{formatNumber(interactions.commentsCount)}</span>
      </button>
    </div>
  );
}

// ========== 포스트 타입 배지 ==========

export interface PostTypeBadgeProps {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  bgClass: string;
  projectTitle?: string;
  projectId?: string;
}

export function PostTypeBadge({ icon, label, colorClass, bgClass, projectTitle, projectId }: PostTypeBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 text-xs font-medium", bgClass, colorClass)}>
      {icon}
      <span>{label}</span>
      {projectTitle && projectId && (
        <>
          <span className="opacity-50 mx-0.5">·</span>
          <Link
            to={`/project/${projectId}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {projectTitle}
          </Link>
        </>
      )}
    </div>
  );
}

// ========== 컨텐츠 영역 ==========

export interface ContentAreaProps {
  content: string;
  images?: string[];
  className?: string;
}

export function ContentArea({ content, images, className }: ContentAreaProps) {
  return (
    <>
      {content && (
        <div className={cn(
          "text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words",
          "leading-relaxed text-[15px] tracking-[-0.01em]",
          className
        )}>
          {content}
        </div>
      )}
      {images && images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-hidden">
          {/* 첫 번째 이미지 - 강조 */}
          <div className="relative flex-shrink-0 overflow-hidden rounded-xl border border-surface-200/80 dark:border-surface-700/60 bg-surface-100 dark:bg-surface-800 shadow-sm">
            <img
              src={images[0]}
              alt="Image 1"
              className="h-52 w-52 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* 나머지 이미지들 - 작은 썸네일 + 갯수 표시 */}
          {images.length > 1 && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {/* 두 번째 이미지 썸네일 */}
              <div className="relative overflow-hidden rounded-xl border border-surface-200/80 dark:border-surface-700/60 bg-surface-100 dark:bg-surface-800 shadow-sm">
                <img
                  src={images[1]}
                  alt="Image 2"
                  className="h-[100px] w-[100px] object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* 세 번째 이미지가 있거나 더 많은 경우 */}
              {images.length > 2 && (
                <div className="relative overflow-hidden rounded-xl border border-surface-200/80 dark:border-surface-700/60 bg-surface-100 dark:bg-surface-800 shadow-sm">
                  {images.length === 3 ? (
                    <img
                      src={images[2]}
                      alt="Image 3"
                      className="h-[100px] w-[100px] object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-[100px] w-[100px] flex items-center justify-center bg-surface-900/60 dark:bg-black/50 backdrop-blur-sm">
                      <span className="text-white text-base font-semibold">+{images.length - 2}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ========== 기본 피드 Row 래퍼 ==========

export interface FeedRowWrapperProps extends FeedRowBaseProps {
  avatar?: React.ReactNode;
  onClick?: () => void;
}

export function FeedRowWrapper({ className, children, avatar, onClick }: FeedRowWrapperProps) {
  return (
    <article 
      className={cn(
        "group/feed px-5 py-5 bg-white dark:bg-surface-950",
        "border-b border-surface-100 dark:border-surface-800/60",
        "hover:bg-gradient-to-r hover:from-surface-50/80 hover:to-transparent dark:hover:from-surface-900/40 dark:hover:to-transparent",
        "transition-all duration-300 ease-out cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="shrink-0 transition-transform duration-200 group-hover/feed:scale-[1.02]">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </article>
  );
}
