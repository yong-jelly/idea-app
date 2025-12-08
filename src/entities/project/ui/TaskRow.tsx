import { CheckCircle2, Calendar, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, Button } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import type { MilestoneTask } from "../model/project.types";

export interface TaskRowProps {
  /** 태스크 데이터 */
  task: MilestoneTask;
  /** 완료 토글 핸들러 */
  onToggle?: () => void;
  /** 수정 핸들러 */
  onEdit?: () => void;
  /** 삭제 핸들러 */
  onDelete?: () => void;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 액션 버튼 표시 여부 */
  showActions?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 태스크 Row 컴포넌트
 * 
 * 마일스톤 상세 페이지에서 각 태스크를 표시하는 Row 컴포넌트입니다.
 * 완료 토글, 수정, 삭제 기능을 지원합니다.
 */
export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
  compact = false,
}: TaskRowProps) {
  const isDone = task.status === "done";

  const getDueLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
    if (diffDays === 0) return { label: "오늘", isOverdue: false };
    return { label: `D-${diffDays}`, isOverdue: false };
  };

  const dueLabel = getDueLabel(task.dueDate);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
          "hover:bg-surface-50/50 dark:hover:bg-surface-800/30",
          isDone && "opacity-60",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
            isDone
              ? "bg-emerald-500 text-white"
              : "border-2 border-surface-300 hover:border-primary-400 dark:border-surface-600"
          )}
        >
          {isDone && <CheckCircle2 className="h-2.5 w-2.5" />}
        </button>

        {/* Title */}
        <span className={cn(
          "flex-1 text-sm truncate",
          isDone
            ? "text-surface-500 line-through"
            : "text-surface-700 dark:text-surface-300"
        )}>
          {task.title}
        </span>

        {/* Due Date */}
        {task.dueDate && !isDone && (
          <span className={cn(
            "text-xs shrink-0",
            dueLabel?.isOverdue ? "text-rose-500" : "text-surface-400"
          )}>
            {dueLabel?.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group",
        isDone && "opacity-60",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
              isDone
                ? "bg-emerald-500 text-white"
                : "border-2 border-surface-300 hover:border-primary-400 dark:border-surface-600"
            )}
          >
            {isDone && <CheckCircle2 className="h-3 w-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className={cn(
                  "font-medium",
                  isDone
                    ? "text-surface-500 line-through"
                    : "text-surface-900 dark:text-surface-50"
                )}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className={cn(
                    "text-sm mt-1",
                    isDone
                      ? "text-surface-400 line-through"
                      : "text-surface-500 dark:text-surface-400"
                  )}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="h-7 w-7 p-0 text-surface-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Meta Info */}
            {(task.dueDate || task.completedAt) && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs",
                isDone
                  ? "text-surface-400"
                  : dueLabel?.isOverdue
                    ? "text-rose-500"
                    : "text-surface-400"
              )}>
                {isDone && task.completedAt ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    {formatRelativeTime(task.completedAt)}에 완료
                  </>
                ) : task.dueDate ? (
                  <>
                    <Calendar className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                    {dueLabel && (
                      <span className={dueLabel.isOverdue ? "text-rose-500" : ""}>
                        ({dueLabel.label})
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

