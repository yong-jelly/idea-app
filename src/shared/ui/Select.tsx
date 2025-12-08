import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            // 레이아웃
            "flex h-9 w-full appearance-none rounded-lg px-3 py-2 pr-9",
            // 타이포
            "text-sm",
            // 색상
            "bg-white text-surface-900",
            "dark:bg-surface-900 dark:text-surface-100",
            // 테두리
            "border border-surface-200 dark:border-surface-800",
            // 상태
            "transition-colors duration-150 cursor-pointer",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-surface-800",
            // 에러
            error && "border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
      </div>
    );
  }
);

Select.displayName = "Select";

