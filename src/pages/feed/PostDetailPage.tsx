import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, MessageCircle, Bookmark, ExternalLink, Flag, Clock, CheckCircle2, Plus, Heart } from "lucide-react";
import { Button, Avatar } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { CommentThread, type CommentNode } from "@/shared/ui/comment";
import { usePostStore } from "@/entities/post";
import { useUserStore } from "@/entities/user";
import { LeftSidebar } from "@/widgets";
import { useState, useEffect } from "react";

// 댓글 타입 정의
const MAX_COMMENT_DEPTH = 3; // CommentThread 기본값에 맞춤

type RawComment = {
  id: string;
  parentId?: string;
  replyTo?: { username: string; displayName: string };
  depth?: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  images?: string[];
  replies?: RawComment[];
};

// 데모용 댓글 데이터 (대댓글 포함)
const initialComments: RawComment[] = [
  {
    id: "c1",
    depth: 0,
    author: {
      id: "10",
      username: "dev_mentor",
      displayName: "개발멘토",
      avatar: undefined,
    },
    content: "축하합니다! 정말 대단한 성과네요. 🎉",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likesCount: 12,
    isLiked: false,
  },
  {
    id: "c1-1",
    parentId: "c1",
    depth: 1,
    replyTo: { username: "dev_mentor", displayName: "개발멘토" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "감사합니다! 앞으로도 열심히 하겠습니다 💪",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    likesCount: 5,
    isLiked: true,
  },
  {
    id: "c1-2",
    parentId: "c1-1",
    depth: 2,
    replyTo: { username: "indie_dev", displayName: "김인디" },
    author: {
      id: "10",
      username: "dev_mentor",
      displayName: "개발멘토",
      avatar: undefined,
    },
    content: "화이팅입니다! 다음 업데이트도 기대할게요 😊",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    likesCount: 3,
    isLiked: false,
  },
  {
    id: "c1-3",
    parentId: "c1-2",
    depth: 2,
    replyTo: { username: "dev_mentor", displayName: "개발멘토" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "네, 열심히 준비하고 있어요! 곧 새로운 기능을 공개할 예정입니다 🚀",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likesCount: 7,
    isLiked: false,
  },
  {
    id: "c2",
    depth: 0,
    author: {
      id: "11",
      username: "react_master",
      displayName: "리액트마스터",
      avatar: undefined,
    },
    content: "저도 비슷한 프로젝트를 진행 중인데, 어떤 기술 스택을 사용하셨나요? 공유해주시면 감사하겠습니다!",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likesCount: 8,
    isLiked: true,
  },
  {
    id: "c2-1",
    parentId: "c2",
    depth: 1,
    replyTo: { username: "react_master", displayName: "리액트마스터" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "React + TypeScript + Tailwind CSS를 메인으로 사용했고, 백엔드는 Bun으로 구성했어요!",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    likesCount: 15,
    isLiked: false,
  },
  {
    id: "c3",
    depth: 0,
    author: {
      id: "12",
      username: "newbie_coder",
      displayName: "코딩뉴비",
      avatar: undefined,
    },
    content: "인디 개발자로서 정말 영감이 됩니다. 화이팅입니다! 💪",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    likesCount: 5,
    isLiked: false,
  },
];

// 피드 타입 정보
const POST_TYPE_CONFIG = {
  text: null,
  project_update: {
    label: "프로젝트 업데이트",
    icon: Clock,
    colorClass: "text-primary-600 dark:text-primary-400",
    bgClass: "bg-primary-50 dark:bg-primary-950/30",
  },
  milestone: {
    label: "마일스톤 달성",
    icon: Flag,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  feature_accepted: {
    label: "기능 수락",
    icon: CheckCircle2,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
  },
};

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { posts, toggleLike, toggleBookmark } = usePostStore();
  const { user } = useUserStore();

  const normalizeComments = (items: RawComment[], depth = 0, parentId?: string): CommentNode[] =>
    items.map((item) => {
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

  const [comments, setComments] = useState<CommentNode[]>(normalizeComments(initialComments));

  // 페이지 진입 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]);

  // 포스트 찾기
  const post = posts.find((p) => p.id === postId);

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
        const currentDepth = Number.isFinite(item.depth) && item.depth! >= 0 ? item.depth! : depth;
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

  // 댓글 좋아요
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

  // 댓글 삭제 (소프트)
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

  const countAllComments = (items: CommentNode[]): number =>
    items.reduce((acc, c) => acc + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
  const totalComments = countAllComments(comments);

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
          {/* Author Header - 일반 피드와 동일한 스타일 */}
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

          {/* Content - 일반 피드와 동일한 스타일 */}
          <div className="text-surface-800 dark:text-surface-200 whitespace-pre-wrap break-words mb-3 leading-relaxed text-[15px]">
            {post.content}
          </div>

          {/* Images - 일반 피드와 동일한 스타일 */}
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

          {/* 인터랙션 버튼 - 일반 피드와 동일한 스타일 */}
          <div className="flex items-center gap-1 -ml-2 pt-2 border-b border-surface-100 dark:border-surface-800 pb-3">
            {/* 댓글 */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 dark:hover:text-surface-300 transition-all">
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-[13px] tabular-nums">{formatNumber(totalComments)}</span>
            </button>

            {/* 좋아요 */}
            <button
              onClick={() => toggleLike(post.id)}
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
              onClick={() => toggleBookmark(post.id)}
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
            onCreate={handleAddComment}
            onReply={handleReply}
            onLike={handleCommentLike}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </main>
    </div>
  );
}

// 인라인 답글 작성 컴포넌트
interface InlineReplyComposerProps {
  user: { avatar?: string; displayName: string };
  replyTo: { username: string; displayName: string };
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  depth?: number; // 부모 댓글의 depth (없으면 원글에 대한 답글)
}

function InlineReplyComposer({ user, replyTo, value, onChange, onSubmit, onCancel, depth = -1 }: InlineReplyComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 열릴 때 자동 포커스
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  // 새 댓글의 depth를 계산하여 들여쓰기 결정 (부모 depth + 1)
  const newDepth = depth + 1;
  const paddingClass = newDepth === 0 ? "px-4" : newDepth === 1 ? "pl-14 pr-4" : "pl-20 pr-4";
  
  return (
    <div className={cn(
      "py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-800",
      paddingClass
    )}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm text-surface-500 dark:text-surface-400">
          <Link to={`/profile/${replyTo.username}`} className="text-primary-500 hover:underline">
            @{replyTo.username}
          </Link>
          님에게 답글 작성
        </span>
        <button 
          onClick={onCancel}
          className="ml-auto p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
        >
          <X className="h-4 w-4 text-surface-400" />
        </button>
      </div>
      <div className="flex gap-3">
        <Avatar
          src={user.avatar}
          alt={user.displayName}
          fallback={user.displayName}
          size="sm"
        />
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`@${replyTo.username}에게 답글 작성...`}
            className="min-h-16 resize-none border border-surface-200 dark:border-surface-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary-500 bg-white dark:bg-surface-900"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-surface-400">
              ⌘+Enter로 전송 · Esc로 취소
            </span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onCancel}
              >
                취소
              </Button>
              <Button 
                size="sm" 
                disabled={!value.trim()}
                onClick={onSubmit}
              >
                답글
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 댓글 아이템 컴포넌트
interface CommentItemProps {
  comment: Comment;
  postAuthor: { username: string; displayName: string };
  currentUser: { id: string; username: string; displayName: string; avatar?: string } | null;
  isReplyActive: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  editContent: string;
  onReplyClick: () => void;
  onLike: (commentId: string) => void;
  onStartEdit: (comment: Comment) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onEditContentChange: (content: string) => void;
  onDeleteClick: () => void;
  onDeleteConfirm: (commentId: string) => void;
  onDeleteCancel: () => void;
  canReply: boolean; // 답글 버튼 표시 여부
}

function CommentItem({ 
  comment, 
  postAuthor, 
  currentUser,
  isReplyActive, 
  isEditing,
  isDeleting,
  editContent,
  onReplyClick, 
  onLike,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  canReply 
}: CommentItemProps) {
  const depth = comment.depth;
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isOwnComment = currentUser?.id === comment.author.id;
  
  // depth에 따른 들여쓰기 (px-4가 기본, depth 1: pl-14, depth 2: pl-20)
  const paddingClass = depth === 0 ? "px-4" : depth === 1 ? "pl-14 pr-4" : "pl-20 pr-4";

  // 수정 모드 시 포커스
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  // 삭제된 댓글인 경우
  if (comment.isDeleted) {
    return (
      <article 
        className={cn(
          "py-3 border-b border-surface-100 dark:border-surface-800",
          paddingClass
        )}
      >
        <div className="flex gap-3">
          <div className={cn(
            "rounded-full bg-surface-200 dark:bg-surface-700",
            depth > 0 ? "h-8 w-8" : "h-10 w-10"
          )} />
          <div className="flex-1 min-w-0 py-1">
            <p className="text-sm text-surface-400 dark:text-surface-500 italic">
              삭제된 댓글입니다
            </p>
          </div>
        </div>
      </article>
    );
  }
  
  return (
    <article 
      className={cn(
        "py-3 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors",
        paddingClass
      )}
    >
      <div className="flex gap-3">
        <Link to={`/profile/${comment.author.username}`}>
          <Avatar
            src={comment.author.avatar}
            alt={comment.author.displayName}
            fallback={comment.author.displayName}
            size={depth > 0 ? "sm" : "md"}
          />
        </Link>
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center gap-1.5 text-sm">
            <Link 
              to={`/profile/${comment.author.username}`}
              className="font-bold text-surface-900 dark:text-surface-50 hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-surface-500 dark:text-surface-400">
              @{comment.author.username}
            </span>
            <span className="text-surface-400 dark:text-surface-500">·</span>
            <span className="text-surface-500 dark:text-surface-400">
              {getRelativeTime(comment.createdAt)}
            </span>
          </div>
          
          {/* Reply To */}
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">
            {comment.replyTo ? (
              <>
                <Link to={`/profile/${comment.replyTo.username}`} className="text-primary-500 hover:underline">
                  @{comment.replyTo.username}
                </Link>
                님에게 보내는 답글
              </>
            ) : (
              <>
                <Link to={`/profile/${postAuthor.username}`} className="text-primary-500 hover:underline">
                  @{postAuthor.username}
                </Link>
                님에게 보내는 답글
              </>
            )}
          </p>

          {/* Comment Content - 수정 모드 */}
          {isEditing ? (
            <div className="mt-1">
              <Textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="min-h-[60px] resize-none border border-surface-200 dark:border-surface-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary-500 bg-white dark:bg-surface-900"
                onKeyDown={(e) => {
                  if (e.key === "Escape") onCancelEdit();
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSaveEdit(comment.id);
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-surface-400">⌘+Enter로 저장 · Esc로 취소</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                    취소
                  </Button>
                  <Button size="sm" disabled={!editContent.trim()} onClick={() => onSaveEdit(comment.id)}>
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Comment Content - 일반 모드 */
            <p className={cn(
              "text-surface-900 dark:text-surface-50 whitespace-pre-wrap",
              depth > 0 ? "text-sm" : "text-[15px]"
            )}>
              {comment.content}
            </p>
          )}

          {/* Comment Actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2 -ml-2">
              {canReply && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 px-2 gap-1",
                    isReplyActive ? "text-primary-500" : "text-surface-500 hover:text-primary-500"
                  )}
                  onClick={onReplyClick}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">답글</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-2 gap-1",
                  comment.isLiked ? "text-rose-500" : "text-surface-500 hover:text-rose-500"
                )}
                onClick={() => onLike(comment.id)}
              >
                <Heart className={cn("h-4 w-4", comment.isLiked && "fill-current")} />
                <span className="text-xs">{comment.likesCount}</span>
              </Button>

              {/* 수정/삭제 버튼 - 본인 댓글만 */}
              {isOwnComment && (
                <>
                  {/* 구분선 */}
                  <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    onClick={() => onStartEdit(comment)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">수정</span>
                  </Button>
                  
                  {isDeleting ? (
                    /* 삭제 확인 인라인 */
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">삭제할까요?</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline"
                        onClick={() => onDeleteConfirm(comment.id)}
                      >
                        확인
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                        onClick={onDeleteCancel}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                      onClick={onDeleteClick}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">삭제</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일`;
  
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatDateTime(dateString: string): string {
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
