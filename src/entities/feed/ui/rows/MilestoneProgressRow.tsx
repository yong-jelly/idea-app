import { Card, CardContent, Badge, Progress } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { MilestoneProgress } from "../../model/feed.types";

// 미니멀 아이콘들
const TargetIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="2"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
  </svg>
);

const CheckSmallIcon = ({ checked }: { checked: boolean }) => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" opacity={checked ? 1 : 0.3}>
    <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 0a1 1 0 011 1v1h6V1a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2h1V1a1 1 0 011-1zm10 6H2v8h12V6z"/>
  </svg>
);

export interface MilestoneProgressRowProps {
  milestone: MilestoneProgress;
  onClick?: () => void;
  className?: string;
}

/**
 * 마일스톤 진행 Row
 * 
 * 프로젝트 마일스톤의 진행 상황을 표시합니다.
 * 진행률, 산출물 목록, 목표일 등을 보여줍니다.
 */
export function MilestoneProgressRow({
  milestone,
  onClick,
  className,
}: MilestoneProgressRowProps) {
  return (
    <Card 
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            milestone.isCompleted
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : milestone.progress > 0
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              : "bg-surface-100 text-surface-400 dark:bg-surface-800"
          )}>
            {milestone.isCompleted ? <CheckIcon /> : <TargetIcon />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                {milestone.title}
              </h3>
              {milestone.isCompleted && (
                <Badge variant="success" className="rounded-full">완료</Badge>
              )}
            </div>

            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
              {milestone.description}
            </p>

            {/* Progress Bar */}
            {!milestone.isCompleted && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>진행률</span>
                  <span className="tabular-nums">{milestone.progress}%</span>
                </div>
                <Progress value={milestone.progress} size="md" />
              </div>
            )}

            {/* Deliverables */}
            <div className="space-y-1.5 mb-3">
              {milestone.deliverables.map((item, i) => {
                const isDelivered = milestone.isCompleted || 
                  (milestone.progress >= ((i + 1) / milestone.deliverables.length) * 100);
                
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckSmallIcon checked={isDelivered} />
                    <span className={cn(
                      isDelivered 
                        ? "text-surface-700 dark:text-surface-300" 
                        : "text-surface-400"
                    )}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <CalendarIcon />
              {milestone.isCompleted
                ? `${milestone.completedAt} 완료`
                : `목표: ${milestone.targetDate}`
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
