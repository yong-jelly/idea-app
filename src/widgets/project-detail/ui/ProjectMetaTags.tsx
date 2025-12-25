import { Link } from "react-router";
import { CATEGORY_INFO, type Project } from "@/entities/project";

interface ProjectMetaTagsProps {
  project: Pick<Project, "category" | "techStack" | "createdAt">;
}

export function ProjectMetaTags({ project }: ProjectMetaTagsProps) {
  const categoryInfo = CATEGORY_INFO[project.category];
  const launchDate = new Date(project.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
      <span className="text-surface-400">◇</span>
      <Link
        to={`/explore?category=${project.category}`}
        className="text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
      >
        {categoryInfo?.name}
      </Link>
      {project.techStack.map((tech) => (
        <span key={tech} className="flex items-center gap-1">
          <span className="text-surface-300 dark:text-surface-600">•</span>
          <span className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 cursor-pointer">
            {tech}
          </span>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="text-surface-300 dark:text-surface-600">•</span>
        <span className="text-surface-500 dark:text-surface-400">
          런칭 {launchDate}
        </span>
      </span>
    </div>
  );
}


