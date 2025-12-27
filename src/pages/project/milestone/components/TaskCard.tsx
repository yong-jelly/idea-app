import { Calendar, Edit, Trash2, CheckCircle2, Heart } from "lucide-react";
import { Button, Card, CardContent, Avatar } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { getProfileImageUrl } from "@/shared/lib/storage";
import type { MilestoneTask } from "@/entities/project";

interface TaskCardProps {
  task: MilestoneTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDueLabel: (dueDate?: string) => { label: string; isOverdue: boolean } | null;
  isProjectOwner?: boolean;
  isAuthenticated?: boolean;
  onLike?: (taskId: string) => void;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  getDueLabel,
  isProjectOwner = false,
  isAuthenticated = false,
  onLike,
}: TaskCardProps) {
  const taskDueLabel = getDueLabel(task.dueDate);
  const isCompleted = task.status === "done";
  const likesCount = task.likesCount ?? 0;
  const isLiked = task.isLiked ?? false;
  const likedUsers = task.likedUsers ?? [];
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // 로그인 모달 표시 등의 처리 (현재는 alert)
      alert("로그인이 필요합니다");
      return;
    }
    onLike?.(task.id);
  };
  
  // 좋아요한 유저 아바타 표시 (최대 3명)
  const displayUsers = likedUsers.slice(0, 3);
  const remainingCount = likedUsers.length > 3 ? likedUsers.length - 3 : 0;

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
              {isProjectOwner && (
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
              )}
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
            
            {/* 좋아요 섹션 - 좋아요한 유저가 있을 때만 표시 */}
            {likesCount > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                {/* 좋아요한 유저 아바타들 */}
                {displayUsers.length > 0 && (
                  <div className="flex items-center -space-x-2">
                    {displayUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="relative"
                        style={{ zIndex: displayUsers.length - index }}
                      >
                        <Avatar
                          src={user.avatar ? getProfileImageUrl(user.avatar, "xs") : undefined}
                          alt={user.displayName}
                          fallback={user.displayName}
                          size="xs"
                          className="ring-2 ring-white dark:ring-surface-900"
                        />
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="relative ml-2">
                        <div className="h-6 w-6 rounded-full bg-surface-200 dark:bg-surface-700 ring-2 ring-white dark:ring-surface-900 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400">
                            +{remainingCount}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 좋아요 버튼 */}
                <button
                  onClick={handleLikeClick}
                  disabled={!isAuthenticated}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    isLiked
                      ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                      : isAuthenticated
                      ? "text-surface-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
                      : "text-surface-400 cursor-not-allowed",
                    !isAuthenticated && "opacity-50"
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                  <span className="tabular-nums">{likesCount}</span>
                </button>
              </div>
            )}
            
            {/* 좋아요가 없지만 로그인한 경우 좋아요 버튼만 표시 */}
            {likesCount === 0 && isAuthenticated && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={handleLikeClick}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-surface-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-all"
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span className="tabular-nums">0</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

