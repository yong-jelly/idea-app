import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, MessageCircle, Bookmark, ExternalLink, CheckCircle2, Plus, Heart } from "lucide-react";
import { Button, Avatar, BotBadge, ImageViewer } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { CommentThread } from "@/shared/ui/comment";
import { useUserStore, isBot } from "@/entities/user";
import { LeftSidebar } from "@/widgets";
import { SignUpModal } from "@/pages/auth";
import { useState, useEffect } from "react";
import { fetchPostDetail, togglePostLike, togglePostBookmark } from "@/entities/post/api/post.api";
import { convertToUnifiedFeedPost } from "@/widgets/feed-timeline/FeedTimeline";
import type { UnifiedFeedPost } from "@/entities/feed";
import { FEEDBACK_TYPE_INFO, FEEDBACK_STATUS_INFO, DEV_POST_TYPE_INFO } from "@/entities/feed";
import { getProjectImageUrl, normalizeImageUrls } from "@/shared/lib/storage";
import { AuthorHeader } from "@/entities/feed/ui/FeedRowBase";

// 분리된 모듈 import
import { usePostComments } from "./post-detail/usePostComments";
import { POST_TYPE_CONFIG, MAX_COMMENT_DEPTH } from "./post-detail/constants";
import { getRelativeTime, formatDateTime } from "./post-detail/lib";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserStore();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [post, setPost] = useState<UnifiedFeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // 댓글 관련 로직은 커스텀 훅으로 분리
  const {
    comments,
    totalComments,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
  } = usePostComments(user, {
    postId: postId || "",
    isAuthenticated,
    onSignUpPrompt: () => setShowSignUpModal(true),
  });

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

  // 포스트 로드
  useEffect(() => {
    if (!postId) return;
    
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await fetchPostDetail(postId);

        if (error) {
          console.error("포스트 로드 에러:", error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const convertedPost = convertToUnifiedFeedPost(data);
          setPost(convertedPost);
          setIsLiked(convertedPost.interactions.isLiked);
          setIsBookmarked(convertedPost.interactions.isBookmarked);
          setLikesCount(convertedPost.interactions.likesCount);
          setBookmarksCount(convertedPost.interactions.bookmarksCount);
        }
      } catch (err) {
        console.error("포스트 로드 예외:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    
    // 낙관적 업데이트
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    
    setIsLiked(!previousIsLiked);
    setLikesCount(previousIsLiked ? previousLikesCount - 1 : previousLikesCount + 1);

    try {
      const { data, error } = await togglePostLike(post.id);

      if (error) {
        console.error("좋아요 토글 실패:", error);
        // 롤백
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        return;
      }

      if (data) {
        setIsLiked(data.is_liked);
        setLikesCount(data.likes_count);
      }
    } catch (err) {
      console.error("좋아요 토글 예외:", err);
      // 롤백
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    
    // 낙관적 업데이트
    const previousIsBookmarked = isBookmarked;
    const previousBookmarksCount = bookmarksCount;
    
    setIsBookmarked(!previousIsBookmarked);
    setBookmarksCount(previousIsBookmarked ? previousBookmarksCount - 1 : previousBookmarksCount + 1);

    try {
      const { data, error } = await togglePostBookmark(post.id);

      if (error) {
        console.error("북마크 토글 실패:", error);
        // 롤백
        setIsBookmarked(previousIsBookmarked);
        setBookmarksCount(previousBookmarksCount);
        return;
      }

      if (data) {
        setIsBookmarked(data.is_bookmarked);
        setBookmarksCount(data.bookmarks_count);
      }
    } catch (err) {
      console.error("북마크 토글 예외:", err);
      // 롤백
      setIsBookmarked(previousIsBookmarked);
      setBookmarksCount(previousBookmarksCount);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
          <div className="p-8 text-center">
            <p className="text-surface-500">로딩 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
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
  const typeConfig = POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG];
  const TypeIcon = typeConfig?.icon;
  
  // 공지/피드백 타입 정보
  const announcementTypeInfo = (post.type === "announcement" || post.type === "update" || post.type === "vote") 
    ? DEV_POST_TYPE_INFO[post.type === "vote" ? "announcement" : post.type]
    : null;
  const feedbackTypeInfo = (post.type === "bug" || post.type === "feature" || post.type === "improvement" || post.type === "question")
    ? FEEDBACK_TYPE_INFO[post.type]
    : null;
  const feedbackStatusInfo = (post.type === "bug" || post.type === "feature" || post.type === "improvement" || post.type === "question") && "status" in post
    ? FEEDBACK_STATUS_INFO[post.status]
    : null;

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Header */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
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
          <div className="flex items-start gap-3 mb-1">
            <Link 
              to={isBot(post.author) ? "#" : `/profile/${post.author.username}`}
              onClick={(e) => {
                if (isBot(post.author)) {
                  e.preventDefault();
                }
              }}
            >
              <Avatar
                src={post.author.avatar}
                alt={post.author.displayName}
                fallback={post.author.displayName}
                size="md"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <AuthorHeader
                author={post.author}
                createdAt={post.createdAt}
                showMoreButton={false}
                projectSource={
                  post.source && 
                  post.source.type !== "direct" && 
                  post.source.type !== "following" &&
                  (post.source.type === "project" || post.source.type === "subscribed" || post.source.type === "community")
                    ? {
                        id: post.source.id!,
                        name: post.source.name!,
                        emoji: post.source.emoji,
                        isBookmarked: post.source.isBookmarked,
                      }
                    : undefined
                }
              />
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
              </div>
            </div>
          )}

          {/* 공지/피드백 타입 배지 */}
          {/* {announcementTypeInfo && "title" in post && (
            <div className="mb-2">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                announcementTypeInfo.colorClass, announcementTypeInfo.bgClass
              )}>
                <span>{announcementTypeInfo.label}</span>
              </div>
            </div>
          )} */}

          {feedbackTypeInfo && feedbackStatusInfo && "title" in post && (
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                feedbackTypeInfo.colorClass
              )}>
                <span>{feedbackTypeInfo.label}</span>
              </div>
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                feedbackStatusInfo.colorClass
              )}>
                <span>{feedbackStatusInfo.label}</span>
              </div>
            </div>
          )}

          {/* 제목 (공지, 피드백, 프로젝트 생성) */}
          {"title" in post && post.title && (
            <h1 className={cn(
              "font-semibold text-xl text-surface-900 dark:text-surface-50 mb-3",
              "leading-tight"
            )}>
              {post.title}
            </h1>
          )}

          {/* Milestone Title */}
          {post.type === "milestone" && "milestoneTitle" in post && post.milestoneTitle && (
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
          {post.type === "feature_accepted" && "featureTitle" in post && post.featureTitle && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-medium text-sky-800 dark:text-sky-200">
                  {post.featureTitle}
                </span>
              </div>
            </div>
          )}

          {/* 프로젝트 생성 카드 */}
          {post.type === "project_created" && "projectId" in post && post.projectId && (
            <Link
              to={`/project/${post.projectId}`}
              className="block mb-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors overflow-hidden"
            >
              <div className="flex gap-3 p-3">
                {"projectThumbnail" in post && post.projectThumbnail && (
                  <div className="shrink-0">
                    <img
                      src={post.projectThumbnail}
                      alt={"projectTitle" in post ? post.projectTitle : ""}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🚀</span>
                    {"projectTitle" in post && (
                      <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-50 line-clamp-1">
                        {post.projectTitle}
                      </h3>
                    )}
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="mt-2 text-xs text-surface-500 dark:text-surface-500">
                    프로젝트 보기 →
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Content */}
          <div className="text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words mb-3 leading-relaxed text-[15px]">
            {post.content}
          </div>

          {/* Images */}
          {'images' in post && post.images && post.images.length > 0 && (() => {
            const normalizedImages = normalizeImageUrls(post.images);
            return (
              <>
                <div className={cn(
                  "mb-3 rounded-xl overflow-hidden",
                  normalizedImages.length === 1 ? "" : "grid gap-0.5",
                  normalizedImages.length === 2 ? "grid-cols-2" : "",
                  normalizedImages.length === 3 ? "grid-cols-2" : "",
                  normalizedImages.length >= 4 ? "grid-cols-2" : ""
                )}>
                  {normalizedImages.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setImageViewerIndex(idx);
                        setImageViewerOpen(true);
                      }}
                      className={cn(
                        "relative overflow-hidden bg-surface-100 dark:bg-surface-800 cursor-pointer",
                        normalizedImages.length === 1 
                          ? "w-full h-64 aspect-[16/9]" 
                          : normalizedImages.length === 2
                          ? "h-52"
                          : normalizedImages.length === 3 && idx === 0
                          ? "row-span-2 h-52"
                          : "h-40"
                      )}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                      />
                      {/* 4개 이상일 때 4번째 이미지에 +N 오버레이 */}
                      {normalizedImages.length > 4 && idx === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/60 dark:bg-black/50 backdrop-blur-sm pointer-events-none">
                          <span className="text-white text-lg font-semibold">+{normalizedImages.length - 4}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <ImageViewer
                  images={normalizedImages}
                  initialIndex={imageViewerIndex}
                  isOpen={imageViewerOpen}
                  onClose={() => setImageViewerOpen(false)}
                />
              </>
            );
          })()}

          {/* Project/Community Link Card */}
          {((("projectId" in post && post.projectId) || post.source) && post.type !== "project_created") && (
            <div className="mb-3 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              {/* Project Link */}
              {"projectId" in post && post.projectId && "projectTitle" in post && post.projectTitle && !typeConfig && (
                <Link 
                  to={`/project/${post.projectId}`}
                  className="flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden shrink-0">
                      {post.source?.thumbnail ? (
                        <img
                          src={post.source.thumbnail.startsWith("http") 
                            ? post.source.thumbnail 
                            : getProjectImageUrl(post.source.thumbnail, { width: 36, height: 36 })}
                          alt={post.projectTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-base">🚀</span>
                      )}
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
                  {"projectId" in post && post.projectId && !typeConfig && (
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
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden shrink-0">
                        
                        {post.source.thumbnail ? (
                          <img
                            src={post.source.thumbnail.startsWith("http") 
                              ? post.source.thumbnail 
                              : getProjectImageUrl(post.source.thumbnail, { width: 36, height: 36 })}
                            alt={post.source.name || ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-base">{post.source.emoji || "👥"}</span>
                        )}
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
              onClick={() => handleAuthenticatedAction(() => handleLike())}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                isLiked
                  ? "text-rose-500"
                  : "text-surface-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              )}
            >
              <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
              <span className="text-[13px] tabular-nums">{formatNumber(likesCount)}</span>
            </button>

            {/* 북마크 */}
            <button
              onClick={() => handleAuthenticatedAction(() => handleBookmark())}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ml-auto",
                isBookmarked
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30"
              )}
            >
              <Bookmark className={cn("h-[18px] w-[18px]", isBookmarked && "fill-current")} />
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
