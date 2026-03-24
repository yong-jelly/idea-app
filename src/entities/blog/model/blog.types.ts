/**
 * @file blog.types.ts
 * @description 블로그 도메인 타입 정의. 목록/상세/API upsert 입력에 공통으로 사용한다.
 */

/** 게시 상태. 초안은 slug로 조회 시 작성자만 상세 노출(RPC/목업 정책). */
export type BlogPostStatus = "draft" | "published";

/**
 * 목록 카드·피드형 요약에 쓰는 게시글 스냅샷.
 * 본문(content_md)은 포함하지 않는다.
 */
export interface BlogPostListItem {
  /** 게시글 UUID */
  id: string;
  /** URL 경로 세그먼트. 고유해야 함 */
  slug: string;
  title: string;
  /** 원문 출처 링크(GeekNews 스타일). null이면 제목만 표시 */
  link_url: string | null;
  /** 목록 미리보기용 짧은 텍스트. null이면 UI에서 생략 가능 */
  excerpt: string | null;
  status: BlogPostStatus;
  /** 비정규화 댓글 수. 댓글 CRUD 시 동기화 */
  comments_count: number;
  /**
   * 조회수. RPC가 작성자 본인에게만 채움(그 외 null).
   * 비로그인·타인에게는 null.
   */
  view_count: number | null;
  created_at: string;
  /** 발행 시각. draft면 null */
  published_at: string | null;
  /** tbl_users.id. 목록에서 작성자 판별 등에 사용 */
  author_id: number;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
}

/**
 * `v1_upsert_blog_post` 및 목업 upsert에 넣는 입력.
 * - 신규: id 생략 또는 null
 * - 수정: 기존 게시글 id
 */
export interface UpsertBlogPostInput {
  /** 수정 시에만 전달. 신규 작성 시 null/undefined */
  id?: string | null;
  title: string;
  /** 외부 링크 URL. 있으면 목록에서 제목 옆에 표시 */
  link_url?: string | null;
  /** 비우면 서버/목업에서 제목 기반 slug 자동 생성 */
  slug?: string | null;
  /** 목록 미리보기용. null이면 excerpt 컬럼만 비움 */
  excerpt?: string | null;
  /** Markdown 원문 */
  content_md: string;
  status: "draft" | "published";
}

/**
 * 상세 페이지용 게시글 전체. author_id는 tbl_users.id(bigint)와 동일한 숫자 정책.
 */
export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  link_url: string | null;
  excerpt: string | null;
  content_md: string;
  status: BlogPostStatus;
  comments_count: number;
  /**
   * 조회수. RPC가 작성자 본인에게만 채움(그 외 null).
   */
  view_count: number | null;
  /** tbl_users.id 기준 bigint를 number로 둔 값 */
  author_id: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
}
