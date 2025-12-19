/**
 * 포스트 댓글 관리 Hook
 * 
 * 포스트별 댓글을 관리하는 hook입니다.
 * 실제 API를 사용하여 댓글을 조회, 생성, 수정, 삭제합니다.
 */

import { useState, useEffect } from "react";
import { CommentNode } from "@/shared/ui/comment";
import { 
  fetchPostComments, 
  createPostComment, 
  updatePostComment, 
  deletePostComment,
  togglePostCommentLike
} from "@/entities/post/api/post.api";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { uploadCommentImages } from "@/shared/lib/storage";
import { supabase } from "@/shared/lib/supabase";
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

interface UsePostCommentsOptions {
  postId: string;
  isAuthenticated: boolean;
  onSignUpPrompt: () => void;
  /** 최소 로딩 지연 시간 (기본값: { min: 800, max: 1500 }) */
  minLoadingDelay?: MinLoadingDelay | null;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

/**
 * 포스트 댓글 관리 훅
 * - 댓글 CRUD 작업
 * - 좋아요 토글
 * - 댓글 수 계산
 */
export function usePostComments(
  user: User | null,
  options?: UsePostCommentsOptions
): {
  comments: CommentNode[];
  isLoadingComments: boolean;
  isLoadingMoreComments: boolean;
  totalComments: number;
  hasMore: boolean;
  handleAddComment: (content: string, images: string[]) => void;
  handleReply: (parentId: string, content: string, images: string[]) => void;
  handleCommentLike: (commentId: string) => void;
  handleEditComment: (commentId: string, content: string, images: string[]) => void;
  handleDeleteComment: (commentId: string) => void;
  handleLoadMoreComments: () => void;
  handleRefreshComments: () => void;
} {
  const postId = options?.postId || "";
  const isAuthenticated = options?.isAuthenticated ?? true;
  const onSignUpPrompt = options?.onSignUpPrompt || (() => {});
  const minLoadingDelay = options?.minLoadingDelay ?? { min: 800, max: 1500 };

  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [commentOffset, setCommentOffset] = useState(0);
  const [commentPagination, setCommentPagination] = useState<CommentPagination | null>(null);

  // DB 댓글 데이터를 CommentNode로 변환
  const normalizeComments = (rawComments: RawCommentData[]): CommentNode[] => {
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    // 1단계: 모든 댓글을 CommentNode로 변환
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
        images: raw.images && raw.images.length > 0 
          ? raw.images.map((path: string) => {
              // 이미 URL인 경우 그대로 반환
              if (path.startsWith("http://") || path.startsWith("https://")) {
                return path;
              }
              // Storage 경로인 경우 URL로 변환
              return getImageUrl(path);
            })
          : undefined,
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
    if (!postId) return;

    const startTime = Date.now();

    if (!append) {
      setIsLoadingComments(true);
    } else {
      setIsLoadingMoreComments(true);
    }

    try {
      const { comments: rawComments, pagination, error: commentsError } = await fetchPostComments(postId, {
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
      if (minLoadingDelay && !append) {
        await ensureMinDelay(startTime, minLoadingDelay);
      }

      const normalized = normalizeComments(rawComments);

      if (append) {
        setComments((prev) => [...prev, ...normalized]);
      } else {
        setComments(normalized);
      }

      setCommentPagination(pagination);
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
  };

  // 초기 댓글 로드
  useEffect(() => {
    if (postId) {
      loadComments(0, false);
    }
  }, [postId]);

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
    return {
      id: createdComment.id,
      author: {
        id: user?.id || "",
        username: user?.username || "",
        displayName: user?.displayName || "",
        avatarUrl: user?.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined,
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

      // 댓글 생성 (source_type_code는 자동 추론됨)
      const { comment, error } = await createPostComment(
        postId,
        content.trim(),
        undefined,
        imagePaths.length > 0 ? imagePaths : undefined
      );

      if (error) {
        console.error("댓글 생성 실패:", error);
        alert(error.message || "댓글 작성에 실패했습니다");
        return;
      }

      if (!comment || !user) {
        console.error("댓글 생성 응답 또는 사용자 정보 없음");
        return;
      }

      // 생성된 댓글을 CommentNode로 변환
      const newComment = createCommentNodeFromCreated(comment, null);
      
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
      if (parentDepth >= COMMENT_MAX_DEPTH) {
        alert("최대 댓글 깊이를 초과했습니다 (최대 3단계)");
        return;
      }
    }

    try {
      // 이미지 업로드
      let imagePaths: string[] = [];
      if (images.length > 0) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          alert("로그인이 필요합니다.");
          return;
        }

        const imageFiles = images.map((dataURL, index) => 
          dataURLtoFile(dataURL, `comment-image-${Date.now()}-${index}.jpg`)
        );

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
      const { comment, error } = await createPostComment(
        postId,
        content.trim(),
        parentId,
        imagePaths.length > 0 ? imagePaths : undefined
      );

      if (error) {
        console.error("답글 생성 실패:", error);
        alert(error.message || "답글 작성에 실패했습니다");
        return;
      }

      if (!comment || !user) {
        console.error("답글 생성 응답 또는 사용자 정보 없음");
        return;
      }

      // 생성된 답글을 CommentNode로 변환
      const newReply = createCommentNodeFromCreated(comment, parentId);
      
      // 기존 목록에 추가
      setComments((prev) => addCommentToTree(newReply, prev));
      
      // 페이지네이션 업데이트
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

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      onSignUpPrompt();
      return;
    }

    // 낙관적 업데이트
    const updateLike = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        
        if (item.replies) {
          return { ...item, replies: updateLike(item.replies) };
        }
        
        return item;
      });

    setComments((prev) => updateLike(prev));

    try {
      const { data, error } = await togglePostCommentLike(commentId);

      if (error) {
        console.error("댓글 좋아요 토글 실패:", error);
        // 롤백
        setComments((prev) => updateLike(prev));
        return;
      }

      if (data) {
        // API 응답으로 상태 업데이트
        const updateLikeFromResponse = (items: CommentNode[]): CommentNode[] =>
          items.map((item) => {
            if (item.id === commentId) {
              return {
                ...item,
                isLiked: data.is_liked,
                likesCount: data.likes_count,
              };
            }
            
            if (item.replies) {
              return { ...item, replies: updateLikeFromResponse(item.replies) };
            }
            
            return item;
          });

        setComments((prev) => updateLikeFromResponse(prev));
      }
    } catch (err) {
      console.error("댓글 좋아요 토글 예외:", err);
      // 롤백
      setComments((prev) => updateLike(prev));
    }
  };

  const handleEditComment = async (commentId: string, content: string, images: string[]) => {
    if (!content.trim() || !isAuthenticated) return;

    try {
      // 이미지 업로드
      let imagePaths: string[] | undefined = undefined;
      if (images.length > 0) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          alert("로그인이 필요합니다.");
          return;
        }

        const imageFiles = images.map((dataURL, index) => 
          dataURLtoFile(dataURL, `comment-image-${Date.now()}-${index}.jpg`)
        );

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

      const { comment, error } = await updatePostComment(
        commentId,
        content.trim(),
        imagePaths
      );

      if (error) {
        console.error("댓글 수정 실패:", error);
        alert(error.message || "댓글 수정에 실패했습니다");
        return;
      }

      if (!comment) {
        return;
      }

      // 댓글 목록 업데이트
      const update = (items: CommentNode[]): CommentNode[] =>
        items.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              content: comment.content,
              images: comment.images && Array.isArray(comment.images) && comment.images.length > 0
                ? comment.images.map((path: string) => {
                    if (path.startsWith("http://") || path.startsWith("https://")) {
                      return path;
                    }
                    return getImageUrl(path);
                  })
                : undefined,
              updatedAt: comment.updated_at || new Date().toISOString(),
            };
          }
          
          if (item.replies) {
            return { ...item, replies: update(item.replies) };
          }
          
          return item;
        });

      setComments((prev) => update(prev));
    } catch (err) {
      console.error("댓글 수정 에러:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) return;

    // 낙관적 업데이트
    const markDelete = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return { ...item, isDeleted: true };
        }
        
        if (item.replies) {
          return { ...item, replies: markDelete(item.replies) };
        }
        
        return item;
      });

    setComments((prev) => markDelete(prev));

    try {
      const { success, error } = await deletePostComment(commentId);

      if (error || !success) {
        console.error("댓글 삭제 실패:", error);
        // 롤백: 전체 목록 다시 로드
        await loadComments(0, false);
        alert(error?.message || "댓글 삭제에 실패했습니다");
        return;
      }

      // 페이지네이션 업데이트
      setCommentPagination((prev) => 
        prev ? {
          ...prev,
          totalCount: Math.max(0, prev.totalCount - 1),
        } : null
      );
    } catch (err) {
      console.error("댓글 삭제 에러:", err);
      // 롤백: 전체 목록 다시 로드
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

  const totalComments = commentPagination?.totalCount || 0;
  const hasMore = commentPagination?.hasMore || false;

  return {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
    handleRefreshComments,
  };
}
