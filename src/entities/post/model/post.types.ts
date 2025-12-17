import type { User } from "@/entities/user";
import type { FeedSourceInfo } from "@/entities/feed";

export type PostType = "text" | "project_update" | "milestone" | "feature_accepted";

export interface Post {
  id: string;
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  type: PostType;
  content: string;
  images?: string[];
  projectId?: string;
  projectTitle?: string;
  milestoneTitle?: string;
  featureTitle?: string;
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface FeedState {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  activeTab: "following" | "all" | "trending";
}

