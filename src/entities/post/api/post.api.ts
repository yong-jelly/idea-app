import { supabase } from "@/shared/lib/supabase";
import type { UnifiedFeedPost } from "@/entities/feed";

export interface FetchUnifiedFeedOptions {
  limit?: number;
  offset?: number;
}

export interface UnifiedFeedResponse {
  id: string;
  author_id: number;
  type: string;
  content: string;
  images: string[] | null;
  link_preview: any;
  project_id: string | null;
  milestone_title: string | null;
  feature_title: string | null;
  source_type: string;
  source_id: string | null;
  source_name: string | null;
  source_emoji: string | null;
  project_thumbnail: string | null;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_user_type: "user" | "bot";
  is_liked: boolean;
  is_bookmarked: boolean;
  title: string | null;
  post_type: string | null;
  feedback_type: string | null;
  feedback_status: string | null;
  feedback_votes_count: number | null;
  is_feedback_voted: boolean | null;
  vote_options: any;
  voted_option_id: string | null;
}

/**
 * 통합 피드 조회
 * 
 * 메인 피드의 홈 영역에 표시할 모든 피드를 조회합니다.
 * 커뮤니티 공지, 피드백, 프로젝트 생성 정보, 프로젝트 타임라인 포스트를 포함합니다.
 */
export async function fetchUnifiedFeed(
  options: FetchUnifiedFeedOptions = {}
): Promise<{ data: UnifiedFeedPost[] | null; error: Error | null }> {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_unified_feed", {
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("통합 피드 조회 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환은 FeedTimeline에서 수행
    return { data: data as any, error: null };
  } catch (err) {
    console.error("통합 피드 조회 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

export interface TogglePostLikeResult {
  is_liked: boolean;
  likes_count: number;
}

export interface TogglePostBookmarkResult {
  is_bookmarked: boolean;
  bookmarks_count: number;
}

/**
 * 포스트 좋아요 토글
 */
export async function togglePostLike(
  postId: string
): Promise<{ data: TogglePostLikeResult | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_post_like", {
        p_post_id: postId,
      });

    if (error) {
      console.error("좋아요 토글 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as TogglePostLikeResult, error: null };
  } catch (err) {
    console.error("좋아요 토글 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

/**
 * 포스트 북마크 토글
 */
export async function togglePostBookmark(
  postId: string
): Promise<{ data: TogglePostBookmarkResult | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_post_bookmark", {
        p_post_id: postId,
      });

    if (error) {
      console.error("북마크 토글 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as TogglePostBookmarkResult, error: null };
  } catch (err) {
    console.error("북마크 토글 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

/**
 * 포스트 상세 조회
 * 
 * 포스트 ID로 포스트 상세 정보를 조회합니다.
 * 통합 피드와 동일한 구조로 반환합니다.
 */
export async function fetchPostDetail(
  postId: string
): Promise<{ data: UnifiedFeedResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_post_detail", {
        p_post_id: postId,
      });

    if (error) {
      console.error("포스트 상세 조회 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
      return { data: null, error: new Error("포스트를 찾을 수 없습니다") };
    }

    return { data: data[0] as UnifiedFeedResponse, error: null };
  } catch (err) {
    console.error("포스트 상세 조회 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

/**
 * 북마크한 포스트 피드 조회
 * 
 * 사용자가 북마크한 포스트의 피드를 조회합니다.
 * 일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 포함합니다.
 */
export async function fetchBookmarkedPostsFeed(
  options: FetchUnifiedFeedOptions = {}
): Promise<{ data: UnifiedFeedPost[] | null; error: Error | null }> {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_bookmarked_posts_feed", {
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("북마크한 포스트 피드 조회 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환은 FeedTimeline에서 수행
    return { data: data as any, error: null };
  } catch (err) {
    console.error("북마크한 포스트 피드 조회 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

/**
 * 사용자가 작성한 포스트 피드 조회
 * 
 * 특정 사용자가 작성한 포스트의 피드를 조회합니다.
 * 일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 포함합니다.
 */
export async function fetchUserPostsFeed(
  username: string,
  options: FetchUnifiedFeedOptions = {}
): Promise<{ data: UnifiedFeedPost[] | null; error: Error | null }> {
  try {
    if (!username) {
      return { data: null, error: new Error("username이 필요합니다") };
    }

    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_user_posts_feed", {
        p_username: username,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("사용자 포스트 피드 조회 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환은 FeedTimeline에서 수행
    return { data: data as any, error: null };
  } catch (err) {
    console.error("사용자 포스트 피드 조회 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

/**
 * 사용자가 좋아요한 포스트 피드 조회
 * 
 * 특정 사용자가 좋아요한 포스트의 피드를 조회합니다.
 * 일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 포함합니다.
 */
export async function fetchUserLikedPostsFeed(
  username: string,
  options: FetchUnifiedFeedOptions = {}
): Promise<{ data: UnifiedFeedPost[] | null; error: Error | null }> {
  try {
    if (!username) {
      return { data: null, error: new Error("username이 필요합니다") };
    }

    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_user_liked_posts_feed", {
        p_username: username,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("사용자 좋아요 포스트 피드 조회 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환은 FeedTimeline에서 수행
    return { data: data as any, error: null };
  } catch (err) {
    console.error("사용자 좋아요 포스트 피드 조회 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

// ========== 댓글 관련 타입 및 함수 ==========

export interface FetchPostCommentsOptions {
  limit?: number;
  offset?: number;
}

export interface FetchPostCommentsResult {
  comments: any[];
  pagination: {
    totalCount: number;
    deletedTotalCount: number;
    topLevelCount: number;
    size: number;
    offset: number;
    hasMore: boolean;
  };
  meta: {
    postId: string;
    limit: number;
    offset: number;
    serverTime: string;
  };
  error: Error | null;
}

/**
 * 포스트 댓글 조회
 */
export async function fetchPostComments(
  postId: string,
  options: FetchPostCommentsOptions = {}
): Promise<FetchPostCommentsResult> {
  try {
    if (!postId) {
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          deletedTotalCount: 0,
          topLevelCount: 0,
          size: 0,
          offset: 0,
          hasMore: false,
        },
        meta: {
          postId,
          limit: 0,
          offset: 0,
          serverTime: new Date().toISOString(),
        },
        error: new Error("포스트 ID가 필요합니다"),
      };
    }

    const limit = options.limit ?? 30;
    const offset = options.offset ?? 0;

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_comments", {
        p_post_id: postId,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("포스트 댓글 조회 에러:", error);
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          deletedTotalCount: 0,
          topLevelCount: 0,
          size: limit,
          offset,
          hasMore: false,
        },
        meta: {
          postId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: new Error(error.message || "댓글을 불러오는데 실패했습니다"),
      };
    }

    // JSONB 응답 파싱
    const result = data as any;
    if (!result || typeof result !== 'object') {
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          deletedTotalCount: 0,
          topLevelCount: 0,
          size: limit,
          offset,
          hasMore: false,
        },
        meta: {
          postId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: new Error("잘못된 응답 형식입니다"),
      };
    }

    const comments = result.comments || [];
    const pagination = result.pagination || {
      total_count: 0,
      deleted_total_count: 0,
      top_level_count: 0,
      size: limit,
      offset,
      has_more: false,
    };
    const meta = result.meta || {
      post_id: postId,
      limit,
      offset,
      server_time: new Date().toISOString(),
    };

    return {
      comments,
      pagination: {
        totalCount: pagination.total_count || 0,
        deletedTotalCount: pagination.deleted_total_count || 0,
        topLevelCount: pagination.top_level_count || 0,
        size: pagination.size || limit,
        offset: pagination.offset || offset,
        hasMore: pagination.has_more || false,
      },
      meta: {
        postId: meta.post_id || postId,
        limit: meta.limit || limit,
        offset: meta.offset || offset,
        serverTime: meta.server_time || new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
    console.error("포스트 댓글 조회 에러:", err);
    return {
      comments: [],
      pagination: {
        totalCount: 0,
        deletedTotalCount: 0,
        topLevelCount: 0,
        size: options.limit ?? 30,
        offset: options.offset ?? 0,
        hasMore: false,
      },
      meta: {
        postId,
        limit: options.limit ?? 30,
        offset: options.offset ?? 0,
        serverTime: new Date().toISOString(),
      },
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

export interface CreatePostCommentResult {
  comment: any | null;
  error: Error | null;
}

/**
 * 포스트 댓글 생성
 */
export async function createPostComment(
  postId: string,
  content: string,
  parentId?: string,
  images?: string[]
): Promise<CreatePostCommentResult> {
  try {
    if (!postId || !content.trim()) {
      return {
        comment: null,
        error: new Error("포스트 ID와 댓글 내용이 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_create_comment", {
        p_post_id: postId,
        p_content: content.trim(),
        p_parent_id: parentId || null,
        p_images: images ? (images as any) : [],
        p_source_type_code: null, // 자동 추론
      });

    if (error) {
      console.error("포스트 댓글 생성 에러:", error);
      return {
        comment: null,
        error: new Error(error.message || "댓글 작성에 실패했습니다"),
      };
    }

    return {
      comment: data,
      error: null,
    };
  } catch (err) {
    console.error("포스트 댓글 생성 에러:", err);
    return {
      comment: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

export interface UpdatePostCommentResult {
  comment: any | null;
  error: Error | null;
}

/**
 * 포스트 댓글 수정
 */
export async function updatePostComment(
  commentId: string,
  content: string,
  images?: string[]
): Promise<UpdatePostCommentResult> {
  try {
    if (!commentId || !content.trim()) {
      return {
        comment: null,
        error: new Error("댓글 ID와 내용이 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_update_comment", {
        p_comment_id: commentId,
        p_content: content.trim(),
        p_images: images ? (images as any) : null,
      });

    if (error) {
      console.error("포스트 댓글 수정 에러:", error);
      return {
        comment: null,
        error: new Error(error.message || "댓글 수정에 실패했습니다"),
      };
    }

    return {
      comment: data,
      error: null,
    };
  } catch (err) {
    console.error("포스트 댓글 수정 에러:", err);
    return {
      comment: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

export interface DeletePostCommentResult {
  success: boolean;
  error: Error | null;
}

/**
 * 포스트 댓글 삭제
 */
export async function deletePostComment(
  commentId: string
): Promise<DeletePostCommentResult> {
  try {
    if (!commentId) {
      return {
        success: false,
        error: new Error("댓글 ID가 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_delete_comment", {
        p_comment_id: commentId,
      });

    if (error) {
      console.error("포스트 댓글 삭제 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "댓글 삭제에 실패했습니다"),
      };
    }

    return {
      success: data === true,
      error: null,
    };
  } catch (err) {
    console.error("포스트 댓글 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

export interface TogglePostCommentLikeResult {
  is_liked: boolean;
  likes_count: number;
}

/**
 * 포스트 댓글 좋아요 토글
 */
export async function togglePostCommentLike(
  commentId: string
): Promise<{ data: TogglePostCommentLikeResult | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_comment_like", {
        p_comment_id: commentId,
      });

    if (error) {
      console.error("댓글 좋아요 토글 에러:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as TogglePostCommentLikeResult, error: null };
  } catch (err) {
    console.error("댓글 좋아요 토글 예외:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

