import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Home, Bookmark, Rss } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PostComposerModal } from "@/features/feed";
import { useUserStore } from "@/entities/user";
import { ProjectSection } from "./ProjectSection";

const navigation = [
  { name: "피드", href: "/", icon: Rss },
  { name: "북마크", href: "/bookmarks", icon: Bookmark },
];

export function LeftSidebar() {
  const location = useLocation();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const { isAuthenticated } = useUserStore();

  return (
    <>
      <aside className="sticky top-16 h-[calc(100vh-4rem)] w-[260px] shrink-0 overflow-y-auto pt-4 pb-6 px-4">
        {/* 메인 네비게이션 */}
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 shadow-sm"
                    : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/70"
                )}
              >
                <Icon className={cn(
                  "h-[18px] w-[18px] transition-colors", 
                  isActive 
                    ? "text-primary-600 dark:text-primary-400" 
                    : "text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 구분선 */}
        {isAuthenticated && (
          <div className="my-4 border-t border-surface-200 dark:border-surface-800" />
        )}

        {/* 프로젝트 섹션 */}
        {isAuthenticated && <ProjectSection />}
      </aside>

      {/* Post Composer Modal */}
      <PostComposerModal 
        open={isComposerOpen} 
        onOpenChange={setIsComposerOpen} 
      />
    </>
  );
}
