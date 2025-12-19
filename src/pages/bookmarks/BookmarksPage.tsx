import { useState, useEffect, useRef, useCallback } from "react";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router";
import { LeftSidebar } from "@/widgets";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { fetchBookmarkedPostsFeed, togglePostLike, togglePostBookmark, type UnifiedFeedResponse } from "@/entities/post/api/post.api";
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
import { Skeleton } from "@/shared/ui";
import { convertToUnifiedFeedPost } from "@/widgets/feed-timeline";

function FeedSkeleton() {
  return (
    <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookmarksPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!showSignUpModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSignUpModal(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showSignUpModal]);

  // 초기 피드 로드
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    loadPosts();
  }, [isAuthenticated]);

  const loadPosts = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    const { data, error } = await fetchBookmarkedPostsFeed({ limit: 50, offset: 0 });
    
    if (error) {
      console.error("북마크 피드 로드 에러:", error);
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
    if (!isAuthenticated || isLoading || !hasMore) return;
    
    setIsLoading(true);
    const { data, error } = await fetchBookmarkedPostsFeed({ limit: 50, offset });
    
    if (error) {
      console.error("북마크 피드 추가 로드 에러:", error);
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
  }, [isIntersecting, hasMore, isLoading]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  const handlePostClick = (post: UnifiedFeedPost) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }

    // 낙관적 업데이트 (즉시 UI 업데이트)
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              interactions: {
                ...post.interactions,
                isLiked: !post.interactions.isLiked,
                likesCount: post.interactions.isLiked
                  ? post.interactions.likesCount - 1
                  : post.interactions.likesCount + 1,
              },
            }
          : post
      )
    );

    const { data, error } = await togglePostLike(postId);
    if (error) {
      // 에러 발생 시 롤백
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                interactions: {
                  ...post.interactions,
                  isLiked: !post.interactions.isLiked,
                  likesCount: post.interactions.isLiked
                    ? post.interactions.likesCount + 1
                    : post.interactions.likesCount - 1,
                },
              }
            : post
        )
      );
      console.error("좋아요 토글 에러:", error);
    } else if (data) {
      // 서버 응답으로 최종 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                interactions: {
                  ...post.interactions,
                  isLiked: data.is_liked,
                  likesCount: data.likes_count,
                },
              }
            : post
        )
      );
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }

    // 낙관적 업데이트
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              interactions: {
                ...post.interactions,
                isBookmarked: !post.interactions.isBookmarked,
                bookmarksCount: post.interactions.isBookmarked
                  ? post.interactions.bookmarksCount - 1
                  : post.interactions.bookmarksCount + 1,
              },
            }
          : post
      )
    );

    const { data, error } = await togglePostBookmark(postId);
    if (error) {
      // 에러 발생 시 롤백
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                interactions: {
                  ...post.interactions,
                  isBookmarked: !post.interactions.isBookmarked,
                  bookmarksCount: post.interactions.isBookmarked
                    ? post.interactions.bookmarksCount + 1
                    : post.interactions.bookmarksCount - 1,
                },
              }
            : post
        )
      );
      console.error("북마크 토글 에러:", error);
    } else if (data) {
      // 서버 응답으로 최종 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                interactions: {
                  ...post.interactions,
                  isBookmarked: data.is_bookmarked,
                  bookmarksCount: data.bookmarks_count,
                },
              }
            : post
        )
      );
    }
  };

  const renderPost = (post: UnifiedFeedPost) => {
    const commonProps = {
      post,
      onPostClick: () => handlePostClick(post),
      onLike: () => handleLike(post.id),
      onBookmark: () => handleBookmark(post.id),
      onComment: () => handlePostClick(post),
    };

    switch (post.type) {
      case "text":
        return <TextPostRow key={post.id} {...commonProps} />;
      case "project_update":
        return <ProjectUpdateRow key={post.id} {...commonProps} />;
      case "milestone":
        return <MilestoneAchievedRow key={post.id} {...commonProps} />;
      case "feature_accepted":
        return <FeatureAcceptedRow key={post.id} {...commonProps} />;
      case "project_created":
        return <ProjectCreatedRow key={post.id} {...commonProps} />;
      case "announcement":
      case "update":
      case "vote":
        return <AnnouncementRow key={post.id} {...commonProps} />;
      case "bug":
      case "feature":
      case "improvement":
      case "question":
        return (
          <FeedbackRow
            key={post.id}
            feedback={post as FeedbackPostExtended}
            onVote={() => handleLike(post.id)}
            onLike={() => handleLike(post.id)}
            onComment={() => handlePostClick(post)}
            onBookmark={() => handleBookmark(post.id)}
            onClick={() => handlePostClick(post)}
            isAuthenticated={isAuthenticated}
            onSignUpPrompt={() => setShowSignUpModal(true)}
          />
        );
      default:
        return <TextPostRow key={post.id} {...commonProps} />;
    }
  };

  // 비회원 처리
  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
          <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
            <div className="h-[53px] flex items-center px-4">
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                북마크
              </h1>
            </div>
          </div>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <Bookmark className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
              로그인이 필요합니다
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              북마크한 포스트를 보려면 로그인해주세요
            </p>
          </div>
        </main>
        <SignUpModal
          open={showSignUpModal}
          onOpenChange={setShowSignUpModal}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Header */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
          <div className="h-[53px] flex items-center px-4">
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              북마크
            </h1>
          </div>
        </div>

        {/* Feed */}
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <Bookmark className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
              북마크한 포스트가 없습니다
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              관심 있는 포스트를 북마크하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
              {posts.map(renderPost)}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 text-center">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600 dark:border-surface-600 dark:border-t-primary-400" />
                    <span className="text-sm">로딩 중...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}

