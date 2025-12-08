import { Bookmark } from "lucide-react";
import { LeftSidebar } from "@/widgets";
import { useProjectStore } from "@/entities/project";
import { ProjectListItem } from "@/entities/project/ui/ProjectListItem";

export function BookmarksPage() {
  const { projects, toggleProjectLike } = useProjectStore();

  // 북마크한 프로젝트만 필터링 (데모용으로 isLiked가 true인 것)
  const bookmarkedProjects = projects.filter((p) => p.isLiked);

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="h-[53px] flex items-center px-4">
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              북마크
            </h1>
          </div>
        </div>

        {/* Bookmarked Projects */}
        {bookmarkedProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
              <Bookmark className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
              저장한 프로젝트가 없습니다
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              관심 있는 프로젝트를 북마크하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
            {bookmarkedProjects.map((project, index) => (
              <ProjectListItem
                key={project.id}
                project={project}
                rank={index + 1}
                onUpvote={toggleProjectLike}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

