import { type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface EmptyStateProps {
  /**
   * 아이콘 컴포넌트 (lucide-react 아이콘 등)
   */
  icon?: ReactNode;
  /**
   * 제목
   */
  title: string;
  /**
   * 설명 텍스트
   */
  description?: string;
  /**
   * 액션 버튼 (ReactNode)
   */
  action?: ReactNode;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 패딩 크기 조정
   */
  size?: "sm" | "md" | "lg";
}

/**
 * 빈 상태를 표시하는 공통 컴포넌트
 * 
 * 데이터가 없을 때 사용자에게 친절한 안내를 제공합니다.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Inbox className="h-12 w-12" />}
 *   title="피드가 비어있습니다"
 *   description="새로운 포스트를 작성해보세요"
 *   action={<Button>포스트 작성</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        {
          "py-12 px-4": size === "sm",
          "py-16 px-4": size === "md",
          "py-24 px-4": size === "lg",
        },
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
          <div className="text-surface-400 dark:text-surface-500">
            {icon}
          </div>
        </div>
      )}
      
      <h3 className="mb-2 text-lg font-semibold text-surface-900 dark:text-surface-50">
        {title}
      </h3>
      
      {description && (
        <p className="mb-6 max-w-md text-sm text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  );
}


