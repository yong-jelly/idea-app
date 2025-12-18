import { useState, useEffect } from "react";
import { CommentNode } from "@/shared/ui/comment";
import { fetchProjectComments, createProjectComment, updateProjectComment, deleteProjectComment, toggleProjectCommentLike } from "@/entities/project";
import { getProfileImageUrl } from "@/shared/lib/storage";

// DB에서 반환된 댓글 데이터 타입
type RawCommentData = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: number;
  content: string;
  images: string[] | null;
  link_preview: any | null;
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

const COMMENTS_PER_PAGE = 30;
const COMMENT_MAX_DEPTH = 2;

interface CommentPagination {
  totalCount: number;
  deletedTotalCount: number;
  topLevelCount: number;
  size: number;
  offset: number;
  hasMore: boolean;
}

import { ensureMinDelay, type MinLoadingDelay } from "@/shared/lib/utils";

interface UseProjectCommentsOptions {
  projectId: string;
  projectAuthorId: string;
  isAuthenticated: boolean;
  onSignUpPrompt: () => void;
  /** 최소 로딩 지연 시간 (기본값: { min: 800, max: 1500 }) */
  minLoadingDelay?: MinLoadingDelay | null;
}

export function useProjectComments({
  projectId,
  projectAuthorId,
  isAuthenticated,
  onSignUpPrompt,
  minLoadingDelay = { min: 800, max: 1500 },
}: UseProjectCommentsOptions) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [commentOffset, setCommentOffset] = useState(0);
  const [commentPagination, setCommentPagination] = useState<CommentPagination | null>(null);

  // DB 댓글 데이터를 CommentNode로 변환
  const normalizeComments = (rawComments: RawCommentData[], projectAuthorId: string): CommentNode[] => {
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];
    const projectAuthorIdNum = Number(projectAuthorId);

    // 1단계: 모든 댓글을 CommentNode로 변환
    rawComments.forEach((raw) => {
      const isProjectAuthor = raw.author_id === projectAuthorIdNum;
      const comment: CommentNode = {
        id: raw.id,
        author: {
          id: String(raw.author_id),
          username: raw.author_username,
          displayName: raw.author_display_name,
          avatarUrl: raw.author_avatar_url ? getProfileImageUrl(raw.author_avatar_url, "sm") : undefined,
          role: isProjectAuthor ? "Maker" : undefined,
        },
        content: raw.content,
        parentId: raw.parent_id || undefined,
        depth: raw.depth,
        likesCount: raw.likes_count,
        isLiked: raw.is_liked,
        isDeleted: raw.is_deleted,
        images: raw.images && raw.images.length > 0 ? raw.images : undefined,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at || undefined,
        replies: [],
      };
      commentMap.set(raw.id, comment);
    });

    // 2단계: 트리 구조 구성
    commentMap.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    // 3단계: 정렬 (원댓글은 최신순, 답글은 오래된순)
    const sortComments = (items: CommentNode[]): CommentNode[] => {
      return items
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
    };

    return sortComments(rootComments);
  };

  // 댓글 로드 함수 (페이징 지원)
  const loadComments = async (offset: number = 0, append: boolean = false) => {
    if (!projectId) return;

    const startTime = Date.now();

    if (!append) {
      setIsLoadingComments(true);
    } else {
      setIsLoadingMoreComments(true);
    }

    const { comments: rawComments, pagination, error: commentsError } = await fetchProjectComments(projectId, {
      limit: COMMENTS_PER_PAGE,
      offset,
    });

    if (commentsError) {
      console.error("댓글 조회 실패:", commentsError);
      if (!append) {
        setIsLoadingComments(false);
      } else {
        setIsLoadingMoreComments(false);
      }
      return;
    }

    // 최소 지연 시간 보장
    await ensureMinDelay(startTime, minLoadingDelay);

    const normalized = normalizeComments(rawComments, projectAuthorId);

    if (append) {
      setComments((prev) => [...prev, ...normalized]);
    } else {
      setComments(normalized);
    }

    setCommentPagination(pagination);
    setCommentOffset(offset + rawComments.length);

    if (!append) {
      setIsLoadingComments(false);
    } else {
      setIsLoadingMoreComments(false);
    }
  };

  const handleAddComment = async (content: string, images: string[]) => {
    if (!content.trim() || !projectId) return;

    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    const { error } = await createProjectComment(projectId, content, undefined, images);

    if (error) {
      console.error("댓글 생성 실패:", error);
      alert(error.message);
      return;
    }

    setCommentOffset(0);
    await loadComments(0, false);
  };

  const handleReply = async (parentId: string, content: string, images: string[]) => {
    if (!content.trim() || !projectId) return;

    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    const { error } = await createProjectComment(projectId, content, parentId, images);

    if (error) {
      console.error("답글 생성 실패:", error);
      alert(error.message);
      return;
    }

    setCommentOffset(0);
    await loadComments(0, false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    const { isLiked, likesCount, error } = await toggleProjectCommentLike(commentId);

    if (error) {
      console.error("댓글 좋아요 토글 실패:", error);
      alert(error.message);
      return;
    }

    const updateLike = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked,
            likesCount,
          };
        }
        if (item.replies) {
          return { ...item, replies: updateLike(item.replies) };
        }
        return item;
      });
    setComments((prev) => updateLike(prev));
  };

  const handleEditComment = async (commentId: string, content: string, images: string[]) => {
    if (!content.trim()) return;

    const { error } = await updateProjectComment(commentId, content, images);

    if (error) {
      console.error("댓글 수정 실패:", error);
      alert(error.message);
      return;
    }

    if (projectId) {
      const { comments: rawComments, error: commentsError } = await fetchProjectComments(projectId);
      if (!commentsError && rawComments) {
        const normalized = normalizeComments(rawComments, projectAuthorId);
        setComments(normalized);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { success, error } = await deleteProjectComment(commentId);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      return;
    }

    if (success && projectId) {
      const { comments: rawComments, error: commentsError } = await fetchProjectComments(projectId);
      if (!commentsError && rawComments) {
        const normalized = normalizeComments(rawComments, projectAuthorId);
        setComments(normalized);
      }
    }
  };

  const handleLoadMoreComments = async () => {
    if (!projectId || isLoadingMoreComments || !commentPagination?.hasMore) return;
    await loadComments(commentOffset, true);
  };

  const handleRefreshComments = async () => {
    if (!projectId) return;
    setCommentOffset(0);
    await loadComments(0, false);
  };

  // projectId와 projectAuthorId가 변경되면 댓글 자동 로드
  useEffect(() => {
    if (projectId && projectAuthorId) {
      setCommentOffset(0);
      loadComments(0, false);
    }
  }, [projectId, projectAuthorId]);

  // 삭제된 댓글을 제외한 실제 댓글 개수
  const totalComments = commentPagination 
    ? Math.max(0, (commentPagination.totalCount ?? 0) - (commentPagination.deletedTotalCount ?? 0))
    : 0;

  return {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore: commentPagination?.hasMore ?? false,
    loadComments,
    handleAddComment,
    handleReply,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
    handleRefreshComments,
  };
}

