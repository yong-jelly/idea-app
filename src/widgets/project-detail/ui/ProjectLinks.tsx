import { Github, Globe, Play } from "lucide-react";
import type { Project } from "@/entities/project";

interface ProjectLinksProps {
  project: Pick<
    Project,
    | "repositoryUrl"
    | "demoUrl"
    | "androidStoreUrl"
    | "iosStoreUrl"
    | "macStoreUrl"
  >;
}

export function ProjectLinks({ project }: ProjectLinksProps) {
  const hasAnyLink =
    project.repositoryUrl ||
    project.demoUrl ||
    project.androidStoreUrl ||
    project.iosStoreUrl ||
    project.macStoreUrl;

  if (!hasAnyLink) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {project.repositoryUrl && (
        <a
          href={project.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          <Github className="h-3 w-3" />
          저장소
        </a>
      )}
      {project.demoUrl && (
        <a
          href={project.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          <Globe className="h-3 w-3" />
          웹사이트
        </a>
      )}
      {project.androidStoreUrl && (
        <a
          href={project.androidStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
        >
          <Play className="h-3 w-3 fill-current" />
          Google Play
        </a>
      )}
      {project.iosStoreUrl && (
        <a
          href={project.iosStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
          <span className="text-[10px]">🍎</span>
          App Store
        </a>
      )}
      {project.macStoreUrl && (
        <a
          href={project.macStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          <span className="text-[10px]">💻</span>
          Mac
        </a>
      )}
    </div>
  );
}

