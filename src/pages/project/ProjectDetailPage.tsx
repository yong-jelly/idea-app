import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router";
import { MessageSquare, ChevronUp, MessageCircle, ArrowRight, Share2, ChevronLeft, ChevronRight, X, Bookmark } from "lucide-react";
import { Button, Avatar } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import { useProjectStore, fetchProjectDetail, toggleProjectBookmark, checkProjectBookmark, type Project, CATEGORY_INFO } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { useProjectComments } from "./hooks/useProjectComments";
import {
  ProjectOverviewTab,
  ProjectTeamTab,
  ProjectLinks,
} from "@/widgets/project-detail";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleProjectLike } = useProjectStore();
  const { user, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "gallery" | "team">(
    "overview"
  );
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

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

      const loadedProject = overview.project;
      
      // 자신의 프로젝트인지 확인
      const isMyProject = user && user.id === loadedProject.author.id;
      
      // 북마크 상태 확인 (인증된 사용자인 경우만)
      if (isAuthenticated && id) {
        // 자신의 프로젝트인 경우 항상 저장됨 상태로 설정
        if (isMyProject) {
          loadedProject.isBookmarked = true;
        } else {
          const { isBookmarked } = await checkProjectBookmark(id);
          loadedProject.isBookmarked = isBookmarked;
        }
      }

      setProject(loadedProject);
      setIsLoading(false);
    };

    loadProject();
  }, [id, isAuthenticated]);

  // 갤러리 이미지 (프로젝트의 gallery_images 사용, 없으면 썸네일 사용)
  const galleryImages =
    project?.galleryImages && project.galleryImages.length > 0
      ? project.galleryImages
      : project?.thumbnail
      ? [project.thumbnail]
      : [];

  // 해시가 #comments인 경우 overview 탭으로 전환
  useEffect(() => {
    if (location.hash === "#comments" && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [location.hash, activeTab]);

  // 댓글 섹션으로 스크롤 (해시가 #comments인 경우)
  useEffect(() => {
    if (location.hash === "#comments" && project && activeTab === "overview" && !isLoading) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        const commentsSection = document.getElementById("comments");
        if (commentsSection) {
          // 헤더 높이를 고려한 오프셋
          const headerOffset = 80;
          const elementPosition = commentsSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 200);
    }
  }, [location.hash, project, activeTab, isLoading]);

  // 회원용 액션 핸들러 (인증 체크)
  const handleAuthenticatedAction = (action: () => void) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }
    action();
  };

  // 저장하기 버튼 핸들러
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }

    if (!project || !id || isBookmarking) {
      return;
    }

    // 자신의 프로젝트인 경우 저장 해제 불가
    const isMyProject = user && user.id === project.author.id;
    if (isMyProject) {
      return;
    }

    setIsBookmarking(true);

    // 낙관적 업데이트
    const previousIsBookmarked = project.isBookmarked || false;
    setProject({
      ...project,
      isBookmarked: !previousIsBookmarked,
    });

    try {
      const { isBookmarked, error: bookmarkError } = await toggleProjectBookmark(id);

      if (bookmarkError) {
        console.error("북마크 토글 실패:", bookmarkError);
        // 에러 발생 시 이전 상태로 롤백
        setProject({
          ...project,
          isBookmarked: previousIsBookmarked,
        });
      } else {
        // 성공 시 서버 응답으로 업데이트
        setProject({
          ...project,
          isBookmarked,
        });
      }
    } catch (err) {
      console.error("북마크 토글 예외:", err);
      // 에러 발생 시 이전 상태로 롤백
      setProject({
        ...project,
        isBookmarked: previousIsBookmarked,
      });
    } finally {
      setIsBookmarking(false);
    }
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
            <div className="mb-8">
              {/* 프로젝트 헤더 */}
              <div className="flex items-start gap-4 mb-4">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-surface-200 dark:ring-surface-700 shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-surface-100 to-surface-50 dark:from-surface-800 dark:to-surface-900 text-3xl ring-1 ring-surface-200 dark:ring-surface-700">
                    {categoryInfo?.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-1">
                    <span>{launchDate} 런칭</span>
                    {isAuthor && (
                      <>
                        <span>·</span>
                        <Link 
                          to={`/project/${project.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          수정하기
                        </Link>
                      </>
                    )}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-semibold text-surface-900 dark:text-surface-50 tracking-tight">
                    {project.title}
                  </h1>
                </div>
              </div>
              
              <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
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
              <nav className="flex items-center gap-1">
                {[
                  { id: "overview", label: "개요" },
                  { id: "gallery", label: "갤러리" },
                  { id: "team", label: "팀" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "relative px-4 py-3 text-sm font-medium transition-all duration-200",
                      activeTab === tab.id
                        ? "text-surface-900 dark:text-white"
                        : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
                    )}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {activeTab === tab.id && (
                      <>
                        <span className="absolute inset-x-1 inset-y-1 rounded-lg bg-surface-100/70 dark:bg-surface-800/50 -z-0" />
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary-500" />
                      </>
                    )}
                  </button>
                ))}
                {/* <Link
                  to={`/project/${id}/community`}
                  className="relative px-4 py-3 text-sm font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300 transition-all duration-200 flex items-center gap-1.5"
                >
                  커뮤니티
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link> */}
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

            {activeTab === "gallery" && (
              <GalleryTab images={galleryImages} />
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
            <div className="sticky top-24 space-y-5">
              {/* Community Card - 메인 CTA */}
              <div className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950/30 dark:to-primary-900/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-white">
                        커뮤니티
                      </h3>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {formatNumber(project.commentsCount)}개의 글
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                    프로젝트에 대한 의견을 나누고, 피드백을 주고받아 보세요.
                  </p>
                  <button
                    onClick={() => navigate(`/project/${id}/community`)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
                  >
                    커뮤니티 참여하기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowSignUpModal(true);
                      return;
                    }
                    toggleProjectLike(project.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all mb-3",
                    project.isLiked
                      ? "bg-primary-500 text-white hover:bg-primary-600 shadow-sm"
                      : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
                  )}
                >
                  <ChevronUp className={cn("h-5 w-5", project.isLiked && "fill-current")} />
                  응원하기
                  <span className="ml-1 text-sm opacity-90">
                    {formatNumber(project.likesCount)}
                  </span>
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleBookmark}
                    disabled={isBookmarking || !!isAuthor}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                      project.isBookmarked
                        ? "border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-400 dark:bg-primary-950/30 dark:text-primary-400 dark:hover:bg-primary-950/50"
                        : "border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800",
                      isAuthor && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <Bookmark className={cn("h-4 w-4", project.isBookmarked && "fill-current")} />
                    {isBookmarking ? "저장 중..." : project.isBookmarked ? "저장됨" : "저장"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // TODO: 토스트 알림
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    공유
                  </button>
                </div>
              </div>

              {/* Tech Stack */}
              {project.techStack.length > 0 && (
                <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
                    기술 스택
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
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

// 갤러리 탭 컴포넌트
function GalleryTab({ images }: { images: string[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
          <MessageSquare className="h-8 w-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
          이미지가 없습니다
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
          프로젝트 이미지가 등록되면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => openLightbox(idx)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-surface-300 dark:hover:ring-surface-600 transition-all hover:shadow-lg"
          >
            <img
              src={img}
              alt={`Gallery ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
          onNext={() => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
          onSelect={setLightboxIndex}
        />
      )}
    </>
  );
}

// Lightbox 컴포넌트
function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  useEffect(() => {
    if (!images.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <span className="text-white/80 text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          title="닫기 (ESC)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Click to close overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Image */}
      <div className="absolute inset-0 flex items-center justify-center p-16 pointer-events-none">
        <img
          src={images[currentIndex]}
          alt={`Gallery ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain pointer-events-auto rounded-lg ring-1 ring-white/10"
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-10"
            title="이전 (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors z-10"
            title="다음 (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(idx);
                }}
                className={cn(
                  "shrink-0 w-16 h-12 rounded-lg overflow-hidden ring-2 transition-all",
                  currentIndex === idx
                    ? "ring-white"
                    : "ring-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

