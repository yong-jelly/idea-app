/**
 * 댓글 관련 로직을 담당하는 커스텀 훅
 */
import { useState } from "react";
import type { CommentNode } from "@/shared/ui/comment";
import { normalizeComments, countAllComments } from "./lib";
import { initialComments } from "./mock-data";
import { MAX_COMMENT_DEPTH } from "./constants";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface UsePostCommentsReturn {
  comments: CommentNode[];
  totalComments: number;
  handleAddComment: (content: string, images: string[]) => void;
  handleReply: (parentId: string, content: string, images: string[]) => void;
  handleCommentLike: (commentId: string) => void;
  handleEditComment: (commentId: string, content: string, images: string[]) => void;
  handleDeleteComment: (commentId: string) => void;
}

/**
 * 포스트 댓글 관리 훅
 * - 댓글 CRUD 작업
 * - 좋아요 토글
 * - 댓글 수 계산
 */
export function usePostComments(user: User | null): UsePostCommentsReturn {
  const [comments, setComments] = useState<CommentNode[]>(
    normalizeComments(initialComments)
  );

  const totalComments = countAllComments(comments);

  // 댓글 추가
  const handleAddComment = (content: string, _images: string[]) => {
    if (!content.trim()) return;
    
    const newComment: CommentNode = {
      id: `c${Date.now()}`,
      author: {
        id: user?.id || "current",
        username: user?.username || "guest",
        displayName: user?.displayName || "게스트",
        avatarUrl: user?.avatar,
      },
      content,
      likesCount: 0,
      isLiked: false,
      depth: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    
    setComments((prev) => [...prev, newComment]);
  };

  // 답글 추가
  const handleReply = (parentId: string, content: string, _images: string[]) => {
    const addReply = (items: CommentNode[], depth = 0): CommentNode[] =>
      items.map((item) => {
        const currentDepth = Number.isFinite(item.depth) && item.depth! >= 0 
          ? item.depth! 
          : depth;
          
        if (item.id === parentId) {
          if (currentDepth >= MAX_COMMENT_DEPTH) return item;
          
          const newReply: CommentNode = {
            id: `reply-${Date.now()}`,
            author: {
              id: user?.id || "current",
              username: user?.username || "guest",
              displayName: user?.displayName || "게스트",
              avatarUrl: user?.avatar,
            },
            content,
            likesCount: 0,
            isLiked: false,
            depth: currentDepth + 1,
            parentId,
            createdAt: new Date().toISOString(),
            replies: [],
          };
          
          return { ...item, replies: [...(item.replies || []), newReply] };
        }
        
        if (item.replies) {
          return { ...item, replies: addReply(item.replies, currentDepth + 1) };
        }
        
        return item;
      });

    setComments((prev) => addReply(prev));
  };

  // 댓글 좋아요 토글
  const handleCommentLike = (commentId: string) => {
    const toggleLike = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        
        if (item.replies) {
          return { ...item, replies: toggleLike(item.replies) };
        }
        
        return item;
      });
      
    setComments((prev) => toggleLike(prev));
  };

  // 댓글 수정
  const handleEditComment = (commentId: string, content: string, _images: string[]) => {
    const update = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return { ...item, content, updatedAt: new Date().toISOString() };
        }
        
        if (item.replies) {
          return { ...item, replies: update(item.replies) };
        }
        
        return item;
      });
      
    setComments((prev) => update(prev));
  };

  // 댓글 삭제 (소프트 삭제)
  const handleDeleteComment = (commentId: string) => {
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
  };

  return {
    comments,
    totalComments,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
  };
}

