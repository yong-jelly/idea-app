import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

interface EditProjectHeaderProps {
  projectId: string;
}

export function EditProjectHeader({ projectId }: EditProjectHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        to={`/project/${projectId}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
          프로젝트 수정
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          프로젝트 정보를 수정하고 저장하세요
        </p>
      </div>
    </div>
  );
}

