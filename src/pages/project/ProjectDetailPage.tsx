import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronUp,
  ExternalLink,
  Share2,
  Bookmark,
  MessageSquare,
  Users,
  Calendar,
  Github,
  Globe,
  Heart,
  MoreHorizontal,
  Play,
  ChevronLeft,
  ChevronRight,
  Send,
  Reply,
  Trophy,
  Megaphone,
  Info,
} from "lucide-react";
import { Button, Avatar, Badge, Textarea } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { usePostStore } from "@/entities/post";

// 댓글 타입 정의
interface ProjectComment {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isMaker?: boolean;
  };
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: ProjectComment[];
}

// 더미 댓글 데이터
const dummyComments: ProjectComment[] = [
  {
    id: "c1",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      isMaker: true,
    },
    content:
      "안녕하세요! 이 프로젝트를 만든 개발자입니다. 🎉\n\n많은 관심 부탁드립니다. 궁금한 점이 있으시면 언제든지 질문해주세요!",
    likesCount: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    replies: [
      {
        id: "c1-1",
        author: {
          id: "u2",
          username: "devfan",
          displayName: "개발팬",
        },
        content: "정말 멋진 프로젝트네요! 어떤 기술 스택을 사용하셨나요?",
        likesCount: 5,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "c1-2",
        author: {
          id: "u1",
          username: "indiemaker",
          displayName: "인디메이커",
          isMaker: true,
        },
        content:
          "@devfan 감사합니다! 프론트엔드는 React + TypeScript, 백엔드는 Node.js를 사용했습니다.",
        likesCount: 3,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: "c2",
    author: {
      id: "u3",
      username: "startup_hunter",
      displayName: "스타트업헌터",
    },
    content:
      "UI가 정말 깔끔하네요. 특히 다크모드 지원이 마음에 듭니다. 앱 출시 계획도 있으신가요?",
    likesCount: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    replies: [],
  },
  {
    id: "c3",
    author: {
      id: "u4",
      username: "tech_reviewer",
      displayName: "테크리뷰어",
    },
    content:
      "API 문서화가 잘 되어있어서 연동하기 편했습니다. 다만 rate limit이 조금 낮은 것 같은데, 유료 플랜에서는 어떻게 되나요?",
    likesCount: 4,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    replies: [],
  },
];

// 팀 멤버 타입
interface TeamMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
}

// 더미 팀 데이터
const dummyTeam: TeamMember[] = [
  {
    id: "t1",
    username: "indiemaker",
    displayName: "인디메이커",
    role: "Founder & Developer",
  },
  {
    id: "t2",
    username: "designer_kim",
    displayName: "김디자이너",
    role: "UI/UX Designer",
  },
];

// 댓글 컴포넌트
function CommentItem({
  comment,
  onReply,
  onLike,
  depth = 0,
}: {
  comment: ProjectComment;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className={cn("group", depth > 0 && "ml-12 mt-4")}>
      <div className="flex gap-3">
        <Link to={`/profile/${comment.author.username}`}>
          <Avatar
            src={comment.author.avatar}
            fallback={comment.author.displayName}
            size={depth > 0 ? "sm" : "md"}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${comment.author.username}`}
              className="font-semibold text-surface-900 hover:underline dark:text-surface-50"
            >
              {comment.author.displayName}
            </Link>
            {comment.author.isMaker && (
              <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-[10px]">
                Maker
              </Badge>
            )}
            <span className="text-sm text-surface-400 dark:text-surface-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                comment.isLiked
                  ? "text-rose-500"
                  : "text-surface-400 hover:text-rose-500"
              )}
            >
              <Heart
                className={cn("h-4 w-4", comment.isLiked && "fill-current")}
              />
              {comment.likesCount > 0 && (
                <span>{formatNumber(comment.likesCount)}</span>
              )}
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-sm text-surface-400 hover:text-primary-500 transition-colors"
            >
              <Reply className="h-4 w-4" />
              답글
            </button>
            <button className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="ml-12 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {comment.replies.length}개의 답글 보기
            </button>
          ) : (
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, toggleProjectLike } = useProjectStore();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "team">(
    "overview"
  );
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<ProjectComment[]>(dummyComments);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 프로젝트 찾기 (더미)
  const project = projects[0]; // 임시로 첫 번째 프로젝트 사용
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  // 더미 갤러리 이미지
  const galleryImages = [
    "https://picsum.photos/seed/proj1/800/450",
    "https://picsum.photos/seed/proj2/800/450",
    "https://picsum.photos/seed/proj3/800/450",
  ];

  const handleSubmitComment = () => {
    if (!commentText.trim() || !user) return;

    const newComment: ProjectComment = {
      id: `c${Date.now()}`,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      content: commentText,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments([newComment, ...comments]);
    setCommentText("");
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    isLiked: !r.isLiked,
                    likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );
  };

  const handleReplyComment = (commentId: string) => {
    // TODO: 답글 UI 구현
    console.log("Reply to:", commentId);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header Section */}
            <div className="flex items-start gap-5 mb-6">
              {/* Project Icon */}
              <div className="shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-surface-100 text-5xl ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    categoryInfo?.icon
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
                      {project.title}
                    </h1>
                    <p className="text-lg text-surface-600 dark:text-surface-400">
                      {project.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-surface-500 dark:text-surface-400">
                    {formatNumber(project.backersCount)} followers
                  </span>
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      <Globe className="h-4 w-4" />
                      웹사이트 방문
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
              <span className="text-surface-400">◇</span>
              <Link
                to={`/explore?category=${project.category}`}
                className="text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
              >
                {categoryInfo?.name}
              </Link>
              {project.techStack.map((tech) => (
                <span key={tech} className="flex items-center gap-1">
                  <span className="text-surface-300 dark:text-surface-600">
                    •
                  </span>
                  <span className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 cursor-pointer">
                    {tech}
                  </span>
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                {project.fullDescription || project.shortDescription}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-surface-200 dark:border-surface-800 mb-6">
              <nav className="flex items-center gap-6">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "reviews", label: "Reviews" },
                  { id: "team", label: "Team" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors relative",
                      activeTab === tab.id
                        ? "text-surface-900 dark:text-surface-50"
                        : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                  </button>
                ))}
                <Link
                  to={`/project/${id}/community`}
                  className="pb-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  커뮤니티
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </nav>
            </div>

            {/* Gallery */}
            {activeTab === "overview" && (
              <>
                <div className="mb-8">
                  <div className="relative rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 aspect-video">
                    <img
                      src={galleryImages[currentImageIndex]}
                      alt={`Gallery ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((i) =>
                              i > 0 ? i - 1 : galleryImages.length - 1
                            )
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((i) =>
                              i < galleryImages.length - 1 ? i + 1 : 0
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}
                  </div>
                  {/* Thumbnails */}
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "shrink-0 w-20 h-14 rounded-lg overflow-hidden ring-2 transition-all",
                          currentImageIndex === idx
                            ? "ring-primary-500"
                            : "ring-transparent hover:ring-surface-300 dark:hover:ring-surface-600"
                        )}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Team */}
                <div className="mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-surface-500" />
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                      Launch Team
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {dummyTeam.map((member) => (
                      <Link
                        key={member.id}
                        to={`/profile/${member.username}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Avatar
                          src={member.avatar}
                          fallback={member.displayName}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                            {member.displayName}
                          </p>
                          <p className="text-xs text-surface-500">
                            {member.role}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    댓글 ({comments.length})
                  </h3>

                  {/* Comment Input */}
                  <div className="mb-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
                    <div className="flex gap-3">
                      <Avatar
                        src={user?.avatar}
                        fallback={user?.displayName || "?"}
                        size="md"
                      />
                      <div className="flex-1">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="이 프로젝트에 대한 의견을 남겨주세요..."
                          className="min-h-[80px] resize-none"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!commentText.trim()}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            댓글 작성
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReplyComment}
                        onLike={handleLikeComment}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Team Tab */}
            {activeTab === "team" && (
              <div className="space-y-4">
                {dummyTeam.map((member) => (
                  <Link
                    key={member.id}
                    to={`/profile/${member.username}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
                  >
                    <Avatar
                      src={member.avatar}
                      fallback={member.displayName}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-surface-50">
                        {member.displayName}
                      </p>
                      <p className="text-sm text-surface-500">@{member.username}</p>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        {member.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
                <p className="text-surface-500 dark:text-surface-400">
                  아직 리뷰가 없습니다
                </p>
                <Button variant="outline" className="mt-4">
                  첫 번째 리뷰 작성하기
                </Button>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Upvote Card - Enhanced */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-primary-100 text-sm font-medium">Today's Rank</div>
                      <div className="text-4xl font-bold">#{id || 1}</div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Trophy className="h-7 w-7" />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProjectLike(project.id)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-lg transition-all",
                      project.isLiked
                        ? "bg-white text-primary-600"
                        : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    )}
                  >
                    <ChevronUp className={cn("h-6 w-6", project.isLiked && "text-primary-500")} />
                    {project.isLiked ? "Upvoted" : "Upvote"} • {formatNumber(project.likesCount)}
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(project.backersCount)}
                  </div>
                  <div className="text-[11px] text-surface-500">Supporters</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(project.commentsCount)}
                  </div>
                  <div className="text-[11px] text-surface-500">Comments</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    Active
                  </div>
                  <div className="text-[11px] text-surface-500">Status</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Bookmark className="h-4 w-4" />
                  저장
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Share2 className="h-4 w-4" />
                  공유
                </Button>
              </div>

              {/* Community Preview */}
              <div className="rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 overflow-hidden">
                <div className="p-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary-500" />
                    <span className="font-semibold text-sm text-surface-900 dark:text-surface-50">커뮤니티</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">활발함</span>
                  </div>
                </div>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {/* Recent community posts preview */}
                  <Link to={`/project/${id}/community`} className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium">공지</span>
                      <span className="text-xs text-surface-400">1일 전</span>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                      🎉 v2.0 베타 테스트 시작!
                    </p>
                  </Link>
                  <Link to={`/project/${id}/community`} className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">피드백</span>
                      <span className="text-xs text-surface-400">2일 전</span>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                      다국어 지원 요청 +156 votes
                    </p>
                  </Link>
                  <Link to={`/project/${id}/community`} className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">업데이트</span>
                      <span className="text-xs text-surface-400">3일 전</span>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                      v1.5.2 버그 수정 배포 완료
                    </p>
                  </Link>
                </div>
                <Link
                  to={`/project/${id}/community`}
                  className="block p-3 text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
                >
                  커뮤니티 전체보기 →
                </Link>
              </div>

              {/* Project Info - Enhanced */}
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary-500" />
                  프로젝트 정보
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-surface-500 dark:text-surface-400">런칭일</span>
                    <span className="font-medium text-surface-900 dark:text-surface-50">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-surface-500 dark:text-surface-400">카테고리</span>
                    <span className="font-medium text-surface-900 dark:text-surface-50">
                      {categoryInfo?.icon} {categoryInfo?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-surface-500 dark:text-surface-400">마일스톤</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      2/3 완료
                    </span>
                  </div>
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group"
                    >
                      <span className="text-surface-500 dark:text-surface-400">웹사이트</span>
                      <span className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline flex items-center gap-1">
                        방문하기 <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  )}
                  {project.repositoryUrl && (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group"
                    >
                      <span className="text-surface-500 dark:text-surface-400">GitHub</span>
                      <span className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline flex items-center gap-1">
                        소스코드 <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

