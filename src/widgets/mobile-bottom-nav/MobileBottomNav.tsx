import { useLocation, useNavigate } from "react-router";
import { Home, FolderOpen, Bookmark, User } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { LoginModal } from "@/pages/auth";
import { useState } from "react";
import { Avatar } from "@/shared/ui";
import { getProfileImageUrl } from "@/shared/lib/storage";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    {
      id: "home",
      label: "홈",
      icon: Home,
      path: "/",
      requiresAuth: false,
    },
    {
      id: "projects",
      label: "프로젝트",
      icon: FolderOpen,
      path: "/explore",
      requiresAuth: false,
    },
    {
      id: "bookmarks",
      label: "북마크",
      icon: Bookmark,
      path: "/bookmarks",
      requiresAuth: true,
    },
    {
      id: "profile",
      label: "프로필",
      icon: User,
      path: user ? `/profile/${user.username}` : null,
      requiresAuth: true,
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (item.id === "profile") {
      if (isAuthenticated && user) {
        navigate(`/profile/${user.username}`);
      } else {
        setShowLoginModal(true);
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (!item.path) return false;
    
    if (item.id === "home") {
      // 홈: /, /user_*/status/*, /profile/:username
      return (
        location.pathname === "/" ||
        (location.pathname.startsWith("/user_") && location.pathname.includes("/status/")) 
        // ||
        // location.pathname === "/bookmarks" ||
        // (location.pathname.startsWith("/profile/") && !location.pathname.includes("/edit"))
      );
    } else if (item.id === "projects") {
      // 프로젝트: /explore, /project로 시작하는 경로
      return (
        location.pathname === "/explore" ||
        location.pathname.startsWith("/project")
      );
    } else if (item.id === "bookmarks") {
      // 북마크: /bookmarks만
      return location.pathname === "/bookmarks";
    } else if (item.id === "profile") {
      // 프로필: /profile/:username만 (수정 페이지 제외)
      return (
        location.pathname.startsWith("/profile/") &&
        !location.pathname.includes("/edit") &&
        (item.path ? location.pathname === item.path : false)
      );
    }
    
    return false;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            // 프로필 메뉴이고 로그인되어 있으면 프로필 이미지 표시
            const isProfileItem = item.id === "profile" && isAuthenticated && user;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  active
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-surface-500 dark:text-surface-400"
                )}
                aria-label={item.label}
              >
                {isProfileItem ? (
                  <Avatar
                    src={user.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined}
                    alt={user.displayName}
                    fallback={user.displayName}
                    size="sm"
                    className={cn(
                      active && "ring-2 ring-primary-500 dark:ring-primary-400"
                    )}
                  />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}

