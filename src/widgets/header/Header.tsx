import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Sun, Moon, LogOut, Coins, User, UserX } from "lucide-react";
import { Button, Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { useUIStore } from "@/shared/config/ui.store";

const navigation = [
  { name: "피드", href: "/" },
  { name: "탐색", href: "/explore" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const { user, isAuthenticated, logout, toggleAuth, clearSession, sessionToken } = useUserStore();
  const { theme, toggleTheme } = useUIStore();
  
  const isDev = import.meta.env.DEV;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200/80 bg-white/95 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-xs font-bold text-white">IS</span>
            </div>
            <span className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              IndieStart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === item.href
                    ? "bg-surface-100 text-surface-900 dark:bg-surface-800 dark:text-surface-50"
                    : "text-surface-500 hover:text-surface-900 hover:bg-surface-50 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800/50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* 
              개발용 인증 토글 버튼
              개발 환경에서만 표시되며, 회원/비회원 모드를 전환할 수 있습니다.
              클릭 시 toggleAuth()가 호출되어 JWT 세션을 생성하거나 삭제합니다.
            */}
            {isDev && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("[HEADER] 개발용 인증 토글 버튼 클릭", {
                    currentState: isAuthenticated ? "인증됨" : "비인증",
                    userId: user?.id,
                    username: user?.username,
                    hasSessionToken: !!sessionToken,
                    timestamp: new Date().toISOString()
                  });
                  
                  // 인증 상태 토글 (세션 생성/삭제)
                  toggleAuth();
                  
                  console.log("[HEADER] 인증 토글 처리 완료", {
                    action: isAuthenticated ? "로그아웃 처리됨" : "로그인 처리됨",
                    timestamp: new Date().toISOString()
                  });
                }}
                className={cn(
                  "gap-1.5 text-xs font-medium",
                  isAuthenticated
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
                )}
                title={isAuthenticated ? "회원 모드 (클릭하여 비회원으로 전환)" : "비회원 모드 (클릭하여 회원으로 전환)"}
              >
                {isAuthenticated ? (
                  <>
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">회원</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">비회원</span>
                  </>
                )}
              </Button>
            )}

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-0.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <Avatar
                    src={user.avatar}
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
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-surface-200 bg-white p-1.5 shadow-soft-lg dark:border-surface-800 dark:bg-surface-900 animate-scale-in">
                      <div className="border-b border-surface-100 px-3 py-2.5 dark:border-surface-800">
                        <p className="font-medium text-surface-900 dark:text-surface-50">
                          {user.displayName}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          @{user.username}
                        </p>
                      </div>

                      <div className="py-1.5">
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400">
                          <Coins className="h-4 w-4" />
                          <span>{user.points.toLocaleString()} P</span>
                          <Badge variant="default" className="ml-auto">
                            {user.level}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t border-surface-100 dark:border-surface-800 pt-1.5">
                        <Link
                          to={`/profile/${user.username}`}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Avatar size="xs" fallback={user.displayName} />
                          마이페이지
                        </Link>
                          {/* <button
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800"
                          >
                            <Settings className="h-4 w-4" />
                            설정
                          </button> */}
                        {/* 
                          로그아웃 버튼
                          사용자 메뉴에서 로그아웃을 수행합니다.
                          logout()과 clearSession()을 모두 호출하여 사용자 정보와 세션 토큰을 완전히 제거합니다.
                        */}
                        <button
                          onClick={() => {
                            console.log("[HEADER] 로그아웃 버튼 클릭", {
                              userId: user?.id,
                              username: user?.username,
                              hasSessionToken: !!sessionToken,
                              timestamp: new Date().toISOString()
                            });
                            
                            // 사용자 정보 제거
                            logout();
                            
                            // 세션 토큰 제거
                            clearSession();
                            
                            // 사용자 메뉴 닫기
                            setUserMenuOpen(false);
                            
                            console.log("[HEADER] 로그아웃 완료", {
                              authenticated: false,
                              sessionCleared: true,
                              timestamp: new Date().toISOString()
                            });
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-rose hover:bg-red-50 dark:hover:bg-red-900/20"
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
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "transition-all",
                  !isDev && "hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 dark:hover:bg-primary-950 dark:hover:border-primary-700 dark:hover:text-primary-300"
                )}
              >
                로그인
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Menu className="h-[18px] w-[18px]" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-surface-200 py-3 md:hidden dark:border-surface-800 animate-slide-down">
            <nav className="flex flex-col gap-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    location.pathname === item.href
                      ? "bg-surface-100 text-surface-900 dark:bg-surface-800 dark:text-surface-50"
                      : "text-surface-600 hover:text-surface-900 hover:bg-surface-50 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800"
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
    </header>
  );
}

