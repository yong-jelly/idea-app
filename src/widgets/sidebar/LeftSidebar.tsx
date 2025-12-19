import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Home, Bookmark, ChevronRight, Star } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PostComposerModal } from "@/features/feed";
import { useUserStore } from "@/entities/user";
import { useProjectStore, CATEGORY_INFO } from "@/entities/project";

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "북마크", href: "/bookmarks", icon: Bookmark },
];

export function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const { user, isAuthenticated } = useUserStore();
  
  // zustand store에서 프로젝트 상태 가져오기
  const {
    savedProjects,
    savedProjectsLoaded,
    savedProjectsLoading,
    loadSavedProjects,
    clearSavedProjects,
    myProjects,
    myProjectsLoaded,
    myProjectsLoading,
    loadMyProjects,
    clearMyProjects,
  } = useProjectStore();

  // 저장한 프로젝트 목록 조회 (초기 로드)
  useEffect(() => {
    if (!isAuthenticated) {
      clearSavedProjects();
      return;
    }

    if (!savedProjectsLoaded) {
      loadSavedProjects();
    }
  }, [isAuthenticated, savedProjectsLoaded, loadSavedProjects, clearSavedProjects]);

  // 내 프로젝트 목록 조회 (초기 로드)
  useEffect(() => {
    if (!isAuthenticated) {
      clearMyProjects();
      return;
    }

    if (!myProjectsLoaded) {
      loadMyProjects();
    }
  }, [isAuthenticated, myProjectsLoaded, loadMyProjects, clearMyProjects]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleBookmarksHeaderClick = () => {
    navigate("/bookmark/project");
  };

  const handleMyProjectsHeaderClick = () => {
    navigate("/my-projects");
  };

  // 내가 북마크한 프로젝트 중 내가 생성한 프로젝트 제외
  const bookmarkedProjects = savedProjects.filter(
    (project) => !myProjects.some((myProject) => myProject.id === project.id)
  );

  // 사이드바에 표시할 북마크 프로젝트 (최대 5개)
  const displayBookmarkedProjects = bookmarkedProjects.slice(0, 5);

  return (
    <>
      <aside className="sticky top-16 h-[calc(100vh-4rem)] w-[260px] shrink-0 overflow-y-auto pt-4 pb-6 px-4">
        {/* 메인 네비게이션 */}
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 shadow-sm"
                    : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/70"
                )}
              >
                <Icon className={cn(
                  "h-[18px] w-[18px] transition-colors", 
                  isActive 
                    ? "text-primary-600 dark:text-primary-400" 
                    : "text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 구분선 */}
        {isAuthenticated && (
          <div className="my-4 border-t border-surface-200 dark:border-surface-800" />
        )}

        {/* 프로젝트 섹션 (북마크한 프로젝트 전체) */}
        {isAuthenticated && (
          <div className="mt-4">
            {/* 헤더 */}
            <button
              onClick={handleBookmarksHeaderClick}
              className="w-full flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl text-[13px] font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
            >
              <span>프로젝트</span>
              <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-colors" />
            </button>

            {/* 북마크한 프로젝트 목록 */}
            {savedProjectsLoading && !savedProjectsLoaded ? (
              <div className="px-2 py-1.5 text-xs text-surface-400 dark:text-surface-500">
                로딩 중...
              </div>
            ) : savedProjects.length > 0 ? (
              <div className="space-y-0.5">
                {savedProjects.slice(0, 10).map((project) => {
                  const isMyProject = user && user.id === project.author.id;
                  const categoryInfo = CATEGORY_INFO[project.category];
                  
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
                    >
                      {/* 프로젝트 아이콘/썸네일 */}
                      <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-surface-100 dark:bg-surface-800 text-sm ring-1 ring-surface-200/50 dark:ring-surface-700/50 overflow-hidden">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{categoryInfo?.icon || "📦"}</span>
                        )}
                      </div>
                      
                      {/* 프로젝트 제목 */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        {isMyProject && (
                          <Star className="h-3 w-3 text-primary-500 fill-primary-500 shrink-0" />
                        )}
                        <span className="text-[13px] font-medium text-surface-700 dark:text-surface-300 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {project.title}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* 더 보기 버튼 */}
                {savedProjects.length > 10 && (
                  <Link
                    to="/bookmark/project"
                    className="block px-2 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    더 보기 →
                  </Link>
                )}
              </div>
            ) : (
              <div className="px-2 py-1.5 text-xs text-surface-400 dark:text-surface-500">
                저장한 프로젝트가 없습니다
              </div>
            )}
          </div>
        )}

        {/* 구분선 */}
        {isAuthenticated && (myProjects.length > 0 || displayBookmarkedProjects.length > 0) && (
          <div className="my-4 border-t border-surface-200 dark:border-surface-800" />
        )}

        {/* 내 프로젝트 섹션 */}
        {isAuthenticated && (myProjects.length > 0 || displayBookmarkedProjects.length > 0) && (
          <div className="mt-4">
            {/* 헤더 */}
            <button
              onClick={handleMyProjectsHeaderClick}
              className="w-full flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl text-[13px] font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
            >
              <span>내 프로젝트</span>
              <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-colors" />
            </button>

            {/* 내가 생성한 프로젝트 목록 */}
            {myProjectsLoading && !myProjectsLoaded ? (
              <div className="px-2 py-1.5 text-xs text-surface-400 dark:text-surface-500">
                로딩 중...
              </div>
            ) : (
              <>
                {myProjects.length > 0 && (
                  <div className="space-y-0.5 mb-2">
                    {myProjects.slice(0, 5).map((project) => {
                      const categoryInfo = CATEGORY_INFO[project.category];
                      
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleProjectClick(project.id)}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
                        >
                          {/* 프로젝트 아이콘/썸네일 */}
                          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-surface-100 dark:bg-surface-800 text-sm ring-1 ring-surface-200/50 dark:ring-surface-700/50 overflow-hidden">
                            {project.thumbnail ? (
                              <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">{categoryInfo?.icon || "📦"}</span>
                            )}
                          </div>
                          
                          {/* 프로젝트 제목 */}
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <Star className="h-3 w-3 text-primary-500 fill-primary-500 shrink-0" />
                            <span className="text-[13px] font-medium text-surface-700 dark:text-surface-300 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {project.title}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 내가 북마크한 프로젝트 목록 (내 프로젝트 제외) */}
                {displayBookmarkedProjects.length > 0 && (
                  <div className="space-y-0.5">
                    {displayBookmarkedProjects.map((project) => {
                      const categoryInfo = CATEGORY_INFO[project.category];
                      
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleProjectClick(project.id)}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
                        >
                          {/* 프로젝트 아이콘/썸네일 */}
                          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-surface-100 dark:bg-surface-800 text-sm ring-1 ring-surface-200/50 dark:ring-surface-700/50 overflow-hidden">
                            {project.thumbnail ? (
                              <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">{categoryInfo?.icon || "📦"}</span>
                            )}
                          </div>
                          
                          {/* 프로젝트 제목 */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-surface-700 dark:text-surface-300 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {project.title}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {/* Post Composer Modal */}
      <PostComposerModal 
        open={isComposerOpen} 
        onOpenChange={setIsComposerOpen} 
      />
    </>
  );
}
