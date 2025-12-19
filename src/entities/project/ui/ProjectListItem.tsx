import { Link } from "react-router";
import { MessageSquare, ChevronUp } from "lucide-react";
import { cn, formatNumber } from "@/shared/lib/utils";
import { CATEGORY_INFO, type Project } from "../model/project.types";

export interface ProjectListItemProps {
  project: Project;
  rank?: number;
  onUpvote?: (projectId: string) => void;
}

export function ProjectListItem({ project, rank, onUpvote }: ProjectListItemProps) {
  const categoryInfo = CATEGORY_INFO[project.category];

  return (
    <div className="group flex items-start gap-4 py-5 px-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/40">
      {/* Icon/Thumbnail */}
      <Link to={`/project/${project.id}`} className="shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-3xl ring-1 ring-surface-200/50 transition-transform group-hover:scale-[1.02] dark:bg-surface-800 dark:ring-surface-700/50">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            categoryInfo.icon
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to={`/project/${project.id}`}
            className="font-semibold text-surface-900 hover:underline dark:text-surface-50"
          >
            {rank !== undefined && (
              <span className="text-surface-500 dark:text-surface-400">{rank}. </span>
            )}
            {project.title}
          </Link>
          {project.featured && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-medium">
              Featured
            </span>
          )}
          {project.isMyProject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-medium">
              내 프로젝트
            </span>
          )}
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mb-2">
          {project.shortDescription}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-surface-500 dark:text-surface-500">
          <span className="text-surface-400 dark:text-surface-600">◇</span>
          <Link 
            to={`/explore?category=${project.category}`} 
            className="hover:text-surface-900 dark:hover:text-surface-200 transition-colors"
          >
            {categoryInfo.name}
          </Link>
          {project.techStack.slice(0, 2).map((tech) => (
            <span key={tech} className="flex items-center gap-1.5">
              <span className="text-surface-300 dark:text-surface-600">·</span>
              <span className="hover:text-surface-900 dark:hover:text-surface-200 cursor-pointer transition-colors">
                {tech}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {/* Comments */}
        <div className={cn(
          "flex flex-col items-center justify-center min-w-[52px] h-14 rounded-lg border transition-colors",
          "border-surface-200 bg-white hover:border-surface-300",
          "dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600"
        )}>
          <MessageSquare className="h-4 w-4 text-surface-400 dark:text-surface-500 mb-0.5" />
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
            {formatNumber(project.commentsCount)}
          </span>
        </div>

        {/* Upvote */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onUpvote?.(project.id);
          }}
          className={cn(
            "flex flex-col items-center justify-center min-w-[52px] h-14 rounded-lg border transition-all",
            "border-surface-200 bg-white hover:border-primary-400 hover:bg-primary-50",
            "dark:border-surface-700 dark:bg-surface-800 dark:hover:border-primary-500 dark:hover:bg-primary-950/50"
          )}
        >
          <ChevronUp className="h-4 w-4 text-primary-500 dark:text-primary-400 -mb-0.5" />
          <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {formatNumber(project.likesCount)}
          </span>
        </button>
      </div>
    </div>
  );
}
