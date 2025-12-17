import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { usePostStore } from "@/entities/post";
import { useUserStore } from "@/entities/user";
import { Skeleton } from "@/shared/ui";
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
} from "@/entities/feed";
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  ExtendedInteractions,
} from "@/entities/feed";

interface FeedTimelineProps {
  onSignUpPrompt?: () => void;
}

// Post 타입을 FeedPost 타입으로 변환하는 헬퍼
function convertToFeedPost(post: ReturnType<typeof usePostStore>["posts"][0]) {
  const interactions: ExtendedInteractions = {
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    bookmarksCount: post.bookmarksCount,
    isLiked: post.isLiked,
    isBookmarked: post.isBookmarked,
  };

  const base = {
    id: post.id,
    author: post.author,
    content: post.content,
    images: post.images,
    source: post.source,
    createdAt: post.createdAt,
    interactions,
  };

  switch (post.type) {
    case "text":
      return { ...base, type: "text" as const } satisfies TextPost;
    case "project_update":
      return {
        ...base,
        type: "project_update" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
      } satisfies ProjectUpdatePost;
    case "milestone":
      return {
        ...base,
        type: "milestone" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
        milestoneTitle: post.milestoneTitle!,
      } satisfies MilestoneAchievedPost;
    case "feature_accepted":
      return {
        ...base,
        type: "feature_accepted" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
        featureTitle: post.featureTitle!,
      } satisfies FeatureAcceptedPost;
  }
}

export function FeedTimeline({ onSignUpPrompt }: FeedTimelineProps = {}) {
  const navigate = useNavigate();
  const { posts, isLoading, hasMore, loadMore, toggleLike, toggleBookmark } = usePostStore();
  const { isAuthenticated } = useUserStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

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

  const handlePostClick = (post: ReturnType<typeof usePostStore>["posts"][0]) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  const renderPost = (post: ReturnType<typeof usePostStore>["posts"][0]) => {
    const feedPost = convertToFeedPost(post);
    const handlers = {
      onLike: () => toggleLike(post.id),
      onBookmark: () => toggleBookmark(post.id),
      onComment: () => navigate(`/${post.author.username}/status/${post.id}`),
      onClick: () => handlePostClick(post),
      isAuthenticated,
      onSignUpPrompt: onSignUpPrompt,
    };

    switch (feedPost.type) {
      case "text":
        return <TextPostRow key={post.id} post={feedPost} {...handlers} />;
      case "project_update":
        return <ProjectUpdateRow key={post.id} post={feedPost} {...handlers} />;
      case "milestone":
        return <MilestoneAchievedRow key={post.id} post={feedPost} {...handlers} />;
      case "feature_accepted":
        return <FeatureAcceptedRow key={post.id} post={feedPost} {...handlers} />;
    }
  };

  return (
    <div className="bg-white dark:bg-black">
      {posts.map(renderPost)}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-8 border-b border-surface-200 dark:border-surface-800">
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-sm text-surface-400 dark:text-surface-500">
            모든 포스트를 확인했습니다
          </p>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="bg-white dark:bg-black">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="px-4 py-3 border-b border-surface-200 dark:border-surface-800"
        >
          <div className="flex gap-3">
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton variant="text" className="h-4 w-16" />
              </div>
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-3/4" />
              <div className="flex gap-4 pt-2">
                <Skeleton variant="text" className="h-5 w-12" />
                <Skeleton variant="text" className="h-5 w-12" />
                <Skeleton variant="text" className="h-5 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
