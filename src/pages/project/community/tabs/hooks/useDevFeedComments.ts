/**
 * DevFeed 포스트 댓글 관리 Hook
 * 
 * 포스트별 댓글을 관리하는 hook입니다.
 * useProjectComments를 참고하여 구현되었습니다.
 * 
 * 포스트 댓글은 v1_fetch_comments와 v1_create_comment를 사용하며,
 * source_type_code는 'project.community'를 사용합니다.
 */

import { useState, useEffect, useCallback } from "react";
import { CommentNode } from "@/shared/ui/comment";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { uploadCommentImages } from "@/shared/lib/storage";
import { toggleProjectCommentLike, updateProjectComment, deleteProjectComment } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { ensureMinDelay, type MinLoadingDelay } from "@/shared/lib/utils";

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

interface UseDevFeedCommentsOptions {
  postId: string;
  projectAuthorId: string;
  isAuthenticated: boolean;
  onSignUpPrompt: () => void;
  /** 최소 로딩 지연 시간 (기본값: { min: 800, max: 1500 }) */
  minLoadingDelay?: MinLoadingDelay | null;
}

/**
 * 포스트별 댓글 관리 Hook
 * 
 * @example
 * ```tsx
 * const {
 *   comments,
 *   isLoadingComments,
 *   isLoadingMoreComments,
 *   totalComments,
 *   hasMore,
 *   handleAddComment,
 *   handleReply,
 *   handleLikeComment,
 *   handleEditComment,
 *   handleDeleteComment,
 *   handleLoadMoreComments,
 *   handleRefreshComments,
 * } = useDevFeedComments({
 *   postId: post.id,
 *   projectAuthorId: project.author.id,
 *   isAuthenticated,
 *   onSignUpPrompt: () => setShowSignUpModal(true),
 * });
 * ```
 */
export function useDevFeedComments({
  postId,
  projectAuthorId,
  isAuthenticated,
  onSignUpPrompt,
  minLoadingDelay = { min: 800, max: 1500 },
}: UseDevFeedCommentsOptions) {
  const { user } = useUserStore();
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
          role: isProjectAuthor ? "Founder" : undefined,
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
  const loadComments = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!postId) return;

    const startTime = Date.now();

    if (!append) {
      setIsLoadingComments(true);
    } else {
      setIsLoadingMoreComments(true);
    }

    try {
      // 포스트 댓글 조회 (v1_fetch_comments 사용)
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_fetch_comments", {
          p_post_id: postId,
          p_limit: COMMENTS_PER_PAGE,
          p_offset: offset,
        });

      if (error) {
        console.error("댓글 조회 실패:", error);
        if (!append) {
          setIsLoadingComments(false);
        } else {
          setIsLoadingMoreComments(false);
        }
        return;
      }

      // JSONB 응답 파싱
      const result = data as any;
      if (!result || typeof result !== 'object') {
        if (!append) {
          setIsLoadingComments(false);
        } else {
          setIsLoadingMoreComments(false);
        }
        return;
      }

      const rawComments = result.comments || [];
      const pagination = result.pagination || {
        total_count: 0,
        deleted_total_count: 0,
        top_level_count: 0,
        size: COMMENTS_PER_PAGE,
        offset,
        has_more: false,
      };

      // 최소 지연 시간 보장
      if (minLoadingDelay && !append) {
        await ensureMinDelay(startTime, minLoadingDelay);
      }

      const normalized = normalizeComments(rawComments, projectAuthorId);

      if (append) {
        setComments((prev) => [...prev, ...normalized]);
      } else {
        setComments(normalized);
      }

      setCommentPagination({
        totalCount: pagination.total_count || 0,
        deletedTotalCount: pagination.deleted_total_count || 0,
        topLevelCount: pagination.top_level_count || 0,
        size: pagination.size || COMMENTS_PER_PAGE,
        offset: pagination.offset || offset,
        hasMore: pagination.has_more || false,
      });

      setCommentOffset(offset + rawComments.length);
    } catch (err) {
      console.error("댓글 조회 에러:", err);
    } finally {
      if (!append) {
        setIsLoadingComments(false);
      } else {
        setIsLoadingMoreComments(false);
      }
    }
  }, [postId, projectAuthorId, minLoadingDelay]);

  // data URL을 File로 변환하는 헬퍼 함수
  const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // 생성된 댓글을 CommentNode로 변환하는 헬퍼 함수
  const createCommentNodeFromCreated = (createdComment: any, parentId: string | null = null): CommentNode => {
    const isProjectAuthor = user && String(user.id) === projectAuthorId;
    
    return {
      id: createdComment.id,
      author: {
        id: user?.id || "",
        username: user?.username || "",
        displayName: user?.displayName || "",
        avatarUrl: user?.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined,
        role: isProjectAuthor ? "Founder" : undefined,
      },
      content: createdComment.content,
      parentId: parentId || undefined,
      depth: createdComment.depth || 0,
      likesCount: 0,
      isLiked: false,
      isDeleted: false,
      images: createdComment.images && Array.isArray(createdComment.images) && createdComment.images.length > 0 
        ? createdComment.images.map((path: string) => {
            // 이미 URL인 경우 그대로 반환
            if (path.startsWith("http://") || path.startsWith("https://")) {
              return path;
            }
            // Storage 경로인 경우 URL로 변환
            return getImageUrl(path);
          })
        : undefined,
      createdAt: createdComment.created_at,
      updatedAt: createdComment.updated_at || undefined,
      replies: [],
    };
  };

  // 댓글 트리에서 특정 ID의 댓글을 찾는 헬퍼 함수
  const findCommentById = (commentId: string, commentsList: CommentNode[]): CommentNode | null => {
    for (const comment of commentsList) {
      if (comment.id === commentId) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(commentId, comment.replies);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 댓글을 목록에 추가하는 헬퍼 함수
  const addCommentToTree = (newComment: CommentNode, commentsList: CommentNode[]): CommentNode[] => {
    if (!newComment.parentId) {
      // 원댓글인 경우: 최신순으로 정렬하여 맨 앞에 추가
      return [newComment, ...commentsList].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // 답글인 경우: 부모 댓글의 replies에 추가
      return commentsList.map(comment => {
        if (comment.id === newComment.parentId) {
          const updatedReplies = [...(comment.replies || []), newComment].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return { ...comment, replies: updatedReplies };
        } else if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: addCommentToTree(newComment, comment.replies) };
        }
        return comment;
      });
    }
  };

  const handleAddComment = async (content: string, images: string[]) => {
    if ((!content.trim() && images.length === 0) || !postId) return;

    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    try {
      // 이미지 업로드 (data URL을 File로 변환)
      let imagePaths: string[] = [];
      if (images.length > 0) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          alert("로그인이 필요합니다.");
          return;
        }

        // data URL을 File로 변환
        const imageFiles = images.map((dataURL, index) => 
          dataURLtoFile(dataURL, `comment-image-${Date.now()}-${index}.jpg`)
        );

        // 임시 댓글 ID 생성 (실제 댓글 생성 후 업데이트)
        const tempCommentId = `temp-${Date.now()}`;
        const { paths, error: uploadError } = await uploadCommentImages(
          imageFiles,
          authUser.id,
          tempCommentId
        );

        if (uploadError) {
          alert(`이미지 업로드 실패: ${uploadError.message}`);
          return;
        }

        imagePaths = paths;
      }

      // 댓글 생성
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_create_comment", {
          p_post_id: postId,
          p_content: content.trim(),
          p_parent_id: null,
          p_images: imagePaths.length > 0 ? imagePaths : [],
          p_source_type_code: "project.community",
        });

      if (error) {
        console.error("댓글 생성 실패:", error);
        alert(error.message || "댓글 작성에 실패했습니다");
        return;
      }

      if (!data || !user) {
        console.error("댓글 생성 응답 또는 사용자 정보 없음");
        return;
      }

      // 생성된 댓글을 CommentNode로 변환
      const newComment = createCommentNodeFromCreated(data, null);
      
      // 기존 목록에 추가 (전체 목록 다시 로드하지 않음)
      setComments((prev) => addCommentToTree(newComment, prev));
      
      // 페이지네이션 업데이트
      setCommentPagination((prev) => 
        prev ? {
          ...prev,
          totalCount: prev.totalCount + 1,
          topLevelCount: prev.topLevelCount + 1,
        } : null
      );
    } catch (err) {
      console.error("댓글 생성 에러:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  const handleReply = async (parentId: string, content: string, images: string[]) => {
    if ((!content.trim() && images.length === 0) || !postId) return;

    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    // 깊이 체크: 부모 댓글의 depth를 확인하여 최대 깊이를 초과하면 조기 리턴
    const parentComment = findCommentById(parentId, comments);
    if (parentComment) {
      const parentDepth = Number.isFinite(parentComment.depth) && parentComment.depth >= 0 
        ? parentComment.depth 
        : 0;
      
      // 최대 깊이를 초과하면 답글 작성 불가
      // maxDepth=2이면 depth 0,1에서만 답글 가능 (depth 1에서 답글 작성 시 depth 2가 됨)
      // depth 2에서는 답글 불가 (SQL 함수에서 depth >= 3일 때 에러 발생)
      if (parentDepth >= COMMENT_MAX_DEPTH) {
        alert("최대 댓글 깊이를 초과했습니다 (최대 3단계)");
        return;
      }
    }

    try {
      // 이미지 업로드 (data URL을 File로 변환)
      let imagePaths: string[] = [];
      if (images.length > 0) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          alert("로그인이 필요합니다.");
          return;
        }

        // data URL을 File로 변환
        const imageFiles = images.map((dataURL, index) => 
          dataURLtoFile(dataURL, `comment-image-${Date.now()}-${index}.jpg`)
        );

        // 임시 댓글 ID 생성
        const tempCommentId = `temp-${Date.now()}`;
        const { paths, error: uploadError } = await uploadCommentImages(
          imageFiles,
          authUser.id,
          tempCommentId
        );

        if (uploadError) {
          alert(`이미지 업로드 실패: ${uploadError.message}`);
          return;
        }

        imagePaths = paths;
      }

      // 답글 생성
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_create_comment", {
          p_post_id: postId,
          p_content: content.trim(),
          p_parent_id: parentId,
          p_images: imagePaths.length > 0 ? imagePaths : [],
          p_source_type_code: "project.community",
        });

      if (error) {
        console.error("답글 생성 실패:", error);
        alert(error.message || "답글 작성에 실패했습니다");
        return;
      }

      if (!data || !user) {
        console.error("답글 생성 응답 또는 사용자 정보 없음");
        return;
      }

      // 생성된 답글을 CommentNode로 변환
      const newReply = createCommentNodeFromCreated(data, parentId);
      
      // 기존 목록에 추가 (전체 목록 다시 로드하지 않음)
      setComments((prev) => addCommentToTree(newReply, prev));
      
      // 페이지네이션 업데이트 (답글은 topLevelCount에 포함되지 않음)
      setCommentPagination((prev) => 
        prev ? {
          ...prev,
          totalCount: prev.totalCount + 1,
        } : null
      );
    } catch (err) {
      console.error("답글 생성 에러:", err);
      alert("답글 작성 중 오류가 발생했습니다.");
    }
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
    if (!content.trim() && images.length === 0) return;

    try {
      // 이미지 업로드 (data URL을 File로 변환)
      let imagePaths: string[] | undefined = undefined;
      if (images.length > 0) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          alert("로그인이 필요합니다.");
          return;
        }

        // data URL을 File로 변환
        const imageFiles = images.map((dataURL, index) => 
          dataURLtoFile(dataURL, `comment-image-${Date.now()}-${index}.jpg`)
        );

        const { paths, error: uploadError } = await uploadCommentImages(
          imageFiles,
          authUser.id,
          commentId
        );

        if (uploadError) {
          alert(`이미지 업로드 실패: ${uploadError.message}`);
          return;
        }

        imagePaths = paths;
      }

      // 댓글 수정
      const { comment: updatedComment, error } = await updateProjectComment(commentId, content.trim(), imagePaths);

      if (error) {
        console.error("댓글 수정 실패:", error);
        alert(error.message);
        return;
      }

      if (!updatedComment) {
        return;
      }

      // 이미지 URL 변환
      const imageUrls = updatedComment.images && Array.isArray(updatedComment.images) && updatedComment.images.length > 0
        ? updatedComment.images.map((path: string) => {
            if (path.startsWith("http://") || path.startsWith("https://")) {
              return path;
            }
            return getImageUrl(path);
          })
        : undefined;

      // 해당 댓글만 업데이트 (전체 목록 다시 로드하지 않음)
      const updateComment = (items: CommentNode[]): CommentNode[] =>
        items.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              content: updatedComment.content,
              images: imageUrls,
              updatedAt: updatedComment.updated_at || new Date().toISOString(),
            };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: updateComment(item.replies) };
          }
          return item;
        });
      setComments((prev) => updateComment(prev));
    } catch (err) {
      console.error("댓글 수정 에러:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { success, error } = await deleteProjectComment(commentId);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      return;
    }

    if (success) {
      // 삭제할 댓글이 원댓글인지 확인
      let isTopLevel = false;
      const findComment = (items: CommentNode[]): CommentNode | null => {
        for (const item of items) {
          if (item.id === commentId) {
            return item;
          }
          if (item.replies && item.replies.length > 0) {
            const found = findComment(item.replies);
            if (found) return found;
          }
        }
        return null;
      };
      
      const commentToDelete = findComment(comments);
      isTopLevel = commentToDelete?.depth === 0;

      // 해당 댓글만 제거 (전체 목록 다시 로드하지 않음)
      const removeComment = (items: CommentNode[]): CommentNode[] => {
        return items
          .filter((item) => item.id !== commentId)
          .map((item) => {
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: removeComment(item.replies) };
            }
            return item;
          });
      };
      setComments((prev) => removeComment(prev));
      
      // 페이지네이션 업데이트
      setCommentPagination((prev) => 
        prev ? {
          ...prev,
          totalCount: Math.max(0, prev.totalCount - 1),
          topLevelCount: isTopLevel ? Math.max(0, prev.topLevelCount - 1) : prev.topLevelCount,
        } : null
      );
    }
  };

  const handleLoadMoreComments = async () => {
    if (!postId || isLoadingMoreComments || !commentPagination?.hasMore) return;
    await loadComments(commentOffset, true);
  };

  const handleRefreshComments = async () => {
    if (!postId) return;
    setCommentOffset(0);
    await loadComments(0, false);
  };

  // postId가 변경될 때 댓글 자동 로드
  useEffect(() => {
    if (postId && projectAuthorId) {
      setCommentOffset(0);
      loadComments(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, projectAuthorId]);

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
