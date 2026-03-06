import { create } from "zustand";
import type { UnifiedFeedPost } from "@/entities/feed";

interface FeedTimelineStore {
  posts: UnifiedFeedPost[];
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
  hasLoaded: boolean;
  setInitialFeed: (posts: UnifiedFeedPost[], hasMore: boolean, offset: number) => void;
  appendPosts: (posts: UnifiedFeedPost[], hasMore: boolean, offsetDelta: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  updatePost: (postId: string, updater: (post: UnifiedFeedPost) => UnifiedFeedPost) => void;
  reset: () => void;
}

const initialState = {
  posts: [] as UnifiedFeedPost[],
  isLoading: false,
  hasMore: true,
  offset: 0,
  hasLoaded: false,
};

export const useFeedTimelineStore = create<FeedTimelineStore>((set) => ({
  ...initialState,

  setInitialFeed: (posts, hasMore, offset) =>
    set({
      posts,
      hasMore,
      offset,
      hasLoaded: true,
      isLoading: false,
    }),

  appendPosts: (posts, hasMore, offsetDelta) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
      hasMore,
      offset: state.offset + offsetDelta,
      hasLoaded: true,
      isLoading: false,
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  updatePost: (postId, updater) =>
    set((state) => ({
      posts: state.posts.map((post) => (post.id === postId ? updater(post) : post)),
    })),

  reset: () => set(initialState),
}));
