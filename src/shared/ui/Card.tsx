import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "bordered" | "flat";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 레이아웃
          "rounded-xl",
          // 색상
          "bg-white dark:bg-surface-900",
          // 변형
          {
            "shadow-soft-sm border border-surface-100 dark:border-surface-800": variant === "default",
            "shadow-soft-sm border border-surface-100 dark:border-surface-800 transition-all duration-150 hover:shadow-soft-md hover:border-surface-200 dark:hover:border-surface-700 cursor-pointer": variant === "interactive",
            "border border-surface-200 dark:border-surface-800": variant === "bordered",
            "bg-surface-50 dark:bg-surface-900/50": variant === "flat",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 p-5 pb-3", className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-base font-semibold text-surface-900 dark:text-surface-50", className)}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-surface-500 dark:text-surface-400", className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-5 pb-5", className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center px-5 pb-5", className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

