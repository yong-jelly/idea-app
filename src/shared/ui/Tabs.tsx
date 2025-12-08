import { createContext, forwardRef, useContext, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs 컴포넌트는 Tabs 내부에서 사용해야 합니다.");
  }
  return context;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

export const TabsList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          // 레이아웃
          "inline-flex items-center gap-0.5 rounded-lg p-1",
          // 색상
          "bg-surface-100 dark:bg-surface-800/50",
          className
        )}
        {...props}
      />
    );
  }
);

TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const context = useTabsContext();
    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        onClick={() => context.onValueChange(value)}
        className={cn(
          // 레이아웃
          "inline-flex items-center justify-center rounded-md px-3 py-1.5",
          // 타이포
          "text-sm font-medium",
          // 상태
          "transition-all duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          // 색상
          isActive
            ? "bg-white text-surface-900 shadow-soft-xs dark:bg-surface-700 dark:text-surface-50"
            : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200",
          className
        )}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = useTabsContext();
    
    if (context.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-3 animate-fade-in", className)}
        {...props}
      />
    );
  }
);

TabsContent.displayName = "TabsContent";

