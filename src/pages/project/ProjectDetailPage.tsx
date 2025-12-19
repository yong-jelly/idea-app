import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { MessageSquare, Heart, Upload, ChevronUp, Users, MessageCircle, Edit2 } from "lucide-react";
import { Button, Avatar } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { useProjectStore, fetchProjectDetail, type Project, CATEGORY_INFO } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { useProjectComments } from "./hooks/useProjectComments";
import {
  ProjectOverviewTab,
  ProjectTeamTab,
  ProjectGallery,
  ProjectLinks,
} from "@/widgets/project-detail";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toggleProjectLike } = useProjectStore();
  const { user, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "team">(
    "overview"
  );
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // 댓글 관련 로직을 hook으로 분리
  const {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore,
    handleAddComment,
    handleReply,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
    handleRefreshComments,
  } = useProjectComments({
    projectId: id || "",
    projectAuthorId: project?.author.id || "",
    isAuthenticated,
    onSignUpPrompt: () => setShowSignUpModal(true),
  });

  // 프로젝트 상세 조회
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

    loadProject();
  }, [id]);

  // 갤러리 이미지 (프로젝트의 gallery_images 사용, 없으면 썸네일 사용)
  const galleryImages =
    project?.galleryImages && project.galleryImages.length > 0
      ? project.galleryImages
      : project?.thumbnail
      ? [project.thumbnail]
      : [];

  // 회원용 액션 핸들러 (인증 체크)
  const handleAuthenticatedAction = (action: () => void) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }
    action();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!showSignUpModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSignUpModal(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showSignUpModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 불러오는 중...?</p>
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

  const categoryInfo = CATEGORY_INFO[project.category];
  const isAuthor = user && user.id === project.author.id;
  const launchDate = new Date(project.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Content Section */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <main className="lg:col-span-2">
            {/* Title & Meta */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-3">
                <Link
                  to={`/explore?category=${project.category}`}
                  className="hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                >
                  {categoryInfo?.icon} {categoryInfo?.name}
                </Link>
                <span>·</span>
                <span>{launchDate} 런칭</span>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-surface-200 dark:ring-surface-700"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-2xl ring-1 ring-surface-200 dark:ring-surface-700">
                      {categoryInfo?.icon}
                    </div>
                  )}
                  <h1 className="text-3xl font-semibold text-surface-900 dark:text-surface-50 tracking-tight">
                    {project.title}
                  </h1>
                </div>
                {isAuthor && (
                  <Link to={`/project/${project.id}/edit`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-surface-500 hover:text-surface-700">
                      <Edit2 className="h-4 w-4" />
                      수정
                    </Button>
                  </Link>
                )}
              </div>
              
              <p className="mt-2 text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

            {/* Links */}
            <ProjectLinks project={project} />

            {/* Divider */}
            <div className="border-b border-surface-200 dark:border-surface-800 my-8" />

            {/* Host/Author Info */}
            <div className="flex items-center gap-4 mb-8">
              <Link to={`/profile/${project.author.username}`}>
                <Avatar
                  src={project.author.avatar}
                  fallback={project.author.displayName}
                  size="lg"
                  className="ring-2 ring-surface-100 dark:ring-surface-800"
                />
              </Link>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  만든 사람
                </p>
                <Link
                  to={`/profile/${project.author.username}`}
                  className="font-medium text-surface-900 dark:text-surface-50 hover:underline"
                >
                  {project.author.displayName}
                </Link>
              </div>
            </div>

            {/* Description */}
            {project.fullDescription && (
              <div className="mb-8">
                <p className="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
                  {project.fullDescription}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="border-b border-surface-200 dark:border-surface-800 my-8" />

            {/* Tabs */}
            <div className="border-b border-surface-200 dark:border-surface-800 mb-8">
              <nav className="flex items-center gap-8">
                {[
                  { id: "overview", label: "개요" },
                  { id: "team", label: "팀" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "pb-4 text-sm font-medium transition-colors relative",
                      activeTab === tab.id
                        ? "text-surface-900 dark:text-surface-50"
                        : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface-900 dark:bg-surface-50 rounded-full" />
                    )}
                  </button>
                ))}
                <Link
                  to={`/project/${id}/community`}
                  className="pb-4 text-sm font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                >
                  커뮤니티
                </Link>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && project && (
              <ProjectOverviewTab
                project={project}
                galleryImages={[]}
                comments={comments}
                totalComments={totalComments}
                isLoadingComments={isLoadingComments}
                isLoadingMore={isLoadingMoreComments}
                hasMore={hasMore}
                currentUser={user}
                isAuthenticated={isAuthenticated}
                onRefreshComments={handleRefreshComments}
                onLoadMoreComments={handleLoadMoreComments}
                onSignUpPrompt={() => setShowSignUpModal(true)}
                onCreateComment={handleAddComment}
                onReplyComment={handleReply}
                onLikeComment={handleLikeComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
              />
            )}

            {activeTab === "team" && project && (
              <ProjectTeamTab project={project} />
            )}

            {activeTab === "reviews" && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
                <p className="text-surface-500 dark:text-surface-400">
                  아직 리뷰가 없습니다
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleAuthenticatedAction(() => {
                    console.log("리뷰 작성 기능");
                  })}
                >
                  첫 번째 리뷰 작성하기
                </Button>
              </div>
            )}
          </main>

          {/* Sidebar - Sticky */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Action Card */}
              <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6 shadow-sm">
                {/* Upvote Button */}
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowSignUpModal(true);
                      return;
                    }
                    toggleProjectLike(project.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                    project.isLiked
                      ? "bg-primary-500 text-white hover:bg-primary-600"
                      : "bg-surface-900 dark:bg-surface-50 text-white dark:text-surface-900 hover:bg-surface-800 dark:hover:bg-surface-200"
                  )}
                >
                  <ChevronUp className={cn("h-5 w-5", project.isLiked && "fill-current")} />
                  응원하기
                </button>

                {/* Stats */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      응원
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-50">
                      {formatNumber(project.likesCount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      서포터
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-50">
                      {formatNumber(project.backersCount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-500 dark:text-surface-400 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      댓글
                    </span>
                    <span className="font-semibold text-surface-900 dark:text-surface-50">
                      {formatNumber(project.commentsCount)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-b border-surface-200 dark:border-surface-800 my-5" />

                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowSignUpModal(true);
                        return;
                      }
                      console.log("저장 기능");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    저장
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // TODO: 토스트 알림
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    공유
                  </button>
                </div>
              </div>

              {/* Tech Stack */}
              {project.techStack.length > 0 && (
                <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    기술 스택
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    스크린샷
                  </h3>
                  <ProjectGallery images={galleryImages} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}

