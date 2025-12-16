/**
 * PostDetailPage 유틸리티 함수
 */
import type { CommentNode } from "@/shared/ui/comment";
import type { RawComment } from "./types";

/**
 * 상대 시간 포맷 (예: "방금 전", "5분", "2시간")
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일`;
  
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/**
 * 날짜/시간 포맷 (예: "2024년 1월 15일 오후 3시 30분")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${year}년 ${month}월 ${day}일 ${period} ${displayHours}시 ${minutes}분`;
}

/**
 * RawComment 배열을 CommentNode 배열로 정규화
 */
export function normalizeComments(
  items: RawComment[], 
  depth = 0, 
  parentId?: string
): CommentNode[] {
  return items.map((item) => {
    const itemDepth = Number.isFinite(item.depth) && item.depth! >= 0 ? item.depth! : depth;
    return {
      id: item.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName,
        avatarUrl: item.author.avatar,
      },
      content: item.content,
      parentId: item.parentId ?? parentId,
      depth: itemDepth,
      likesCount: item.likesCount,
      isLiked: item.isLiked,
      isDeleted: item.isDeleted,
      images: item.images,
      createdAt: item.createdAt,
      replies: item.replies ? normalizeComments(item.replies, itemDepth + 1, item.id) : [],
    };
  });
}

/**
 * 댓글 트리에서 전체 댓글 수 계산 (대댓글 포함)
 */
export function countAllComments(items: CommentNode[]): number {
  return items.reduce((acc, c) => acc + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
}

