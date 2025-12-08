import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Sun, Moon, Settings, LogOut, Coins } from "lucide-react";
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
  
  const { user, isAuthenticated, logout } = useUserStore();
  const { theme, toggleTheme } = useUIStore();

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
                        <button
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800"
                        >
                          <Settings className="h-4 w-4" />
                          설정
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
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
              <Button variant="outline" size="sm">
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

