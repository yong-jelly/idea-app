import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, MessageCircle, Bookmark, ExternalLink, CheckCircle2, Plus, Heart } from "lucide-react";
import { Button, Avatar } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { CommentThread } from "@/shared/ui/comment";
import { usePostStore } from "@/entities/post";
import { useUserStore } from "@/entities/user";
import { LeftSidebar } from "@/widgets";
import { SignUpModal } from "@/pages/auth";
import { useState, useEffect } from "react";

// 분리된 모듈 import
import { usePostComments } from "./post-detail/usePostComments";
import { POST_TYPE_CONFIG, MAX_COMMENT_DEPTH } from "./post-detail/constants";
import { getRelativeTime, formatDateTime } from "./post-detail/lib";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { posts, toggleLike, toggleBookmark } = usePostStore();
  const { user, isAuthenticated } = useUserStore();
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // 댓글 관련 로직은 커스텀 훅으로 분리
  const {
    comments,
    totalComments,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
  } = usePostComments(user);

  /**
   * 회원용 인터랙션 처리
   * - 비회원이 좋아요/북마크 버튼 클릭 시 회원가입 모달 표시
   */
  const handleAuthenticatedAction = (action: () => void) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }
    action();
  };

  // 페이지 진입 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]);

  // 포스트 찾기
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
          <div className="p-8 text-center">
            <p className="text-surface-500">포스트를 찾을 수 없습니다.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              홈으로 돌아가기
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // 피드 타입 설정
  const typeConfig = POST_TYPE_CONFIG[post.type];
  const TypeIcon = typeConfig?.icon;

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="h-[53px] flex items-center gap-4 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">게시물</h1>
          </div>
        </div>

        {/* Post Detail */}
        <article className="px-4 py-3">
          {/* Author Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${post.author.username}`}>
                <Avatar
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  fallback={post.author.displayName}
                  size="md"
                />
              </Link>
              <div className="flex items-center gap-1.5 min-w-0 text-sm">
                <Link 
                  to={`/profile/${post.author.username}`}
                  className="font-semibold text-surface-900 dark:text-surface-50 hover:underline truncate"
                >
                  {post.author.displayName}
                </Link>
                <span className="text-surface-400 dark:text-surface-500 truncate">
                  @{post.author.username}
                </span>
                <span className="text-surface-300 dark:text-surface-600">·</span>
                <span className="text-surface-400 dark:text-surface-500 shrink-0">
                  {getRelativeTime(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Post Type Badge & Info */}
          {typeConfig && (
            <div className="mb-2">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                typeConfig.bgClass, typeConfig.colorClass
              )}>
                {TypeIcon && <TypeIcon className="h-3.5 w-3.5" />}
                <span>{typeConfig.label}</span>
                {post.projectTitle && post.projectId && (
                  <>
                    <span className="opacity-50 mx-0.5">·</span>
                    <Link
                      to={`/project/${post.projectId}`}
                      className="hover:underline"
                    >
                      {post.projectTitle}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Milestone Title */}
          {post.type === "milestone" && post.milestoneTitle && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  {post.milestoneTitle}
                </span>
              </div>
            </div>
          )}

          {/* Feature Title */}
          {post.type === "feature_accepted" && post.featureTitle && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium text-sky-800 dark:text-sky-200">
                  {post.featureTitle}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words mb-3 leading-relaxed text-[15px]">
            {post.content}
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={cn(
              "mb-3 rounded-xl overflow-hidden",
              post.images.length === 1 ? "" : "grid gap-0.5",
              post.images.length === 2 ? "grid-cols-2" : "",
              post.images.length === 3 ? "grid-cols-2" : "",
              post.images.length >= 4 ? "grid-cols-2" : ""
            )}>
              {post.images.slice(0, 4).map((img, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "relative overflow-hidden bg-surface-100 dark:bg-surface-800",
                    post.images!.length === 1 ? "aspect-[16/9]" : "aspect-square",
                    post.images!.length === 3 && idx === 0 ? "row-span-2 aspect-auto" : ""
                  )}
                >
                  <img
                    src={img}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Project/Community Link Card */}
          {(post.projectId || post.source) && (
            <div className="mb-3 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              {/* Project Link */}
              {post.projectId && post.projectTitle && !typeConfig && (
                <Link 
                  to={`/project/${post.projectId}`}
                  className="flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-base">🚀</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {post.projectTitle}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        프로젝트 보기
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-surface-400" />
                </Link>
              )}

              {/* Source (Community/Project) Link */}
              {post.source && post.source.type !== "direct" && post.source.type !== "following" && post.source.id && (
                <>
                  {post.projectId && !typeConfig && (
                    <div className="border-t border-surface-200 dark:border-surface-700" />
                  )}
                  <Link 
                    to={post.source.type === "community" 
                      ? `/project/${post.source.id}/community` 
                      : `/project/${post.source.id}`
                    }
                    className="flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="text-base">{post.source.emoji || "👥"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {post.source.name}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {post.source.type === "community" ? "커뮤니티" : "프로젝트"}
                          {post.source.isJoined && " · 참여 중"}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-surface-400" />
                  </Link>
                </>
              )}
            </div>
          )}

          {/* 등록 날짜 */}
          <div className="py-3 text-sm text-surface-500 dark:text-surface-400">
            {formatDateTime(post.createdAt)}
          </div>

          {/* 구분선 */}
          <div className="border-t border-surface-100 dark:border-surface-800" />

          {/* 인터랙션 버튼 */}
          <div className="flex items-center gap-1 -ml-2 pt-2 border-b border-surface-100 dark:border-surface-800 pb-3">
            {/* 댓글 */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-all">
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-[13px] tabular-nums">{formatNumber(totalComments)}</span>
            </button>

            {/* 좋아요 */}
            <button
              onClick={() => handleAuthenticatedAction(() => toggleLike(post.id))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                post.isLiked
                  ? "text-rose-500"
                  : "text-surface-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              )}
            >
              <Heart className={cn("h-[18px] w-[18px]", post.isLiked && "fill-current")} />
              <span className="text-[13px] tabular-nums">{formatNumber(post.likesCount)}</span>
            </button>

            {/* 북마크 */}
            <button
              onClick={() => handleAuthenticatedAction(() => toggleBookmark(post.id))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ml-auto",
                post.isBookmarked
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30"
              )}
            >
              <Bookmark className={cn("h-[18px] w-[18px]", post.isBookmarked && "fill-current")} />
            </button>
          </div>
        </article>

        {/* Comments */}
        <div className="px-4 py-4">
          <CommentThread
            comments={comments}
            currentUser={
              user
                ? {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatar,
                  }
                : { id: "guest", displayName: "게스트" }
            }
            currentUserId={user?.id}
            maxDepth={MAX_COMMENT_DEPTH}
            enableAttachments={true}
            maxImages={1}
            isAuthenticated={isAuthenticated}
            onSignUpPrompt={() => setShowSignUpModal(true)}
            onCreate={handleAddComment}
            onReply={handleReply}
            onLike={handleCommentLike}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </main>

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}
