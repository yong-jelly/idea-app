import { useNavigate } from "react-router";
import { Link } from "react-router";
import { ChevronRight, Star } from "lucide-react";
import { useProjectStore, CATEGORY_INFO } from "@/entities/project";

const MAX_DISPLAY_COUNT = 15;

export function ProjectSection() {
  const navigate = useNavigate();
  
  const {
    savedProjects,
    savedProjectsLoaded,
    savedProjectsLoading,
    loadSavedProjects,
  } = useProjectStore();

  // 저장한 프로젝트 목록 조회 (초기 로드)
  if (!savedProjectsLoaded && !savedProjectsLoading) {
    loadSavedProjects();
  }

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleHeaderClick = () => {
    navigate("/bookmark/project");
  };

  // SQL 함수에서 이미 내가 생성한 프로젝트가 먼저 정렬되어 있음
  // 표시할 프로젝트 목록 (최대 15개)
  const displayProjects = savedProjects.slice(0, MAX_DISPLAY_COUNT);
  const hasMore = savedProjects.length > MAX_DISPLAY_COUNT;

  return (
    <div className="mt-4">
      {/* 헤더 */}
      <button
        onClick={handleHeaderClick}
        className="w-full flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl text-[13px] font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/70 transition-colors group"
      >
        <span>프로젝트</span>
        <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-colors" />
      </button>

      {/* 프로젝트 목록 */}
      {savedProjectsLoading && !savedProjectsLoaded ? (
        <div className="px-2 py-1.5 text-xs text-surface-400 dark:text-surface-500">
          로딩 중...
        </div>
      ) : displayProjects.length > 0 ? (
        <div className="space-y-0.5">
          {displayProjects.map((project) => {
            const categoryInfo = CATEGORY_INFO[project.category];
            const isMyProject = project.isMyProject === true;
            
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
          {hasMore && (
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
  );
}

