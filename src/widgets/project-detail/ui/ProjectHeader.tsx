import { Link } from "react-router";
import { Edit2 } from "lucide-react";
import { CATEGORY_INFO, type Project } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { ProjectLinks } from "./ProjectLinks";
import { Button } from "@/shared/ui";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const categoryInfo = CATEGORY_INFO[project.category];
  const { user } = useUserStore();
  const isAuthor = user && user.id === project.author.id;

  return (
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {project.title}
              </h1>
              {isAuthor && (
                <Link to={`/project/${project.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    수정
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              {project.shortDescription}
            </p>
          </div>
        </div>

        {/* Links */}
        <ProjectLinks project={project} />
      </div>
    </div>
  );
}

