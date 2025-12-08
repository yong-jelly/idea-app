import { forwardRef, type ImgHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", fallback, size = "md", ...props }, ref) => {
    const sizeClasses = {
      xs: "h-6 w-6 text-[10px]",
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-sm",
      xl: "h-16 w-16 text-base",
    };

    const getFallbackText = () => {
      if (fallback) return fallback.slice(0, 2).toUpperCase();
      if (alt) return alt.slice(0, 2).toUpperCase();
      return "?";
    };

    return (
      <div
        ref={ref}
        className={cn(
          // 레이아웃
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          // 색상 - 단색으로 정돈
          "bg-primary-100 dark:bg-primary-900/40",
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            {...props}
          />
        ) : (
          <span className="font-medium text-primary-700 dark:text-primary-300">{getFallbackText()}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

