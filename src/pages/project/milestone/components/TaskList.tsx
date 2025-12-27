import { Plus, Target } from "lucide-react";
import { Button, Card, CardContent } from "@/shared/ui";
import { TaskCard } from "./TaskCard";
import type { MilestoneTask } from "@/entities/project";

interface TaskListProps {
  tasks: MilestoneTask[];
  todoTasks: MilestoneTask[];
  doneTasks: MilestoneTask[];
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: MilestoneTask) => void;
  onDeleteTask: (taskId: string) => void;
  getDueLabel: (dueDate?: string) => { label: string; isOverdue: boolean } | null;
  isProjectOwner?: boolean;
  isAuthenticated?: boolean;
  onLikeTask?: (taskId: string) => void;
}

export function TaskList({
  tasks,
  todoTasks,
  doneTasks,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  getDueLabel,
  isProjectOwner = false,
  isAuthenticated = false,
  onLikeTask,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          태스크 ({tasks.length})
        </h2>
        {isProjectOwner && (
          <Button onClick={onAddTask} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            태스크 추가
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400 mb-4">
              아직 태스크가 없습니다
            </p>
            {isProjectOwner && (
              <Button onClick={onAddTask} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                첫 태스크 추가
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Todo Tasks */}
          {todoTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
                할 일 ({todoTasks.length})
              </h3>
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  getDueLabel={getDueLabel}
                  isProjectOwner={isProjectOwner}
                  isAuthenticated={isAuthenticated}
                  onLike={onLikeTask}
                />
              ))}
            </div>
          )}

          {/* Done Tasks */}
          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
                완료됨 ({doneTasks.length})
              </h3>
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task.id)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  getDueLabel={getDueLabel}
                  isProjectOwner={isProjectOwner}
                  isAuthenticated={isAuthenticated}
                  onLike={onLikeTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

