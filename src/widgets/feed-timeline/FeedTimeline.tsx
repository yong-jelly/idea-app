import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/entities/user";
import { Skeleton } from "@/shared/ui";
import { fetchUnifiedFeed, togglePostLike, togglePostBookmark, type UnifiedFeedResponse } from "@/entities/post/api/post.api";
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
  ProjectCreatedRow,
  AnnouncementRow,
  FeedbackRow,
} from "@/entities/feed";
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  ProjectCreatedPost,
  AnnouncementPost,
  FeedbackPostExtended,
  UnifiedFeedPost,
  ExtendedInteractions,
  FeedSourceInfo,
} from "@/entities/feed";
import type { BaseAuthor } from "@/entities/feed";

interface FeedTimelineProps {
  onSignUpPrompt?: () => void;
}

// API 응답을 UnifiedFeedPost로 변환하는 헬퍼
export function convertToUnifiedFeedPost(response: UnifiedFeedResponse): UnifiedFeedPost {
  const author: BaseAuthor = {
    id: response.author_id.toString(),
    username: response.author_username,
    displayName: response.author_display_name,
    avatar: response.author_avatar_url || undefined,
    userType: response.author_user_type,
  };

  const interactions: ExtendedInteractions = {
    likesCount: response.likes_count,
    commentsCount: response.comments_count,
    bookmarksCount: response.bookmarks_count,
    isLiked: response.is_liked,
    isBookmarked: response.is_bookmarked,
  };

  const source: FeedSourceInfo | undefined = response.source_type && response.source_type !== "direct"
    ? {
        type: response.source_type as any,
        id: response.source_id || undefined,
        name: response.source_name || undefined,
        emoji: response.source_emoji || undefined,
        thumbnail: response.project_thumbnail || undefined,
      }
    : undefined;

  const base = {
    id: response.id,
    author,
    content: response.content,
    images: response.images || undefined,
    source,
    createdAt: response.created_at,
    interactions,
  };

  // 프로젝트 생성 피드
  if (response.type === "project_created" && response.project_id) {
    return {
      ...base,
      type: "project_created" as const,
      projectId: response.project_id,
      projectTitle: response.source_name || "",
      projectThumbnail: response.images?.[0] || undefined,
    } satisfies ProjectCreatedPost;
  }

  // 공지 피드
  if (response.title && response.post_type) {
    return {
      ...base,
      type: response.post_type as "announcement" | "update" | "vote",
      title: response.title,
      projectId: response.project_id || undefined,
      projectTitle: response.source_name || undefined,
      isPinned: response.is_pinned,
      voteOptions: response.vote_options || undefined,
      votedOptionId: response.voted_option_id || undefined,
      totalVotes: response.vote_options ? 
        (response.vote_options as any[]).reduce((sum, opt) => sum + (opt.votesCount || 0), 0) : 
        undefined,
    } satisfies AnnouncementPost;
  }

  // 피드백 피드
  if (response.title && response.feedback_type) {
    return {
      ...base,
      type: response.feedback_type as any,
      title: response.title,
      status: response.feedback_status as any,
      votesCount: response.feedback_votes_count || 0,
      isVoted: response.is_feedback_voted || false,
      commentsCount: response.comments_count,
      projectId: response.project_id || undefined,
      projectTitle: response.source_name || undefined,
    } satisfies FeedbackPostExtended;
  }

  // 일반 피드
  switch (response.type) {
    case "text":
      return { ...base, type: "text" as const } satisfies TextPost;
    case "project_update":
      return {
        ...base,
        type: "project_update" as const,
        projectId: response.project_id!,
        projectTitle: response.source_name!,
      } satisfies ProjectUpdatePost;
    case "milestone":
      return {
        ...base,
        type: "milestone" as const,
        projectId: response.project_id!,
        projectTitle: response.source_name!,
        milestoneTitle: response.milestone_title!,
      } satisfies MilestoneAchievedPost;
    case "feature_accepted":
      return {
        ...base,
        type: "feature_accepted" as const,
        projectId: response.project_id!,
        projectTitle: response.source_name!,
        featureTitle: response.feature_title!,
      } satisfies FeatureAcceptedPost;
    default:
      return { ...base, type: "text" as const } satisfies TextPost;
  }
}

export function FeedTimeline({ onSignUpPrompt }: FeedTimelineProps = {}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // 초기 피드 로드
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const { data, error } = await fetchUnifiedFeed({ limit: 50, offset: 0 });
    
    if (error) {
      console.error("피드 로드 에러:", error);
      setIsLoading(false);
      return;
    }

    if (data) {
      const convertedPosts = data.map(convertToUnifiedFeedPost);
      setPosts(convertedPosts);
      setOffset(50);
      setHasMore(data.length === 50);
    }
    
    setIsLoading(false);
  };

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    const { data, error } = await fetchUnifiedFeed({ limit: 50, offset });
    
    if (error) {
      console.error("피드 추가 로드 에러:", error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const convertedPosts = data.map(convertToUnifiedFeedPost);
      setPosts((prev) => [...prev, ...convertedPosts]);
      setOffset((prev) => prev + data.length);
      setHasMore(data.length === 50);
    } else {
      setHasMore(false);
    }
    
    setIsLoading(false);
  };

  // 간단한 IntersectionObserver 구현
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  if (posts.length === 0 && isLoading) {
    return <FeedSkeleton />;
  }

  const handlePostClick = (post: UnifiedFeedPost) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      onSignUpPrompt?.();
      return;
    }

    // 낙관적 업데이트 (즉시 UI 업데이트)
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsLiked = post.interactions.isLiked;
    const previousLikesCount = post.interactions.likesCount;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              interactions: {
                ...p.interactions,
                isLiked: !previousIsLiked,
                likesCount: previousIsLiked
                  ? previousLikesCount - 1
                  : previousLikesCount + 1,
              },
            }
          : p
      )
    );

    try {
      const { data, error } = await togglePostLike(postId);

      if (error) {
        console.error("좋아요 토글 실패:", error);
        // 에러 발생 시 이전 상태로 롤백
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isLiked: previousIsLiked,
                    likesCount: previousLikesCount,
                  },
                }
              : p
          )
        );
        return;
      }

      // API 응답으로 상태 업데이트
      if (data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isLiked: data.is_liked,
                    likesCount: data.likes_count,
                  },
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("좋아요 토글 예외:", err);
      // 에러 발생 시 이전 상태로 롤백
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                interactions: {
                  ...p.interactions,
                  isLiked: previousIsLiked,
                  likesCount: previousLikesCount,
                },
              }
            : p
        )
      );
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!isAuthenticated) {
      onSignUpPrompt?.();
      return;
    }

    // 낙관적 업데이트 (즉시 UI 업데이트)
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsBookmarked = post.interactions.isBookmarked;
    const previousBookmarksCount = post.interactions.bookmarksCount;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              interactions: {
                ...p.interactions,
                isBookmarked: !previousIsBookmarked,
                bookmarksCount: previousIsBookmarked
                  ? previousBookmarksCount - 1
                  : previousBookmarksCount + 1,
              },
            }
          : p
      )
    );

    try {
      const { data, error } = await togglePostBookmark(postId);

      if (error) {
        console.error("북마크 토글 실패:", error);
        // 에러 발생 시 이전 상태로 롤백
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isBookmarked: previousIsBookmarked,
                    bookmarksCount: previousBookmarksCount,
                  },
                }
              : p
          )
        );
        return;
      }

      // API 응답으로 상태 업데이트
      if (data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isBookmarked: data.is_bookmarked,
                    bookmarksCount: data.bookmarks_count,
                  },
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("북마크 토글 예외:", err);
      // 에러 발생 시 이전 상태로 롤백
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                interactions: {
                  ...p.interactions,
                  isBookmarked: previousIsBookmarked,
                  bookmarksCount: previousBookmarksCount,
                },
              }
            : p
        )
      );
    }
  };

  const renderPost = (post: UnifiedFeedPost) => {
    const handlers = {
      onLike: () => handleLike(post.id),
      onBookmark: () => handleBookmark(post.id),
      onComment: () => navigate(`/${post.author.username}/status/${post.id}`),
      onClick: () => handlePostClick(post),
      isAuthenticated,
      onSignUpPrompt: onSignUpPrompt,
    };

    switch (post.type) {
      case "text":
        return <TextPostRow key={post.id} post={post} {...handlers} />;
      case "project_update":
        return <ProjectUpdateRow key={post.id} post={post} {...handlers} />;
      case "milestone":
        return <MilestoneAchievedRow key={post.id} post={post} {...handlers} />;
      case "feature_accepted":
        return <FeatureAcceptedRow key={post.id} post={post} {...handlers} />;
      case "project_created":
        return <ProjectCreatedRow key={post.id} post={post} {...handlers} />;
      case "announcement":
      case "update":
      case "vote":
        return <AnnouncementRow key={post.id} post={post} {...handlers} />;
      case "bug":
      case "feature":
      case "improvement":
      case "question":
        return <FeedbackRow key={post.id} feedback={post} {...handlers} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-surface-950">
      {posts.map(renderPost)}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-12">
        {isLoading && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100/80 dark:bg-surface-800/50">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="text-sm text-surface-500 dark:text-surface-400">로딩 중...</span>
            </div>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent" />
            <p className="text-sm text-surface-400 dark:text-surface-500">
              모든 포스트를 확인했습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-white dark:bg-surface-950">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="px-5 py-5 border-b border-surface-100 dark:border-surface-800/60"
          style={{ 
            animationDelay: `${i * 100}ms`,
            animation: 'fadeIn 0.4s ease-out forwards',
            opacity: 0 
          }}
        >
          <div className="flex gap-4">
            <Skeleton variant="circular" className="h-11 w-11 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="h-4 w-32 rounded-md" />
                <Skeleton variant="text" className="h-4 w-24 rounded-md" />
                <Skeleton variant="text" className="h-3 w-12 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" className="h-4 w-full rounded-md" />
                <Skeleton variant="text" className="h-4 w-[85%] rounded-md" />
                <Skeleton variant="text" className="h-4 w-[60%] rounded-md" />
              </div>
              <div className="flex gap-4 pt-2">
                <Skeleton variant="text" className="h-6 w-14 rounded-full" />
                <Skeleton variant="text" className="h-6 w-14 rounded-full" />
                <div className="flex-1" />
                <Skeleton variant="text" className="h-6 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
