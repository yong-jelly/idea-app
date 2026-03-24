/**
 * @file button.tsx
 * @description 공용 버튼. `asChild`일 때 단일 자식(주로 `Link`)에 동일한 시각 스타일을 합성한다.
 */
import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
} from "react";
import { cn } from "@/shared/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  /**
   * true면 자식은 단일 React 엘리먼트(보통 `Link`)만 허용.
   * `<button><a>` 중첩을 피하고 앵커에 버튼 스타일을 입힌다.
   */
  asChild?: boolean;
}

function useButtonClassName({
  className,
  variant = "primary",
  size = "md",
}: Pick<ButtonProps, "className" | "variant" | "size">) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150",
    "font-medium whitespace-nowrap text-sm",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2",
    {
      "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft-sm hover:shadow-soft-md":
        variant === "primary",
      "bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700":
        variant === "secondary",
      "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800":
        variant === "outline",
      "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100":
        variant === "ghost",
      "bg-accent-rose text-white hover:bg-red-600 active:bg-red-700": variant === "destructive",
      "h-8 px-3": size === "sm",
      "h-9 px-4": size === "md",
      "h-11 px-5": size === "lg",
      "h-9 w-9 p-0": size === "icon",
    },
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    isLoading,
    disabled,
    children,
    asChild,
    ...rest
  },
  ref
) {
  const mergedClassName = useButtonClassName({ className, variant, size });

  if (asChild) {
    if (!isValidElement(children)) {
      return (
        <button type="button" className={mergedClassName} disabled ref={ref} {...rest}>
          {children}
        </button>
      );
    }

    if (isLoading) {
      return (
        <button
          type="button"
          ref={ref}
          disabled
          className={mergedClassName}
          {...rest}
        >
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>로딩 중...</span>
        </button>
      );
    }

    const child = children as ReactElement<{
      className?: string;
      onClick?: (e: MouseEvent<HTMLElement>) => void;
      tabIndex?: number;
    }>;

    return cloneElement(child, {
      ...child.props,
      className: cn(
        mergedClassName,
        child.props.className,
        (disabled || isLoading) && "pointer-events-none opacity-50"
      ),
      ref,
      "aria-disabled": disabled ? true : undefined,
      tabIndex: disabled ? -1 : child.props.tabIndex,
      onClick: (e: MouseEvent<HTMLElement>) => {
        if (disabled || isLoading) {
          e.preventDefault();
          return;
        }
        child.props.onClick?.(e);
      },
    });
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={mergedClassName}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>로딩 중...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";
