import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Home, Folder, PlusCircle, Bookmark, Pencil, User } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Avatar } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { PostComposerModal } from "@/features/feed";
import { getProfileImageUrl } from "@/shared/lib/storage";

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "프로젝트", href: "/my-projects", icon: Folder },
  { name: "북마크", href: "/bookmarks", icon: Bookmark },
];

export function LeftSidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useUserStore();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-[275px] shrink-0 overflow-y-auto pt-2 pb-6 px-3">
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

          {/* 프로필 메뉴 */}
          {isAuthenticated && user && (
            <Link
              to={`/profile/${user.username}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname.startsWith("/profile")
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                  : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/50"
              )}
            >
              <User className={cn("h-[18px] w-[18px]", location.pathname.startsWith("/profile") ? "text-primary-600 dark:text-primary-400" : "text-surface-400 dark:text-surface-500")} />
              프로필
            </Link>
          )}
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

        {/* 
          User Card (간소화)
          - 역할: 현재 로그인 상태 및 포인트 확인
          - 상세 정보는 프로필 페이지에서 확인
        */}
        {isAuthenticated && user && (
          <Link 
            to={`/profile/${user.username}`}
            className="mt-6 mx-1 block rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar ? getProfileImageUrl(user.avatar, "md") : undefined}
                alt={user.displayName}
                fallback={user.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-surface-900 dark:text-surface-50 truncate text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {user.displayName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  @{user.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-400 dark:text-surface-500">포인트</p>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {user.points.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Settings */}
        {/* <div className="mt-4 px-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/50 transition-colors"
          >
            <Settings className="h-[18px] w-[18px]" />
            설정
          </Link>
        </div> */}
      </aside>

      {/* Post Composer Modal */}
      <PostComposerModal 
        open={isComposerOpen} 
        onOpenChange={setIsComposerOpen} 
      />
    </>
  );
}
