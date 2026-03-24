/**
 * @file blog.api.ts
 * @description 블로그 게시글·댓글 API. Supabase `odd` 스키마 RPC를 호출한다.
 */
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";
import type { BlogPostDetail, BlogPostListItem, UpsertBlogPostInput } from "../model/blog.types";

/**
 * RPC가 `jsonb`를 반환할 때 클라이언트가 문자열로 주는 경우를 흡수한다.
 */
function parseRpcJsonb<T extends Record<string, unknown>>(data: unknown): T | null {
  if (data == null) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  if (typeof data === "object") {
    return data as T;
  }
  return null;
}

/**
 * PostgREST 오류를 블로그 도메인 안내로 치환한다.
 * 원격에 `070`/`071` 미적용 시 흔히 `PGRST202`(함수 없음)·`42P01`(릴레이션 없음)이 난다.
 */
function blogPostgrestErrorToError(error: PostgrestError | null): Error {
  const code = error?.code ?? "";
  const msg = error?.message ?? "";
  if (
    code === "PGRST202" ||
    code === "42P01" ||
    msg.includes("Could not find the function") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  ) {
    return new Error(
      "블로그용 DB가 아직 적용되지 않았습니다. Supabase에서 docs/sql/070_create_blog_tables.sql, 071_v1_blog_functions.sql(기존 DB는 072 후 071)을 순서대로 실행한 뒤 다시 시도해 주세요.",
    );
  }
  return new Error(msg || "요청에 실패했습니다");
}

/** 발행 글 목록(페이지네이션). `v1_list_blog_posts` */
export async function listBlogPosts(options: { limit?: number; offset?: number } = {}) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_list_blog_posts", {
      p_limit: limit,
      p_offset: offset,
    });
    if (error) {
      return { data: null, error: blogPostgrestErrorToError(error) };
    }
    const raw = parseRpcJsonb<{ posts?: BlogPostListItem[]; meta?: unknown }>(data);
    return {
      data: {
        posts: (raw?.posts ?? []) as BlogPostListItem[],
        meta: raw?.meta,
      },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("블로그 목록을 불러오지 못했습니다"),
    };
  }
}

/** slug로 단일 글(초안·발행). `v1_fetch_blog_post_by_slug` */
export async function fetchBlogPostBySlug(slug: string) {
  try {
    if (!slug) {
      return { data: null, error: new Error("slug이 필요합니다") };
    }
    const { data, error } = await supabase.schema("odd").rpc("v1_fetch_blog_post_by_slug", {
      p_slug: slug,
    });
    if (error) {
      return { data: null, error: blogPostgrestErrorToError(error) };
    }
    const parsed = parseRpcJsonb<Record<string, unknown>>(data);
    if (!parsed || Object.keys(parsed).length === 0) {
      return { data: null, error: null };
    }
    return { data: parsed as unknown as BlogPostDetail, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("글을 불러오지 못했습니다"),
    };
  }
}

/**
 * 게시글 생성·수정. `v1_upsert_blog_post`.
 */
export async function upsertBlogPost(input: UpsertBlogPostInput) {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_upsert_blog_post", {
      p_id: input.id ?? null,
      p_title: input.title,
      p_slug: input.slug ?? null,
      p_excerpt: input.excerpt ?? null,
      p_content_md: input.content_md,
      p_status: input.status,
      p_link_url: input.link_url ?? null,
    });
    if (error) {
      return { data: null, error: blogPostgrestErrorToError(error) };
    }
    return { data: data as Record<string, unknown>, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("저장에 실패했습니다"),
    };
  }
}

/** 글 삭제. `v1_delete_blog_post` */
export async function deleteBlogPost(postId: string) {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_delete_blog_post", {
      p_id: postId,
    });
    if (error) {
      return { success: false, error: blogPostgrestErrorToError(error) };
    }
    return { success: data === true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e : new Error("삭제에 실패했습니다"),
    };
  }
}

/** `fetchBlogComments` 정규화 결과(페이지 컴포넌트·훅에서 사용) */
export interface FetchBlogCommentsResult {
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

/** 댓글 트리 로드. `v1_fetch_blog_comments` */
export async function fetchBlogComments(
  blogPostId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<FetchBlogCommentsResult> {
  const limit = options.limit ?? 30;
  const offset = options.offset ?? 0;
  try {
    if (!blogPostId) {
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
          postId: blogPostId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: new Error("글 ID가 필요합니다"),
      };
    }

    const { data, error } = await supabase.schema("odd").rpc("v1_fetch_blog_comments", {
      p_blog_post_id: blogPostId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
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
          postId: blogPostId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: blogPostgrestErrorToError(error),
      };
    }

    const result =
      parseRpcJsonb<Record<string, unknown>>(data) ?? (data && typeof data === "object" ? (data as Record<string, unknown>) : null);
    const comments = (result?.comments as unknown[]) || [];
    const pagination = (result?.pagination ?? {}) as {
      total_count?: number;
      deleted_total_count?: number;
      top_level_count?: number;
      size?: number;
      offset?: number;
      has_more?: boolean;
    };
    const meta = (result?.meta ?? {}) as {
      post_id?: string;
      limit?: number;
      offset?: number;
      server_time?: string;
    };

    return {
      comments,
      pagination: {
        totalCount: pagination.total_count ?? 0,
        deletedTotalCount: pagination.deleted_total_count ?? 0,
        topLevelCount: pagination.top_level_count ?? 0,
        size: pagination.size ?? limit,
        offset: pagination.offset ?? offset,
        hasMore: pagination.has_more ?? false,
      },
      meta: {
        postId: meta.post_id ?? blogPostId,
        limit: meta.limit ?? limit,
        offset: meta.offset ?? offset,
        serverTime: meta.server_time ?? new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
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
        postId: blogPostId,
        limit: options.limit ?? 30,
        offset: options.offset ?? 0,
        serverTime: new Date().toISOString(),
      },
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/** 댓글·답글 작성. `v1_create_blog_comment` */
export async function createBlogComment(
  blogPostId: string,
  content: string,
  parentId?: string
): Promise<{ comment: any | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_create_blog_comment", {
      p_blog_post_id: blogPostId,
      p_content: content.trim(),
      p_parent_id: parentId || null,
      p_images: [],
    });
    if (error) {
      return { comment: null, error: blogPostgrestErrorToError(error) };
    }
    return { comment: data, error: null };
  } catch (e) {
    return {
      comment: null,
      error: e instanceof Error ? e : new Error("댓글 작성 실패"),
    };
  }
}

/** 댓글 본문 수정. `v1_update_blog_comment` */
export async function updateBlogComment(commentId: string, content: string) {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_update_blog_comment", {
      p_comment_id: commentId,
      p_content: content.trim(),
      p_images: null,
    });
    if (error) {
      return { comment: null, error: blogPostgrestErrorToError(error) };
    }
    return { comment: data, error: null };
  } catch (e) {
    return {
      comment: null,
      error: e instanceof Error ? e : new Error("댓글 수정 실패"),
    };
  }
}

/** 댓글 소프트 삭제. `v1_delete_blog_comment` */
export async function deleteBlogComment(commentId: string) {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_delete_blog_comment", {
      p_comment_id: commentId,
    });
    if (error) {
      return { success: false, error: blogPostgrestErrorToError(error) };
    }
    return { success: data === true, error: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e : new Error("댓글 삭제 실패"),
    };
  }
}

/** 댓글 좋아요 토글. `v1_toggle_blog_comment_like` */
export async function toggleBlogCommentLike(commentId: string) {
  try {
    const { data, error } = await supabase.schema("odd").rpc("v1_toggle_blog_comment_like", {
      p_comment_id: commentId,
    });
    if (error) {
      return { data: null, error: blogPostgrestErrorToError(error) };
    }
    const d = data as { is_liked?: boolean; likes_count?: number };
    return {
      data: {
        is_liked: !!d?.is_liked,
        likes_count: d?.likes_count ?? 0,
      },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error("좋아요 처리 실패"),
    };
  }
}
