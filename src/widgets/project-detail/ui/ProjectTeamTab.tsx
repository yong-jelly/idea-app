import { Link } from "react-router";
import { Avatar, Badge } from "@/shared/ui";
import type { Project } from "@/entities/project";

interface ProjectTeamTabProps {
  project: Project;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  return (
    <div className="space-y-4">
      <Link
        to={`/profile/${project.author.username}`}
        className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
      >
        <Avatar
          src={project.author.avatar}
          fallback={project.author.displayName}
          size="lg"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-surface-900 dark:text-surface-50">
              {project.author.displayName}
            </p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Maker
            </Badge>
          </div>
          <p className="text-sm text-surface-500">@{project.author.username}</p>
        </div>
      </Link>
    </div>
  );
}




