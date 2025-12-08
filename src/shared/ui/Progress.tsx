import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = "default", size = "md", showLabel, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1",
      md: "h-1.5",
      lg: "h-2",
    };

    const variantClasses = {
      default: "bg-primary-600",
      success: "bg-accent-emerald",
      warning: "bg-accent-amber",
      destructive: "bg-accent-rose",
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1.5 flex justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>{value.toLocaleString()}</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

