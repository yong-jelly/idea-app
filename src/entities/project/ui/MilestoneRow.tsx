import { CheckCircle2, Clock, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { Milestone } from "../model/project.types";

export interface MilestoneRowProps {
  /** 마일스톤 데이터 */
  milestone: Milestone;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 진행 상태 토글 핸들러 */
  onToggleStatus?: () => void;
  /** 수정 핸들러 */
  onEdit?: () => void;
  /** 삭제 핸들러 */
  onDelete?: () => void;
  /** 액션 버튼 표시 여부 */
  showActions?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 마일스톤 Row 컴포넌트
 * 
 * 마일스톤 목록에서 각 마일스톤을 표시하는 Row 컴포넌트입니다.
 * 진행률, 기한, 태스크 수 등의 정보를 보여줍니다.
 */
export function MilestoneRow({
  milestone,
  onClick,
  onToggleStatus,
  onEdit,
  onDelete,
  showActions = false,
  compact = false,
}: MilestoneRowProps) {
  const tasks = milestone.tasks || [];
  const totalTasks = milestone.openIssuesCount + milestone.closedIssuesCount;
  const progress = totalTasks > 0 ? Math.round((milestone.closedIssuesCount / totalTasks) * 100) : 0;

  const getDueLabel = (dueDate?: string, status?: string) => {
    if (!dueDate) return null;
    if (status === "closed") return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
    if (diffDays === 0) return { label: "오늘", isOverdue: false };
    return { label: `D-${diffDays}`, isOverdue: false };
  };

  const dueLabel = getDueLabel(milestone.dueDate, milestone.status);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700",
          "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
          onClick && "cursor-pointer"
        )}
      >
        {/* Progress Circle */}
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0",
            milestone.status === "closed"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-surface-100 text-surface-500 dark:bg-surface-800"
          )}
        >
          {milestone.status === "closed" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            `${progress}%`
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-sm text-surface-900 dark:text-surface-50 truncate",
            milestone.status === "closed" && "line-through opacity-60"
          )}>
            {milestone.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <span>{milestone.closedIssuesCount}/{totalTasks} 완료</span>
            {milestone.dueDate && milestone.status === "open" && (
              <span className={dueLabel?.isOverdue ? "text-rose-500" : ""}>
                {dueLabel?.label}
              </span>
            )}
          </div>
        </div>

        {onClick && <ChevronRight className="h-4 w-4 text-surface-400 shrink-0" />}
      </div>
    );
  }

  return (
    <Card className="transition-colors">
      <CardContent className="p-0">
        <div
          className={cn(
            "p-4",
            onClick && "cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
          )}
          onClick={onClick}
        >
          <div className="flex items-start gap-4">
            {/* Progress Circle */}
            <div
              onClick={(e) => {
                if (onToggleStatus) {
                  e.stopPropagation();
                  onToggleStatus();
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors",
                milestone.status === "closed"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-surface-100 text-surface-500 dark:bg-surface-800",
                onToggleStatus && "cursor-pointer hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
              )}
            >
              {milestone.status === "closed" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-bold">{progress}%</span>
              )}
              <span className="text-[10px] mt-0.5">
                {milestone.status === "closed" ? "완료" : "진행률"}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  "font-semibold text-surface-900 dark:text-surface-50",
                  milestone.status === "closed" && "line-through opacity-60"
                )}>
                  {milestone.title}
                </h3>
                {milestone.status === "closed" && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">
                    완료됨
                  </Badge>
                )}
                {onClick && <ChevronRight className="h-4 w-4 text-surface-400" />}
              </div>
              
              {milestone.description && (
                <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mb-2">
                  {milestone.description}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        milestone.status === "closed" 
                          ? "bg-emerald-500" 
                          : "bg-primary-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {milestone.closedIssuesCount}개 완료
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-surface-400" />
                  {milestone.openIssuesCount}개 남음
                </span>
                {milestone.dueDate && (
                  <span className={cn(
                    "flex items-center gap-1",
                    dueLabel?.isOverdue && milestone.status === "open" ? "text-rose-500" : ""
                  )}>
                    <Calendar className="h-3 w-3" />
                    {new Date(milestone.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    {dueLabel && milestone.status === "open" && (
                      <span className={dueLabel.isOverdue ? "text-rose-500" : "text-surface-400"}>
                        ({dueLabel.label})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

