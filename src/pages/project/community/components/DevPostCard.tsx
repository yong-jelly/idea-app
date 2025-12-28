import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { Avatar, Badge, Card, CardContent, ImageViewer } from "@/shared/ui";
import { CommentThread } from "@/shared/ui/comment";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl } from "@/shared/lib/storage";
import type { DevPost } from "../types";
import { useDevFeedComments } from "../tabs/hooks/useDevFeedComments";
import { LoginModal } from "@/pages/auth";

interface DevPostCardProps {
  post: DevPost;
  projectAuthorId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: (e?: React.MouseEvent) => void;
  onVote?: (voteOptionId: string) => void;
}

export function DevPostCard({ post, projectAuthorId, onEdit, onDelete, onTogglePin: _onTogglePin, onVote }: DevPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const { user } = useUserStore();

  // 본문 텍스트 길이 확인
  const MAX_CONTENT_LENGTH = 200;
  const isContentLong = post.content.length > MAX_CONTENT_LENGTH;
  const displayContent = isContentLong && !isContentExpanded
    ? post.content.slice(0, MAX_CONTENT_LENGTH) + "..."
    : post.content;

  // 댓글 시스템 hook 사용
  const {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore: hasMoreComments,
    loadComments,
    handleAddComment,
    handleReply,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
  } = useDevFeedComments({
    postId: post.id,
    projectAuthorId,
    isAuthenticated: !!user,
    onSignUpPrompt: () => setShowLoginModal(true),
  });

  // 확장될 때만 댓글 로드
  useEffect(() => {
    if (isExpanded && comments.length === 0 && !isLoadingComments) {
      loadComments(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, post.id]);

  // 투표 관련 상태 (post에서 가져옴)
  const voteOptions = post.voteOptions || [];
  const votedOptionId = post.votedOptionId;
  const totalVotes = post.totalVotes || 0;

  const handleVote = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (onVote) {
      onVote(optionId);
    }
  };

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // 낙관적 업데이트 (즉시 UI 업데이트)
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    
    setIsLiked(!previousIsLiked);
    setLikesCount((prev) => (previousIsLiked ? prev - 1 : prev + 1));

    try {
      // API 호출
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_toggle_post_like", {
          p_post_id: post.id,
        });

      if (error) {
        console.error("좋아요 토글 실패:", error);
        // 에러 발생 시 이전 상태로 롤백
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        alert("좋아요 처리 중 오류가 발생했습니다.");
        return;
      }

      // API 응답으로 상태 업데이트
      if (data) {
        setIsLiked(data.is_liked);
        setLikesCount(data.likes_count);
      }
    } catch (err) {
      console.error("좋아요 토글 에러:", err);
      // 에러 발생 시 이전 상태로 롤백
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <Card 
      variant="bordered"
      className={cn(
        "border-surface-200/80 dark:border-surface-800 shadow-none",
        post.isPinned && "ring-2 ring-primary-200 dark:ring-primary-800"
      )}
    >
      <CardContent className="p-0">
        {/* Post Header */}
        <div
          className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {post.isPinned && (
            <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
              <Bookmark className="h-3 w-3 fill-current" />
              고정됨
            </div>
          )}
          <div className="flex items-start gap-3">
            <Avatar 
              src={post.author.avatar} 
              fallback={post.author.displayName} 
              size="md" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-surface-900 dark:text-surface-50">
                  {post.author.displayName}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {post.author.role}
                </Badge>
                <span className="text-sm text-surface-400">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {post.title}
              </h3>
              <div className="mb-3">
                <p className="text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                  {displayContent}
                </p>
                {isContentLong && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsContentExpanded(!isContentExpanded);
                    }}
                    className="mt-2 text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {isContentExpanded ? "접기" : "더보기"}
                  </button>
                )}
              </div>
              
              {/* 투표 UI (투표 타입일 때만) */}
              {post.type === "vote" && voteOptions.length > 0 && (
                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {voteOptions.map((option) => {
                    // UUID 비교를 위해 모두 문자열로 변환
                    const optionIdStr = String(option.id);
                    const votedOptionIdStr = votedOptionId ? String(votedOptionId) : null;
                    const isSelected = votedOptionIdStr === optionIdStr;
                    const hasVoted = !!votedOptionIdStr;
                    
                    // 디버깅: 투표 계산 확인
                    if (hasVoted && option.votesCount === 0 && totalVotes > 0) {
                      console.warn("투표 옵션 0% 문제:", {
                        optionId: optionIdStr,
                        optionText: option.text,
                        votesCount: option.votesCount,
                        totalVotes,
                        votedOptionId: votedOptionIdStr,
                        isSelected,
                        allOptions: voteOptions.map(opt => ({
                          id: String(opt.id),
                          text: opt.text,
                          votesCount: opt.votesCount,
                        })),
                      });
                    }
                    
                    const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={(e) => handleVote(option.id, e)}
                        className={cn(
                          "relative w-full text-left rounded-lg border-2 overflow-hidden transition-all",
                          isSelected
                            ? "border-primary-400 dark:border-primary-600"
                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                        )}
                      >
                        {/* 투표 진행률 바 (투표 후에만 표시) */}
                        {hasVoted && (
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 transition-all",
                              isSelected
                                ? "bg-primary-100 dark:bg-primary-900/30"
                                : "bg-surface-100 dark:bg-surface-800"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        
                        <div className="relative px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
                            )}
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-primary-700 dark:text-primary-300" : "text-surface-700 dark:text-surface-300"
                            )}>
                              {option.text}
                            </span>
                          </div>
                          {hasVoted && (
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              isSelected ? "text-primary-600 dark:text-primary-400" : "text-surface-500"
                            )}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  
                  <p className="text-xs text-surface-400 pt-1">
                    {totalVotes}명 투표 참여
                    {votedOptionId && " · 다시 클릭하면 투표 취소"}
                  </p>
                </div>
              )}
              
              {/* 이미지 영역 (본문 하단 별도 영역) */}
              {post.images && post.images.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                  <div className="flex flex-wrap gap-2">
                    {post.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageViewerIndex(idx);
                          setImageViewerOpen(true);
                        }}
                      >
                        <img
                          src={img}
                          alt={`첨부 이미지 ${idx + 1}`}
                          className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700 group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className={cn(
                    "flex items-center gap-1 text-sm transition-colors",
                    isLiked ? "text-rose-500" : "text-surface-500 hover:text-rose-500"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {formatNumber(likesCount)}
                </button>
                <button className={cn(
                  "flex items-center gap-1 text-sm transition-colors",
                  isExpanded ? "text-primary-500" : "text-surface-500 hover:text-primary-500"
                )}>
                  <MessageCircle className="h-4 w-4" />
                  {formatNumber(totalComments || post.commentsCount)}
                </button>
                {isLoadingComments && (
                  <span className="text-xs text-surface-400">로딩 중...</span>
                )}
                
                {/* 관리 액션 버튼 */}
                {(onEdit || onDelete) && (
                  <div className="ml-auto flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                        className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {!onEdit && !onDelete && (
                  <span className="ml-auto text-surface-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Comments Section */}
        {isExpanded && (
          <div className="border-t border-surface-100 dark:border-surface-800">
            <div className="p-4 rounded-xl bg-white dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
              <CommentThread
                comments={comments}
                currentUser={
                  user
                    ? {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatar
                          ? getProfileImageUrl(user.avatar, "sm")
                          : undefined,
                      }
                    : { id: "guest", displayName: "게스트" }
                }
                currentUserId={user?.id}
                maxDepth={2}
                enableAttachments={true}
                maxImages={3}
                isAuthenticated={!!user}
                onSignUpPrompt={() => setShowLoginModal(true)}
                onCreate={handleAddComment}
                onReply={handleReply}
                onLike={handleLikeComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                hasMore={hasMoreComments}
                isLoadingMore={isLoadingMoreComments}
                onLoadMore={handleLoadMoreComments}
                isLoadingComments={isLoadingComments}
              />
            </div>
          </div>
        )}
      </CardContent>
      {showLoginModal && (
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
        />
      )}
      {post.images && post.images.length > 0 && (
        <ImageViewer
          images={post.images}
          initialIndex={imageViewerIndex}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </Card>
  );
}

