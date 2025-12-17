import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { ExternalLink, Share2, Bookmark, MessageSquare, Users, Github, Globe, Play, ChevronLeft, ChevronRight, Megaphone, Info } from "lucide-react";
import { Button, Avatar } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, UpvoteCard, fetchProjectDetail, type Project, fetchProjectComments, createProjectComment, updateProjectComment, deleteProjectComment, toggleProjectCommentLike } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { CommentThread, type CommentNode } from "@/shared/ui/comment";
import { getProfileImageUrl } from "@/shared/lib/storage";

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

const COMMENT_MAX_DEPTH = 3;

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toggleProjectLike } = useProjectStore();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "team">(
    "overview"
  );
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // DB 댓글 데이터를 CommentNode로 변환
  const normalizeComments = (rawComments: RawCommentData[], projectAuthorId: string): CommentNode[] => {
    // 댓글을 트리 구조로 변환
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    // 프로젝트 작성자 ID를 숫자로 변환 (비교를 위해)
    const projectAuthorIdNum = Number(projectAuthorId);

    // 1단계: 모든 댓글을 CommentNode로 변환
    rawComments.forEach((raw) => {
      const isProjectAuthor = raw.author_id === projectAuthorIdNum;
      const comment: CommentNode = {
        id: raw.id,
        author: {
          id: String(raw.author_id),
          username: raw.author_username,
          displayName: raw.author_display_name,
          avatarUrl: raw.author_avatar_url ? getProfileImageUrl(raw.author_avatar_url, "sm") : undefined,
          role: isProjectAuthor ? "Maker" : undefined,
        },
        content: raw.content,
        parentId: raw.parent_id || undefined,
        depth: raw.depth,
        likesCount: raw.likes_count,
        isLiked: raw.is_liked,
        isDeleted: raw.is_deleted,
        images: raw.images && raw.images.length > 0 ? raw.images : undefined,
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

  // 프로젝트 상세 조회 및 댓글 로드
  useEffect(() => {
    if (!id) {
      setError("프로젝트 ID가 필요합니다");
      setIsLoading(false);
      return;
    }

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);

      const { overview, error: fetchError } = await fetchProjectDetail(id);

      if (fetchError) {
        console.error("프로젝트 상세 조회 실패:", fetchError);
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      setProject(overview.project);
      setIsLoading(false);
    };

    const loadComments = async () => {
      setIsLoadingComments(true);
      const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);

      if (commentsError) {
        console.error("댓글 조회 실패:", commentsError);
        setIsLoadingComments(false);
        return;
      }

      if (project) {
        const normalized = normalizeComments(rawComments, project.author.id);
        setComments(normalized);
      }
      setIsLoadingComments(false);
    };

    loadProject();
    loadComments();
  }, [id]);

  // 프로젝트가 로드된 후 댓글 다시 로드
  useEffect(() => {
    if (project && id) {
      const loadComments = async () => {
        setIsLoadingComments(true);
        const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);

        if (commentsError) {
          console.error("댓글 조회 실패:", commentsError);
          setIsLoadingComments(false);
          return;
        }

        const normalized = normalizeComments(rawComments, project.author.id);
        setComments(normalized);
        setIsLoadingComments(false);
      };

      loadComments();
    }
  }, [project]);

  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  // 갤러리 이미지 (프로젝트의 gallery_images 사용, 없으면 썸네일 사용)
  const galleryImages = project?.galleryImages && project.galleryImages.length > 0
    ? project.galleryImages
    : project?.thumbnail
    ? [project.thumbnail]
    : [];

  const handleAddComment = async (content: string, images: string[]) => {
    if (!content.trim() || !id || !project) return;

    const { error } = await createProjectComment(id, content, undefined, images);

    if (error) {
      console.error("댓글 생성 실패:", error);
      alert(error.message);
      return;
    }

    // 댓글 목록 다시 로드
    const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);
    if (!commentsError && rawComments) {
      const normalized = normalizeComments(rawComments, project.author.id);
      setComments(normalized);
    }
  };

  const handleReply = async (parentId: string, content: string, images: string[]) => {
    if (!content.trim() || !id || !project) return;

    const { error } = await createProjectComment(id, content, parentId, images);

    if (error) {
      console.error("답글 생성 실패:", error);
      alert(error.message);
      return;
    }

    // 댓글 목록 다시 로드
    const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);
    if (!commentsError && rawComments) {
      const normalized = normalizeComments(rawComments, project.author.id);
      setComments(normalized);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const { isLiked, likesCount, error } = await toggleProjectCommentLike(commentId);

    if (error) {
      console.error("댓글 좋아요 토글 실패:", error);
      alert(error.message);
      return;
    }

    // 로컬 상태 업데이트
    const updateLike = (items: CommentNode[]): CommentNode[] =>
      items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked,
            likesCount,
          };
        }
        if (item.replies) {
          return { ...item, replies: updateLike(item.replies) };
        }
        return item;
      });
    setComments((prev) => updateLike(prev));
  };

  const handleEditComment = async (commentId: string, content: string, images: string[]) => {
    if (!content.trim()) return;

    const { error } = await updateProjectComment(commentId, content, images);

    if (error) {
      console.error("댓글 수정 실패:", error);
      alert(error.message);
      return;
    }

    // 댓글 목록 다시 로드
    if (id && project) {
      const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);
      if (!commentsError && rawComments) {
        const normalized = normalizeComments(rawComments, project.author.id);
        setComments(normalized);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const { success, error } = await deleteProjectComment(commentId);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      alert(error.message);
      return;
    }

    if (success) {
      // 댓글 목록 다시 로드
      if (id && project) {
        const { comments: rawComments, error: commentsError } = await fetchProjectComments(id);
        if (!commentsError && rawComments) {
          const normalized = normalizeComments(rawComments, project.author.id);
          setComments(normalized);
        }
      }
    }
  };

  const countAllComments = (items: CommentNode[]): number =>
    items.reduce((acc, c) => acc + 1 + (c.replies ? countAllComments(c.replies) : 0), 0);
  const totalComments = countAllComments(comments);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">{error || "프로젝트를 찾을 수 없습니다."}</p>
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

                {/* Links */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {project.repositoryUrl ? (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                    >
                      <Github className="h-3 w-3" />
                      저장소
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-2 py-1 text-xs text-surface-300 dark:bg-surface-900 dark:text-surface-600 cursor-not-allowed">
                      <Github className="h-3 w-3" />
                      저장소
                    </span>
                  )}
                  {project.demoUrl ? (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                    >
                      <Globe className="h-3 w-3" />
                      웹사이트
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-2 py-1 text-xs text-surface-300 dark:bg-surface-900 dark:text-surface-600 cursor-not-allowed">
                      <Globe className="h-3 w-3" />
                      웹사이트
                    </span>
                  )}
                  {project.androidStoreUrl ? (
                    <a
                      href={project.androidStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Google Play
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-2 py-1 text-xs text-surface-300 dark:bg-surface-900 dark:text-surface-600 cursor-not-allowed">
                      <Play className="h-3 w-3" />
                      Google Play
                    </span>
                  )}
                  {project.iosStoreUrl ? (
                    <a
                      href={project.iosStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      <span className="text-[10px]">🍎</span>
                      App Store
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-2 py-1 text-xs text-surface-300 dark:bg-surface-900 dark:text-surface-600 cursor-not-allowed grayscale">
                      <span className="text-[10px]">🍎</span>
                      App Store
                    </span>
                  )}
                  {project.macStoreUrl ? (
                    <a
                      href={project.macStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                    >
                      <span className="text-[10px]">💻</span>
                      Mac
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-2 py-1 text-xs text-surface-300 dark:bg-surface-900 dark:text-surface-600 cursor-not-allowed grayscale">
                      <span className="text-[10px]">💻</span>
                      Mac
                    </span>
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
                  { id: "overview", label: "개요" },
                  { id: "reviews", label: "리뷰" },
                  { id: "team", label: "팀" },
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

                {/* 팀 */}
                <div className="mb-8 p-4 rounded-lg bg-surface-50/50 dark:bg-surface-900/50 ring-1 ring-surface-100 dark:ring-surface-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-surface-400" />
                    <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">
                      팀
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
                    댓글 ({totalComments})
                  </h3>

                  {isLoadingComments ? (
                    <div className="mb-6 p-4 rounded-xl bg-white dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center text-surface-500">
                      댓글을 불러오는 중...
                    </div>
                  ) : (
                    <div className="mb-6 p-4 rounded-xl bg-white dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
                      <CommentThread
                        comments={comments}
                        currentUser={
                          user
                            ? {
                                id: user.id,
                                username: user.username,
                                displayName: user.displayName,
                                avatarUrl: user.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined,
                              }
                            : { id: "guest", displayName: "게스트" }
                        }
                        currentUserId={user?.id}
                        maxDepth={COMMENT_MAX_DEPTH}
                        enableAttachments={false}
                        maxImages={0}
                        isAuthenticated={!!user}
                        onCreate={handleAddComment}
                        onReply={handleReply}
                        onLike={handleLikeComment}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                      />
                    </div>
                  )}
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
              {/* Upvote Card */}
              <UpvoteCard
                rank={Number(id) || 1}
                upvoteCount={project.likesCount}
                isUpvoted={project.isLiked}
                onUpvote={() => toggleProjectLike(project.id)}
              />

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(project.backersCount)}
                  </div>
                  <div className="text-[11px] text-surface-500">서포터</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(project.commentsCount)}
                  </div>
                  <div className="text-[11px] text-surface-500">댓글</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
                  <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(project.likesCount)}
                  </div>
                  <div className="text-[11px] text-surface-500">저장됨</div>
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

