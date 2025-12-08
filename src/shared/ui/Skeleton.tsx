import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-surface-200 dark:bg-surface-800",
          {
            "h-4 w-full rounded": variant === "text",
            "rounded-full": variant === "circular",
            "rounded-lg": variant === "rectangular",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

