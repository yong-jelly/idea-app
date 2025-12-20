import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Sun, Moon, LogOut, Coins, User, UserX, Settings, PlusCircle } from "lucide-react";
import { Button, Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useUIStore } from "@/shared/config/ui.store";
import { SignUpModal } from "@/pages/auth";
import { ProfileEditModal } from "@/pages/profile";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl } from "@/shared/lib/storage";

const navigation = [
  { name: "홈", href: "/" },
  { name: "프로젝트", href: "/explore" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { user, isAuthenticated, logout, toggleAuth, clearSession, sessionToken } = useUserStore();
  const { theme, toggleTheme } = useUIStore();
  
  const isDev = import.meta.env.DEV;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-surface-100 dark:bg-surface-950/80 dark:border-surface-800/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-[11px] font-bold tracking-tight text-white">1DD</span>
            </div>
          </Link>

          {/* Desktop Navigation - 중앙 배치 */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative px-5 py-2 text-sm font-medium transition-all duration-200",
                  location.pathname === item.href
                    ? "text-surface-900 dark:text-white"
                    : "text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200"
                )}
              >
                {item.name}
                {/* 활성 탭 인디케이터 */}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary-500 transition-all duration-200",
                    location.pathname === item.href ? "w-5 opacity-100" : "w-0 opacity-0"
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-full text-surface-500 hover:text-surface-700 hover:bg-surface-100/80 dark:text-surface-400 dark:hover:text-surface-200 dark:hover:bg-surface-800/50 transition-all"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-surface-100/80 dark:hover:bg-surface-800/50 transition-all ring-2 ring-transparent hover:ring-surface-200 dark:hover:ring-surface-700"
                >
                  <Avatar
                    src={user.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined}
                    alt={user.displayName}
                    fallback={user.displayName}
                    size="sm"
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-surface-100 bg-white p-2 shadow-xl dark:border-surface-800 dark:bg-surface-900 animate-scale-in">
                      {/* 프로필 헤더 */}
                      <div className="px-3 py-3 mb-1">
                        <p className="font-semibold text-surface-900 dark:text-surface-50 text-[15px]">
                          {user.displayName}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                          @{user.username}
                        </p>
                      </div>

                      {/* 포인트 섹션 */}
                      <div className="mx-2 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-br from-surface-50 to-surface-100/50 dark:from-surface-800 dark:to-surface-800/50 border border-surface-100 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">{user.points.toLocaleString()} P</span>
                          </div>
                          <Badge variant="default" className="text-[10px] px-2">
                            {user.level}
                          </Badge>
                        </div>
                      </div>

                      <div className="h-px bg-surface-100 dark:bg-surface-800 mx-2 my-1" />

                      {/* 메뉴 아이템 */}
                      <div className="py-1">
                        <Link
                          to={`/profile/${user.username}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 text-surface-400" />
                          마이페이지
                        </Link>
                        <Link
                          to="/create-project"
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <PlusCircle className="h-4 w-4 text-surface-400" />
                          프로젝트 등록
                        </Link>
                        <button
                          onClick={() => {
                            setIsEditModalOpen(true);
                            setUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-surface-400" />
                          프로필 편집
                        </button>
                        <div className="h-px bg-surface-100 dark:bg-surface-800 mx-2 my-1" />
                        <button
                          onClick={async () => {
                            console.log("[HEADER] 로그아웃 버튼 클릭", {
                              userId: user?.id,
                              username: user?.username,
                              hasSessionToken: !!sessionToken,
                              timestamp: new Date().toISOString()
                            });
                            
                            try {
                              await supabase.auth.signOut();
                            } catch (err) {
                              console.error("[HEADER] Supabase 로그아웃 에러:", err);
                            }
                            
                            logout();
                            clearSession();
                            setUserMenuOpen(false);
                            
                            console.log("[HEADER] 로그아웃 완료", {
                              authenticated: false,
                              sessionCleared: true,
                              timestamp: new Date().toISOString()
                            });
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSignUpModalOpen(true)}
                className="h-9 px-4 text-sm font-medium text-white bg-surface-900 hover:bg-surface-800 dark:bg-white dark:text-surface-900 dark:hover:bg-surface-100 rounded-full transition-all shadow-sm hover:shadow-md"
              >
                로그인
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-full text-surface-600 hover:bg-surface-100/80 dark:text-surface-400 dark:hover:bg-surface-800/50 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-surface-100 py-4 md:hidden dark:border-surface-800 animate-slide-down">
            <nav className="flex flex-col gap-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-3 text-sm font-medium rounded-xl transition-all",
                    location.pathname === item.href
                      ? "bg-surface-100 text-surface-900 dark:bg-surface-800 dark:text-white"
                      : "text-surface-600 hover:text-surface-900 hover:bg-surface-50 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800/50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* 회원가입 모달 */}
      <SignUpModal
        open={signUpModalOpen}
        onOpenChange={setSignUpModalOpen}
      />

      {/* 프로필 편집 모달 */}
      {isAuthenticated && (
        <ProfileEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </header>
  );
}

