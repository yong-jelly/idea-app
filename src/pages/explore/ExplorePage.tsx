import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui";
import { useProjectStore } from "@/entities/project";
import { ProjectListItem } from "@/entities/project/ui/ProjectListItem";

export function ExplorePage() {
  const { projects, toggleProjectLike } = useProjectStore();

  // 섹션별 분류
  const featuredProjects = projects.filter((p) => p.featured);
  const trendingProjects = projects.slice().sort((a, b) => b.likesCount - a.likesCount);
  const recentProjects = projects.slice().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl">
        {/* Featured Section */}
        {featuredProjects.length > 0 && (
          <section>
            <div className="px-4 pt-6 pb-3">
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                주목할 프로젝트
              </h2>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
              {featuredProjects.map((project, index) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  onUpvote={toggleProjectLike}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section>
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
        </section>

        {/* Newsletter CTA */}
        <div className="mx-4 my-8 flex items-center gap-4 rounded-xl bg-surface-50 dark:bg-surface-900 p-4 ring-1 ring-surface-200/60 dark:ring-surface-800">
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
        </div>

        {/* Recent Section */}
        <section>
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
        </section>

        {/* More Button */}
        <div className="px-4 py-8">
          <Button variant="outline" className="w-full">
            모든 프로젝트 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
