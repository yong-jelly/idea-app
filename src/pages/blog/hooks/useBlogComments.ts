/**
 * @file useBlogComments.ts
 * @description 블로그 상세 댓글 상태. 피드 `usePostComments`와 유사하며 이미지 첨부는 없다. `fetchBlogComments` 등 엔티티 API 사용.
 */
import { useState, useEffect } from "react";
import type { CommentNode } from "@/shared/ui/comment";
import {
  fetchBlogComments,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
  toggleBlogCommentLike,
} from "@/entities/blog/api/blog.api";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { ensureMinDelay, type MinLoadingDelay } from "@/shared/lib/utils";

const COMMENTS_PER_PAGE = 30;
const COMMENT_MAX_DEPTH = 2;

type RawCommentData = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: number;
  content: string;
  images: string[] | null;
  depth: number;
  likes_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
  is_liked: boolean;
};

interface CommentPagination {
  totalCount: number;
  deletedTotalCount: number;
  topLevelCount: number;
  size: number;
  offset: number;
  hasMore: boolean;
}

interface UseBlogCommentsOptions {
  blogPostId: string;
  isAuthenticated: boolean;
  onSignUpPrompt: () => void;
  minLoadingDelay?: MinLoadingDelay | null;
}

interface UserLite {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export function useBlogComments(
  user: UserLite | null,
  options?: UseBlogCommentsOptions
) {
  const blogPostId = options?.blogPostId || "";
  const isAuthenticated = options?.isAuthenticated ?? true;
  const onSignUpPrompt = options?.onSignUpPrompt || (() => {});
  const minLoadingDelay = options?.minLoadingDelay ?? { min: 800, max: 1500 };

  /** 루트·답글 트리(최대 깊이 `COMMENT_MAX_DEPTH` 정책과 맞춤) */
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  /** `handleLoadMoreComments`에서 다음 `fetchBlogComments`에 넘길 offset */
  const [commentOffset, setCommentOffset] = useState(0);
  const [commentPagination, setCommentPagination] = useState<CommentPagination | null>(null);

  const normalizeComments = (rawComments: RawCommentData[]): CommentNode[] => {
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    rawComments.forEach((raw) => {
      const comment: CommentNode = {
        id: raw.id,
        author: {
          id: String(raw.author_id),
          username: raw.author_username,
          displayName: raw.author_display_name,
          avatarUrl: raw.author_avatar_url ? getProfileImageUrl(raw.author_avatar_url, "sm") : undefined,
        },
        content: raw.content,
        parentId: raw.parent_id || undefined,
        depth: raw.depth,
        likesCount: raw.likes_count,
        isLiked: raw.is_liked,
        isDeleted: raw.is_deleted,
        images:
          raw.images && raw.images.length > 0
            ? raw.images.map((path: string) =>
                path.startsWith("http://") || path.startsWith("https://") ? path : getImageUrl(path)
              )
            : undefined,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at || undefined,
        replies: [],
      };
      commentMap.set(raw.id, comment);
    });

    commentMap.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        if (!parent.replies) parent.replies = [];
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    const sortComments = (items: CommentNode[]): CommentNode[] =>
      items
        .sort((a, b) => {
          if (a.depth === 0 && b.depth === 0) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
        .map((item) => ({
          ...item,
          replies: item.replies ? sortComments(item.replies) : [],
        }));

    return sortComments(rootComments);
  };

  /** `append`: 더보기 시 기존 트리에 누적 */
  const loadComments = async (offset: number = 0, append: boolean = false) => {
    if (!blogPostId) return;

    const startTime = Date.now();
    if (!append) setIsLoadingComments(true);
    else setIsLoadingMoreComments(true);

    try {
      const { comments: rawComments, pagination, error: commentsError } = await fetchBlogComments(
        blogPostId,
        { limit: COMMENTS_PER_PAGE, offset }
      );

      if (commentsError) {
        if (!append) setIsLoadingComments(false);
        else setIsLoadingMoreComments(false);
        return;
      }

      if (minLoadingDelay && !append) {
        await ensureMinDelay(startTime, minLoadingDelay);
      }

      const normalized = normalizeComments(rawComments as RawCommentData[]);

      if (append) setComments((prev) => [...prev, ...normalized]);
      else setComments(normalized);

      setCommentPagination(pagination);
      setCommentOffset(offset + rawComments.length);
    } catch (err) {
      console.error("블로그 댓글 조회 에러:", err);
    } finally {
      if (!append) setIsLoadingComments(false);
      else setIsLoadingMoreComments(false);
    }
  };

  useEffect(() => {
    if (blogPostId) loadComments(0, false);
  }, [blogPostId]);

  const findCommentById = (commentId: string, commentsList: CommentNode[]): CommentNode | null => {
    for (const comment of commentsList) {
      if (comment.id === commentId) return comment;
      if (comment.replies?.length) {
        const found = findCommentById(commentId, comment.replies);
        if (found) return found;
      }
    }
    return null;
  };

  const addCommentToTree = (newComment: CommentNode, commentsList: CommentNode[]): CommentNode[] => {
    if (!newComment.parentId) {
      return [newComment, ...commentsList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return commentsList.map((comment) => {
      if (comment.id === newComment.parentId) {
        const updatedReplies = [...(comment.replies || []), newComment].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return { ...comment, replies: updatedReplies };
      }
      if (comment.replies?.length) {
        return { ...comment, replies: addCommentToTree(newComment, comment.replies) };
      }
      return comment;
    });
  };

  const createCommentNodeFromCreated = (createdComment: any, parentId: string | null = null): CommentNode => ({
    id: createdComment.id,
    author: {
      id: user?.id || "",
      username: user?.username || "",
      displayName: user?.displayName || "",
      avatarUrl: user?.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined,
    },
    content: createdComment.content,
    parentId: parentId || undefined,
    depth: createdComment.depth ?? 0,
    likesCount: 0,
    isLiked: false,
    isDeleted: false,
    createdAt: createdComment.created_at,
    updatedAt: createdComment.updated_at || undefined,
    replies: [],
  });

  const handleAddComment = async (content: string, _images: string[]) => {
    if (!content.trim() || !blogPostId) return;
    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }
    try {
      const { comment, error } = await createBlogComment(blogPostId, content.trim());
      if (error || !comment || !user) {
        if (error) alert(error.message || "댓글 작성에 실패했습니다");
        return;
      }
      const newComment = createCommentNodeFromCreated(comment, null);
      setComments((prev) => addCommentToTree(newComment, prev));
      setCommentPagination((prev) =>
        prev
          ? { ...prev, totalCount: prev.totalCount + 1, topLevelCount: prev.topLevelCount + 1 }
          : null
      );
    } catch (e) {
      console.error(e);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  const handleReply = async (parentId: string, content: string, _images: string[]) => {
    if (!content.trim() || !blogPostId) return;
    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }
    const parentComment = findCommentById(parentId, comments);
    if (parentComment && parentComment.depth >= COMMENT_MAX_DEPTH) {
      alert("최대 댓글 깊이를 초과했습니다 (최대 3단계)");
      return;
    }
    try {
      const { comment, error } = await createBlogComment(blogPostId, content.trim(), parentId);
      if (error || !comment || !user) {
        if (error) alert(error.message || "답글 작성에 실패했습니다");
        return;
      }
      const newReply = createCommentNodeFromCreated(comment, parentId);
      setComments((prev) => addCommentToTree(newReply, prev));
      setCommentPagination((prev) => (prev ? { ...prev, totalCount: prev.totalCount + 1 } : null));
    } catch (e) {
      console.error(e);
      alert("답글 작성 중 오류가 발생했습니다.");
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }
    const updateLike = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        if (item.replies) return { ...item, replies: updateLike(item.replies) };
        return item;
      });
    setComments((prev) => updateLike(prev));
    try {
      const { data, error } = await toggleBlogCommentLike(commentId);
      if (error || !data) {
        setComments((prev) => updateLike(prev));
        return;
      }
      const updateFromResponse = (items: CommentNode[]): CommentNode[] =>
        items.map((item) => {
          if (item.id === commentId) {
            return { ...item, isLiked: data.is_liked, likesCount: data.likes_count };
          }
          if (item.replies) return { ...item, replies: updateFromResponse(item.replies) };
          return item;
        });
      setComments((prev) => updateFromResponse(prev));
    } catch {
      setComments((prev) => updateLike(prev));
    }
  };

  const handleEditComment = async (commentId: string, content: string, _images: string[]) => {
    if (!content.trim() || !isAuthenticated) return;
    try {
      const { comment, error } = await updateBlogComment(commentId, content.trim());
      if (error || !comment) {
        if (error) alert(error.message || "댓글 수정에 실패했습니다");
        return;
      }
      const update = (items: CommentNode[]): CommentNode[] =>
        items.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              content: (comment as any).content,
              updatedAt: (comment as any).updated_at || new Date().toISOString(),
            };
          }
          if (item.replies) return { ...item, replies: update(item.replies) };
          return item;
        });
      setComments((prev) => update(prev));
    } catch {
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) return;
    const markDelete = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) return { ...item, isDeleted: true };
        if (item.replies) return { ...item, replies: markDelete(item.replies) };
        return item;
      });
    setComments((prev) => markDelete(prev));
    try {
      const { success, error } = await deleteBlogComment(commentId);
      if (error || !success) {
        await loadComments(0, false);
        alert(error?.message || "댓글 삭제에 실패했습니다");
        return;
      }
      setCommentPagination((prev) =>
        prev ? { ...prev, totalCount: Math.max(0, prev.totalCount - 1) } : null
      );
    } catch {
      await loadComments(0, false);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLoadMoreComments = () => {
    if (!isLoadingMoreComments && commentPagination?.hasMore) {
      loadComments(commentOffset, true);
    }
  };

  const handleRefreshComments = () => {
    setCommentOffset(0);
    loadComments(0, false);
  };

  return {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments: commentPagination?.totalCount || 0,
    hasMore: commentPagination?.hasMore || false,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
    handleRefreshComments,
  };
}
