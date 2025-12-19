import type { CommentNode } from "@/shared/ui/comment";
import type { PostComment } from "../types";

/**
 * 댓글 배열을 CommentNode 형식으로 정규화합니다.
 * 중첩된 댓글 구조를 평탄화하고 depth를 계산합니다.
 */
export function normalizeComments(
  items: PostComment[],
  depth = 0,
  parentId?: string
): CommentNode[] {
  return items.map((item) => {
    const itemDepth = Number.isFinite(item.depth) && item.depth! >= 0 ? item.depth! : depth;
    return {
      id: item.id,
      author: item.author,
      content: item.content,
      parentId: item.parentId ?? parentId,
      depth: itemDepth,
      likesCount: item.likesCount,
      isLiked: item.isLiked,
      isDeleted: item.isDeleted,
      images: item.images,
      createdAt: item.createdAt,
      updatedAt: (item as any).updatedAt,
      replies: item.replies ? normalizeComments(item.replies, itemDepth + 1, item.id) : [],
    };
  });
}

/**
 * 댓글 트리에서 모든 댓글의 개수를 계산합니다 (대댓글 포함).
 */
export function countAllComments(items: CommentNode[]): number {
  return items.reduce((acc, c) => acc + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
}

