import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // 레이아웃
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5",
          // 타이포
          "text-xs font-medium",
          // 변형
          {
            "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300":
              variant === "default",
            "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300":
              variant === "secondary",
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300":
              variant === "success",
            "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300":
              variant === "warning",
            "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300":
              variant === "destructive",
            "border border-surface-200 bg-transparent text-surface-600 dark:border-surface-700 dark:text-surface-400":
              variant === "outline",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

