/**
 * @file ProjectSettingsNav.tsx
 * @description 프로젝트 설정 좌측 네비 + 모바일 가로 탭. GitHub Settings 스타일 네비게이션.
 */

import { NavLink } from "react-router";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { to: "general", label: "일반" },
  { to: "access", label: "LLM 및 API" },
  { to: "manual", label: "메뉴얼" },
  { to: "echo", label: "에코 테스트" },
] as const;

export function ProjectSettingsNav({ projectId }: { projectId: string }) {
  const base = `/project/${projectId}/settings`;

  return (
    <>
      {/* 데스크톱: 좌측 세로 네비 */}
      <nav
        className="hidden md:block w-56 shrink-0 border-r border-surface-200 dark:border-surface-800 pr-4"
        aria-label="프로젝트 설정"
      >
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={`${base}/${item.to}`}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-100 text-surface-900 dark:bg-surface-800 dark:text-surface-50"
                      : "text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-900/80"
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 모바일: 가로 스크롤 탭 */}
      <div className="md:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={`${base}/${item.to}`}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                  isActive
                    ? "border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
                    : "border-surface-200 text-surface-600 dark:border-surface-700 dark:text-surface-400"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
