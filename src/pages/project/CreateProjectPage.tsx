import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  ChevronDown,
  Image as ImageIcon,
  Link2,
  Check,
  Compass,
  Bookmark,
  LayoutList,
} from "lucide-react";
import { Button, Input, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

const CATEGORIES = [
  { id: "productivity", label: "생산성" },
  { id: "game", label: "게임" },
  { id: "web", label: "웹" },
  { id: "mobile", label: "모바일 앱" },
  { id: "desktop", label: "데스크탑" },
  { id: "ai", label: "AI/ML" },
  { id: "social", label: "소셜" },
  { id: "education", label: "교육" },
  { id: "entertainment", label: "엔터테인먼트" },
  { id: "finance", label: "금융" },
  { id: "health", label: "건강/운동" },
  { id: "lifestyle", label: "라이프스타일" },
  { id: "devtool", label: "개발 도구" },
  { id: "utility", label: "유틸리티" },
  { id: "design", label: "디자인" },
  { id: "music", label: "음악/오디오" },
  { id: "news", label: "뉴스" },
  { id: "shopping", label: "쇼핑" },
  { id: "travel", label: "여행" },
];

const MAX_CATEGORIES = 3;

interface ProjectFormData {
  title: string;
  description: string;
  categories: string[];
  iconFile: File | null;
  iconPreview: string;
  screenshots: Array<{ file: File; preview: string }>;
  repositoryUrl: string;
  demoUrl: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  macStoreUrl: string;
}

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    categories: [],
    iconFile: null,
    iconPreview: "",
    screenshots: [],
    repositoryUrl: "",
    demoUrl: "",
    androidStoreUrl: "",
    iosStoreUrl: "",
    macStoreUrl: "",
  });

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    const isSelected = formData.categories.includes(categoryId);
    if (isSelected) {
      updateField("categories", formData.categories.filter((id) => id !== categoryId));
    } else if (formData.categories.length < MAX_CATEGORIES) {
      updateField("categories", [...formData.categories, categoryId]);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateField("iconFile", file);
        updateField("iconPreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          screenshots: [...prev.screenshots, { file, preview: reader.result as string }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  const removeIcon = () => {
    updateField("iconFile", null);
    updateField("iconPreview", "");
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return;
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    navigate("/project/1");
  };

  const isValid = formData.title.trim() && formData.description.trim();

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
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

        {/* 폼 컨텐츠 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="border-b border-surface-100 px-6 py-4 dark:border-surface-800">
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                기본 정보
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                프로젝트의 핵심 정보를 입력하세요
              </p>
            </div>

            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              <div className="flex flex-col gap-5 px-6 py-5 md:flex-row">
                {/* 대표 이미지 (아이콘) */}
                <div className="flex-shrink-0">
                  <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                    앱 아이콘
                  </label>
                  {formData.iconPreview ? (
                    <div className="group relative">
                      <img
                        src={formData.iconPreview}
                        alt="App icon"
                        className="h-24 w-24 rounded-2xl border border-surface-200 object-cover shadow-sm dark:border-surface-600"
                      />
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50 transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-primary-500">
                      <Upload className="h-6 w-6 text-surface-400" />
                      <span className="mt-1 text-xs text-surface-400">업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 제목 */}
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    프로젝트 제목 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="예: AI 기반 코드 리뷰 도구"
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-surface-400">
                    프로젝트를 대표하는 이름을 입력하세요
                  </p>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    프로젝트 설명 <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="프로젝트에 대해 자유롭게 설명해주세요. 어떤 문제를 해결하나요? 누구를 위한 서비스인가요?"
                    className="min-h-32 resize-none text-base leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                  카테고리
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  프로젝트를 설명하는 주제를 선택하세요 (최대 3개)
                </p>
              </div>
              <span
                className={cn(
                  "text-xs rounded-full px-3 py-1 font-semibold",
                  formData.categories.length === MAX_CATEGORIES
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-300"
                )}
              >
                {formData.categories.length}/{MAX_CATEGORIES}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const isSelected = formData.categories.includes(category.id);
                const isDisabled = !isSelected && formData.categories.length >= MAX_CATEGORIES;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    disabled={isDisabled}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                        : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-surface-600",
                      isDisabled && "cursor-not-allowed opacity-40"
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

          {/* 미디어 */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              스크린샷
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              앱 화면이나 기능을 보여주는 이미지를 추가하세요
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {formData.screenshots.map((screenshot, index) => (
                <div key={index} className="group relative">
                  <img
                    src={screenshot.preview}
                    alt={`Screenshot ${index + 1}`}
                    className="h-28 w-auto rounded-lg border border-surface-200 object-cover shadow-sm dark:border-surface-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-surface-300 bg-surface-50 transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-primary-500">
                <ImageIcon className="h-6 w-6 text-surface-400" />
                <span className="text-xs text-surface-400">추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* URL 섹션 (접히는 영역) */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <button
              type="button"
              onClick={() => setShowUrls(!showUrls)}
              className="flex w-full items-center justify-between rounded-lg bg-surface-50 px-4 py-3 text-left transition-colors hover:bg-surface-100 dark:bg-surface-800/70 dark:hover:bg-surface-800"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-surface-500" />
                <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                  링크 추가
                </span>
                <span className="text-xs text-surface-400">(선택)</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-surface-400 transition-transform",
                  showUrls && "rotate-180"
                )}
              />
            </button>

            {showUrls && (
              <div className="mt-4 space-y-4 rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-800/40">
                {/* 저장소 URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    저장소 URL
                  </label>
                  <Input
                    value={formData.repositoryUrl}
                    onChange={(e) => updateField("repositoryUrl", e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="h-10 text-sm"
                  />
                </div>

                {/* 데모 URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    데모 URL
                  </label>
                  <Input
                    value={formData.demoUrl}
                    onChange={(e) => updateField("demoUrl", e.target.value)}
                    placeholder="https://demo.example.com"
                    className="h-10 text-sm"
                  />
                </div>

                {/* 앱스토어 링크들 */}
                <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
                  <p className="mb-3 text-xs font-medium text-surface-500">앱스토어 링크</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                        <span className="text-sm">🤖</span>
                      </div>
                      <Input
                        value={formData.androidStoreUrl}
                        onChange={(e) => updateField("androidStoreUrl", e.target.value)}
                        placeholder="Google Play Store URL"
                        className="h-10 flex-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <span className="text-sm">🍎</span>
                      </div>
                      <Input
                        value={formData.iosStoreUrl}
                        onChange={(e) => updateField("iosStoreUrl", e.target.value)}
                        placeholder="App Store (iOS) URL"
                        className="h-10 flex-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-500/10 text-surface-600 dark:text-surface-400">
                        <span className="text-sm">💻</span>
                      </div>
                      <Input
                        value={formData.macStoreUrl}
                        onChange={(e) => updateField("macStoreUrl", e.target.value)}
                        placeholder="Mac App Store URL"
                        className="h-10 flex-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 최하단 CTA */}
        <div className="mt-8 rounded-xl border border-surface-200 bg-white px-6 py-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                프로젝트 등록 마무리
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                입력한 내용을 확인한 뒤 등록을 완료하세요
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="h-11 gap-2 rounded-full px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  등록 중
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  등록하기
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
