import { useEffect, useState, useMemo } from "react";
import { useProjectStore, fetchProjects, type Project } from "@/entities/project";
import { ProjectListItem } from "@/entities/project/ui/ProjectListItem";
import { ProjectsLoading } from "@/shared/ui/ProjectsLoading";
import { ensureMinDelay, type MinLoadingDelay } from "@/shared/lib/utils";

interface ExplorePageProps {
  /** 최소 로딩 지연 시간 (기본값: { min: 300, max: 1000 }) */
  minLoadingDelay?: MinLoadingDelay | null;
}

export function ExplorePage({ minLoadingDelay }: ExplorePageProps = {}) {
  const { toggleProjectLike } = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // minLoadingDelay를 메모이제이션하여 무한 루프 방지
  // ExplorePage는 0.8초 ~ 1.5초 지연 시간 사용
  const delayConfig = useMemo(
    () => minLoadingDelay ?? { min: 800, max: 1500 },
    [minLoadingDelay]
  );

  // 전체 프로젝트 조회
  useEffect(() => {
    const loadProjects = async () => {
      const startTime = Date.now();
      setIsLoading(true);
      setError(null);

      const { projects: fetchedProjects, error: fetchError } = await fetchProjects({
        featured: undefined, // 전체 프로젝트 조회
        limit: 50,
        orderBy: "created_at",
        orderDirection: "desc",
      });

      if (fetchError) {
        console.error("프로젝트 목록 조회 실패:", fetchError);
        setError(fetchError.message);
      } else {
        setProjects(fetchedProjects);
      }

      // 최소 지연 시간 보장
      await ensureMinDelay(startTime, delayConfig);

      setIsLoading(false);
    };

    loadProjects();
  }, []); // 의존성 배열을 비워서 마운트 시 한 번만 실행

  // TODO: 인기 프로젝트 섹션 (커뮤니티 구현 후)
  // const trendingProjects = projects.slice().sort((a, b) => b.likesCount - a.likesCount);

  // TODO: 최신 프로젝트 섹션 (커뮤니티 구현 후)
  // const recentProjects = projects.slice().sort((a, b) => 
  //   new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  // );

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl">
        {/* 전체 프로젝트 섹션 */}
        <section>
          <div className="px-4 pt-6 pb-3">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              프로젝트
            </h2>
          </div>
          {isLoading ? (
            <ProjectsLoading count={5} />
          ) : error ? (
            <div className="px-4 py-8 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : projects.length > 0 ? (
            <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
              {projects.map((project, index) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  onUpvote={toggleProjectLike}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-surface-500 dark:text-surface-400">
              프로젝트가 없습니다.
            </div>
          )}
        </section>

        {/* TODO: 인기 프로젝트 섹션 (커뮤니티 구현 후 추가) */}
        {/* <section>
          <div className="px-4 pt-8 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              인기 프로젝트
            </h2>
            <Link
              to="/explore?sort=trending"
              className="flex items-center gap-0.5 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
            >
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
            {trendingProjects.slice(0, 5).map((project, index) => (
              <ProjectListItem
                key={project.id}
                project={project}
                rank={index + 1}
                onUpvote={toggleProjectLike}
              />
            ))}
          </div>
        </section> */}

        {/* TODO: Newsletter CTA (구현 예정) */}
        {/* <div className="mx-4 my-8 flex items-center gap-4 rounded-xl bg-surface-50 dark:bg-surface-900 p-4 ring-1 ring-surface-200/60 dark:ring-surface-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700">
            <span className="text-xl">📬</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
              1DD의 새 프로젝트 소식을 받아보세요
            </p>
          </div>
          <Button variant="outline" size="sm">
            구독하기
          </Button>
        </div> */}

        {/* TODO: 최신 프로젝트 섹션 (커뮤니티 구현 후 추가) */}
        {/* <section>
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              최신 프로젝트
            </h2>
            <Link
              to="/explore?sort=newest"
              className="flex items-center gap-0.5 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
            >
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
            {recentProjects.slice(0, 5).map((project, index) => (
              <ProjectListItem
                key={project.id}
                project={project}
                rank={index + 1}
                onUpvote={toggleProjectLike}
              />
            ))}
          </div>
        </section> */}

        {/* TODO: 모든 프로젝트 보기 버튼 (전체 목록 페이지 구현 후) */}
        {/* <div className="px-4 py-8">
          <Button variant="outline" className="w-full">
            모든 프로젝트 보기
          </Button>
        </div> */}
      </div>
    </div>
  );
}
