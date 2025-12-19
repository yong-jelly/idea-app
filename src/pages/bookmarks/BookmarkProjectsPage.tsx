import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import { LeftSidebar } from "@/widgets";
import { fetchSavedProjects, type Project } from "@/entities/project";
import { ProjectListItem } from "@/entities/project/ui/ProjectListItem";
import { useProjectStore } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { ProjectsLoading } from "@/shared/ui/ProjectsLoading";

export function BookmarkProjectsPage() {
  const { toggleProjectLike } = useProjectStore();
  const { isAuthenticated, user } = useUserStore();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 저장한 프로젝트 목록 조회
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      const { projects: savedProjects, error: fetchError } = await fetchSavedProjects({
        limit: 50,
        offset: 0,
      });

      if (fetchError) {
        console.error("저장한 프로젝트 조회 실패:", fetchError);
        setError(fetchError.message);
      } else {
        setProjects(savedProjects);
        setHasMore(savedProjects.length === 50);
        setOffset(savedProjects.length);
      }

      setIsLoading(false);
    };

    loadProjects();
  }, [isAuthenticated]);

  // 더 보기 로드
  const loadMore = async () => {
    if (!isAuthenticated || isLoading || !hasMore) return;

    setIsLoading(true);
    const { projects: moreProjects, error: fetchError } = await fetchSavedProjects({
      limit: 50,
      offset,
    });

    if (fetchError) {
      console.error("추가 프로젝트 조회 실패:", fetchError);
      setIsLoading(false);
      return;
    }

    setProjects((prev) => [...prev, ...moreProjects]);
    setHasMore(moreProjects.length === 50);
    setOffset((prev) => prev + moreProjects.length);
    setIsLoading(false);
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

  // 비회원이면 로그인 모달 표시
  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
          <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
            <div className="h-[53px] flex items-center px-4">
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                저장한 프로젝트
              </h1>
            </div>
          </div>
          <div className="py-16 text-center">
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
              로그인이 필요합니다
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              저장한 프로젝트를 보려면 로그인해주세요
            </p>
          </div>
        </main>
        <SignUpModal
          open={showSignUpModal}
          onOpenChange={setShowSignUpModal}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Header */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
          <div className="h-[53px] flex items-center px-4">
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              저장한 프로젝트
            </h1>
          </div>
        </div>

        {/* Projects List */}
        {isLoading && projects.length === 0 ? (
          <ProjectsLoading />
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-surface-500 dark:text-surface-400">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <Bookmark className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
              저장한 프로젝트가 없습니다
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              관심 있는 프로젝트를 저장하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {projects.map((project, index) => {
                // 내 프로젝트인지 확인
                const isMyProject = user && user.id === project.author.id;
                return (
                  <ProjectListItem
                    key={project.id}
                    project={{
                      ...project,
                      isMyProject,
                    }}
                    rank={index + 1}
                    onUpvote={() => toggleProjectLike(project.id)}
                  />
                );
              })}
            </div>
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "로딩 중..." : "더 보기"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}

