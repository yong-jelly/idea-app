import { Link } from "react-router";
import { ArrowLeft, Compass, Bookmark, LayoutList, ChevronDown } from "lucide-react";

export function CreateProjectHeader() {
  return (
    <>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link> */}
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
              새 프로젝트 등록
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              정보를 입력하고 다른 사용자들에게 프로젝트를 소개하세요
            </p>
          </div>
        </div>
      </div>

      {/* 다른 페이지 연결 */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          {
            to: "/explore",
            label: "둘러보기",
            desc: "다른 프로젝트 흐름 참고",
            icon: <Compass className="h-4 w-4" />,
          },
          {
            to: "/my-projects",
            label: "내 프로젝트",
            desc: "작성한 프로젝트로 이동",
            icon: <LayoutList className="h-4 w-4" />,
          },
          {
            to: "/bookmarks",
            label: "북마크",
            desc: "저장한 영감 살펴보기",
            icon: <Bookmark className="h-4 w-4" />,
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-surface-800 dark:text-surface-100">
                {item.icon}
                {item.label}
              </p>
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {item.desc}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 -rotate-90 text-surface-400" />
          </Link>
        ))}
      </div>
    </>
  );
}

