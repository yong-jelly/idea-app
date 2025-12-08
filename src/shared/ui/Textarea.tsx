import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // 레이아웃
          "flex min-h-20 w-full rounded-lg px-3 py-2.5",
          // 타이포
          "text-sm leading-relaxed",
          // 색상
          "bg-white text-surface-900 placeholder:text-surface-400",
          "dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500",
          // 테두리
          "border border-surface-200 dark:border-surface-800",
          // 상태
          "transition-colors duration-150 resize-none",
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

Textarea.displayName = "Textarea";

