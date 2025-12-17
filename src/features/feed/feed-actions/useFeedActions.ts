import { useCallback } from "react";
import { usePostStore } from "@/entities/post";
import { useUserStore } from "@/entities/user";

/**
 * 피드 인터랙션 액션들을 제공하는 훅
 */
export function useFeedActions() {
  const { toggleLike, toggleBookmark } = usePostStore();
  const { addPoints } = useUserStore();

  const handleLike = useCallback((postId: string) => {
    toggleLike(postId);
    // 좋아요 시 포인트 지급 (데모)
    addPoints(1);
  }, [toggleLike, addPoints]);

  const handleBookmark = useCallback((postId: string) => {
    toggleBookmark(postId);
  }, [toggleBookmark]);

  const handleComment = useCallback((postId: string) => {
    // 댓글 다이얼로그 열기 등
    console.log("Open comment dialog for post:", postId);
  }, []);

  const handleShare = useCallback((postId: string) => {
    // 공유 다이얼로그 열기
    if (navigator.share) {
      navigator.share({
        title: "1DD 포스트",
        url: `${window.location.origin}/post/${postId}`,
      });
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    }
  }, []);

  return {
    handleLike,
    handleBookmark,
    handleComment,
    handleShare,
  };
}

