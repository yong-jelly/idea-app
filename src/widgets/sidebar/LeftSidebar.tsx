import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Home, Compass, Folder, PlusCircle, Bookmark, Settings, Pencil } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Avatar } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { PostComposerModal } from "@/features/feed";

const navigation = [
  { name: "구독 피드", href: "/", icon: Home },
  { name: "탐색", href: "/explore", icon: Compass },
  { name: "내 프로젝트", href: "/my-projects", icon: Folder },
  { name: "북마크", href: "/bookmarks", icon: Bookmark },
];

export function LeftSidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useUserStore();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-16 h-[calc(100vh-4.5rem)] w-60 shrink-0 overflow-y-auto pt-2 pb-6">
        <nav className="flex flex-col gap-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                    : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/50"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-600 dark:text-primary-400" : "text-surface-400 dark:text-surface-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="mt-5 px-1 space-y-2">
          <Link to="/create-project">
            <Button variant="outline" className="w-full gap-2">
              <PlusCircle className="h-4 w-4" />
              프로젝트 등록
            </Button>
          </Link>
          
          {isAuthenticated && (
            <Button 
              className="w-full gap-2" 
              onClick={() => setIsComposerOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              게시하기
            </Button>
          )}
        </div>

        {/* User Card */}
        {isAuthenticated && user && (
          <div className="mt-6 mx-1 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar}
                alt={user.displayName}
                fallback={user.displayName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-surface-900 dark:text-surface-50 truncate">
                  {user.displayName}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1 text-center">
              <div className="py-2">
                <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  {user.projectsCount}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">내 프로젝트</p>
              </div>
              <div className="py-2 border-x border-surface-100 dark:border-surface-800">
                <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  {user.subscribedProjectsCount}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">구독 중</p>
              </div>
              <div className="py-2">
                <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  {user.supportedProjectsCount}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">응원</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500 dark:text-surface-400">보유 포인트</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {user.points.toLocaleString()} P
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-4 px-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/50 transition-colors"
          >
            <Settings className="h-[18px] w-[18px]" />
            설정
          </Link>
        </div>
      </aside>

      {/* Post Composer Modal */}
      <PostComposerModal 
        open={isComposerOpen} 
        onOpenChange={setIsComposerOpen} 
      />
    </>
  );
}
