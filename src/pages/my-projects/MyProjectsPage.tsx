import { Link } from "react-router";
import { PlusCircle, Settings, BarChart3 } from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import { LeftSidebar } from "@/widgets";
import { useProjectStore } from "@/entities/project";
import { useUserStore } from "@/entities/user";

export function MyProjectsPage() {
  const { projects } = useProjectStore();
  const { user } = useUserStore();

  // 내가 만든 프로젝트만 필터링 (데모용으로 처음 2개)
  const myProjects = projects.slice(0, 2);

  return (
    <div className="mx-auto flex max-w-5xl">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="h-[53px] flex items-center justify-between px-4">
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              내 프로젝트
            </h1>
            <Link to="/create-project">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                새 프로젝트
              </Button>
            </Link>
          </div>
        </div>

        {/* Projects List */}
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {myProjects.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <PlusCircle className="h-8 w-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
                아직 등록한 프로젝트가 없습니다
              </h3>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                첫 번째 프로젝트를 등록하고 사용자들과 소통해보세요
              </p>
              <Link to="/create-project">
                <Button className="mt-4 gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  프로젝트 등록하기
                </Button>
              </Link>
            </div>
          ) : (
            myProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Project Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-xl">
                    {project.icon || "📦"}
                  </div>

                  {/* Project Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/project/${project.id}`}
                        className="font-semibold text-surface-900 dark:text-surface-50 hover:underline"
                      >
                        {project.title}
                      </Link>
                      <Badge variant={project.status === "active" ? "default" : "secondary"}>
                        {project.status === "active" ? "활성" : "개발 중"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                      <span>{project.supportersCount} 구독자</span>
                      <span>{project.likesCount} 응원</span>
                      <span>{project.commentsCount} 피드백</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/project/${project.id}`}>
                      <Button variant="ghost" size="icon">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

