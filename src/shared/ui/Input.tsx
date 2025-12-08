import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // 레이아웃
          "flex h-9 w-full rounded-lg px-3 py-2",
          // 타이포
          "text-sm",
          // 색상
          "bg-white text-surface-900 placeholder:text-surface-400",
          "dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500",
          // 테두리
          "border border-surface-200 dark:border-surface-800",
          // 상태
          "transition-colors duration-150",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-surface-800",
          // 에러
          error && "border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

