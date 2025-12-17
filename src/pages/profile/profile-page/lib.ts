/**
 * ProfilePage 유틸리티 함수
 */
import type { Post } from "@/entities/post";
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  ExtendedInteractions,
} from "@/entities/feed";

/**
 * Post 타입을 FeedPost 타입으로 변환
 */
export function convertToFeedPost(post: Post) {
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
