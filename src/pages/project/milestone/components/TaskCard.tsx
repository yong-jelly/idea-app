import { Calendar, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { Button, Card, CardContent } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import type { MilestoneTask } from "@/entities/project";

interface TaskCardProps {
  task: MilestoneTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDueLabel: (dueDate?: string) => { label: string; isOverdue: boolean } | null;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  getDueLabel,
}: TaskCardProps) {
  const taskDueLabel = getDueLabel(task.dueDate);
  const isCompleted = task.status === "done";

  return (
    <Card
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group",
        isCompleted && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              isCompleted
                ? "bg-emerald-500 border-emerald-500"
                : "border-surface-300 hover:border-primary-400 dark:border-surface-600"
            )}
          >
            {isCompleted && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={cn(
                    "font-medium",
                    isCompleted
                      ? "text-surface-500 line-through dark:text-surface-500"
                      : "text-surface-900 dark:text-surface-50"
                  )}
                >
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-7 w-7 p-0 text-surface-400 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {task.dueDate && !isCompleted && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-xs",
                  taskDueLabel?.isOverdue ? "text-rose-500" : "text-surface-400"
                )}
              >
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
                {taskDueLabel && (
                  <span className={taskDueLabel.isOverdue ? "text-rose-500" : ""}>
                    ({taskDueLabel.label})
                  </span>
                )}
              </div>
            )}
            {isCompleted && task.completedAt && (
              <div className="flex items-center gap-1 mt-2 text-xs text-surface-400">
                <CheckCircle2 className="h-3 w-3" />
                {formatRelativeTime(task.completedAt)}에 완료
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

