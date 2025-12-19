import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Home, Folder, PlusCircle, Bookmark, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { PostComposerModal } from "@/features/feed";
import { getProfileImageUrl } from "@/shared/lib/storage";

const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "프로젝트", href: "/my-projects", icon: Folder },
  { name: "북마크", href: "/bookmarks", icon: Bookmark },
];

interface LeftSidebarProps {
  onProfileEditClick?: () => void;
}

export function LeftSidebar({ onProfileEditClick }: LeftSidebarProps = {}) {
  const location = useLocation();
  const { user, isAuthenticated } = useUserStore();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

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
        <div className="my-5 h-px bg-surface-100 dark:bg-surface-800" />

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link to="/create-project" className="block">
            <button className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium border border-surface-200 text-surface-700 bg-white hover:bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 transition-all">
              <PlusCircle className="h-4 w-4" />
              프로젝트 등록
            </button>
          </Link>
          
          {/* {isAuthenticated && (
            <button 
              onClick={() => setIsComposerOpen(true)}
              className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium text-white bg-surface-900 hover:bg-surface-800 dark:bg-white dark:text-surface-900 dark:hover:bg-surface-100 transition-all shadow-sm hover:shadow-md"
            >
              <Pencil className="h-4 w-4" />
              게시하기
            </button>
          )} */}
        </div>

        {/* User Card */}
        {isAuthenticated && user && (
          <>
            <Link 
              to={`/profile/${user.username}`}
              className="mt-6 block rounded-2xl border border-surface-100 bg-gradient-to-br from-surface-50 to-white p-4 dark:border-surface-800 dark:from-surface-800/50 dark:to-surface-900 hover:border-surface-200 dark:hover:border-surface-700 transition-all group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatar ? getProfileImageUrl(user.avatar, "md") : undefined}
                  alt={user.displayName}
                  fallback={user.displayName}
                  size="md"
                  className="ring-2 ring-white dark:ring-surface-800 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-white truncate text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                    @{user.username}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-surface-300 dark:text-surface-600 group-hover:text-surface-400 transition-colors" />
              </div>
              
              {/* 포인트 배지 */}
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700/50 flex items-center justify-between">
                <span className="text-xs text-surface-500 dark:text-surface-400">보유 포인트</span>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {user.points.toLocaleString()} P
                </span>
              </div>
            </Link>
            
            {/* 프로필 편집 버튼 - 로그인되어 있으면 항상 표시 */}
            {isAuthenticated && onProfileEditClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onProfileEditClick();
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium border border-surface-200 text-surface-700 bg-white hover:bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 transition-all"
              >
                <Settings className="h-4 w-4" />
                프로필 편집
              </button>
            )}
          </>
        )}
      </aside>

      {/* Post Composer Modal */}
      <PostComposerModal 
        open={isComposerOpen} 
        onOpenChange={setIsComposerOpen} 
      />
    </>
  );
}
