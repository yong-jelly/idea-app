import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { MessageSquare, Github, Globe, Play, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, fetchProjectDetail, type Project } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { useProjectComments } from "./hooks/useProjectComments";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ProjectOverviewTab } from "./components/ProjectOverviewTab";
import { ProjectTeamTab } from "./components/ProjectTeamTab";

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

  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

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
                  // { id: "reviews", label: "리뷰" },
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

            {/* Tab Content */}
            {activeTab === "overview" && project && (
              <ProjectOverviewTab
                project={project}
                galleryImages={galleryImages}
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

            {/* Reviews Tab */}
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
                    // TODO: 리뷰 작성 기능 구현
                    console.log("리뷰 작성 기능");
                  })}
                >
                  첫 번째 리뷰 작성하기
                </Button>
              </div>
            )}
          </main>

          {/* Sidebar */}
          {project && id && (
            <ProjectSidebar
              project={project}
              projectId={id}
              onUpvote={() => {
                if (!isAuthenticated) {
                  setShowSignUpModal(true);
                  return;
                }
                toggleProjectLike(project.id);
              }}
              onBookmark={() => {
                if (!isAuthenticated) {
                  setShowSignUpModal(true);
                  return;
                }
                // TODO: 저장 기능 구현
                console.log("저장 기능");
              }}
              onShare={() => {
                if (!isAuthenticated) {
                  setShowSignUpModal(true);
                  return;
                }
                // TODO: 공유 기능 구현
                console.log("공유 기능");
              }}
            />
          )}
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

