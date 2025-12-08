import { forwardRef, type HTMLAttributes, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./Button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px] animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 animate-scale-in">{children}</div>
    </div>,
    document.body
  );
}

export const DialogContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 레이아웃
          "relative w-full max-w-lg rounded-xl p-5",
          // 색상
          "bg-white shadow-soft-lg dark:bg-surface-900",
          // 테두리
          "border border-surface-200 dark:border-surface-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4 flex items-start justify-between", className)}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-1 -mt-1">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

DialogHeader.displayName = "DialogHeader";

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-base font-semibold text-surface-900 dark:text-surface-50", className)}
        {...props}
      />
    );
  }
);

DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("mt-1 text-sm text-surface-500 dark:text-surface-400", className)}
        {...props}
      />
    );
  }
);

DialogDescription.displayName = "DialogDescription";

export const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-5 flex justify-end gap-2", className)}
        {...props}
      />
    );
  }
);

DialogFooter.displayName = "DialogFooter";

