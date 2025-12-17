import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ProjectCategory } from "@/entities/project";

const CATEGORIES = [
  { id: "game", label: "게임", mappedCategory: "game" as ProjectCategory },
  { id: "web", label: "웹", mappedCategory: "web" as ProjectCategory },
  { id: "mobile", label: "모바일 앱", mappedCategory: "mobile" as ProjectCategory },
  { id: "ai", label: "AI/ML", mappedCategory: "ai" as ProjectCategory },
  { id: "devtool", label: "개발 도구", mappedCategory: "tool" as ProjectCategory },
  { id: "utility", label: "유틸리티", mappedCategory: "tool" as ProjectCategory },
  { id: "productivity", label: "생산성", mappedCategory: "tool" as ProjectCategory },
  { id: "desktop", label: "데스크탑", mappedCategory: "tool" as ProjectCategory },
  { id: "opensource", label: "오픈소스", mappedCategory: "opensource" as ProjectCategory },
  { id: "social", label: "소셜", mappedCategory: "web" as ProjectCategory },
  { id: "education", label: "교육", mappedCategory: "web" as ProjectCategory },
  { id: "entertainment", label: "엔터테인먼트", mappedCategory: "web" as ProjectCategory },
  { id: "finance", label: "금융", mappedCategory: "web" as ProjectCategory },
  { id: "health", label: "건강/운동", mappedCategory: "mobile" as ProjectCategory },
  { id: "lifestyle", label: "라이프스타일", mappedCategory: "mobile" as ProjectCategory },
  { id: "design", label: "디자인", mappedCategory: "tool" as ProjectCategory },
  { id: "music", label: "음악/오디오", mappedCategory: "web" as ProjectCategory },
  { id: "news", label: "뉴스", mappedCategory: "web" as ProjectCategory },
  { id: "shopping", label: "쇼핑", mappedCategory: "web" as ProjectCategory },
  { id: "travel", label: "여행", mappedCategory: "mobile" as ProjectCategory },
];

interface CategorySectionProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export function CategorySection({
  selectedCategory,
  onCategorySelect,
}: CategorySectionProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="space-y-1 mb-4">
        <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
          카테고리 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          프로젝트를 설명하는 주제를 선택하세요
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all",
                isSelected
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                  : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-surface-600"
              )}
            >
              <span className="text-surface-400">#</span>
              <span>{category.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CATEGORIES };

