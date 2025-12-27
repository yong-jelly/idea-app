import type { Project } from "@/entities/project";

interface ProjectDescriptionProps {
  project: Pick<Project, "fullDescription" | "shortDescription">;
}

export function ProjectDescription({ project }: ProjectDescriptionProps) {
  return (
    <div className="mb-6">
      <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
        {project.fullDescription || project.shortDescription}
      </p>
    </div>
  );
}




