import { useState, KeyboardEvent } from "react";
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
import { useUserStore } from "@/entities/user";
import { createProject } from "@/entities/project";
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

interface ProjectFormData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string; // 카테고리 ID
  techStack: string[]; // 태그 배열
  thumbnailFile: File | null;
  thumbnailPreview: string;
  screenshots: Array<{ file: File; preview: string }>;
  repositoryUrl: string;
  demoUrl: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  macStoreUrl: string;
}

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [techStackInput, setTechStackInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    shortDescription: "",
    fullDescription: "",
    category: "",
    techStack: [],
    thumbnailFile: null,
    thumbnailPreview: "",
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

  const handleCategorySelect = (categoryId: string) => {
    updateField("category", categoryId);
  };

  const handleTechStackKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && techStackInput.trim()) {
      e.preventDefault();
      const newTag = techStackInput.trim();
      if (!formData.techStack.includes(newTag) && formData.techStack.length < 10) {
        updateField("techStack", [...formData.techStack, newTag]);
        setTechStackInput("");
      }
    }
  };

  const removeTechStackTag = (tag: string) => {
    updateField("techStack", formData.techStack.filter((t) => t !== tag));
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateField("thumbnailFile", file);
        updateField("thumbnailPreview", reader.result as string);
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

  const removeThumbnail = () => {
    updateField("thumbnailFile", null);
    updateField("thumbnailPreview", "");
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("로그인이 필요합니다");
      return;
    }

    if (!formData.title.trim() || !formData.shortDescription.trim() || !formData.category) {
      setError("필수 항목을 모두 입력해주세요");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 카테고리 매핑
      const categoryInfo = CATEGORIES.find((c) => c.id === formData.category);
      if (!categoryInfo) {
        throw new Error("유효하지 않은 카테고리입니다");
      }

      const { projectId, error: createError } = await createProject(
        {
          title: formData.title.trim(),
          short_description: formData.shortDescription.trim(),
          full_description: formData.fullDescription.trim() || undefined,
          category: categoryInfo.mappedCategory,
          tech_stack: formData.techStack,
          repository_url: formData.repositoryUrl.trim() || undefined,
          demo_url: formData.demoUrl.trim() || undefined,
          android_store_url: formData.androidStoreUrl.trim() || undefined,
          ios_store_url: formData.iosStoreUrl.trim() || undefined,
          mac_store_url: formData.macStoreUrl.trim() || undefined,
          // author_id는 API에서 자동으로 현재 로그인한 사용자로 설정됨
        },
        formData.thumbnailFile,
        formData.screenshots.map((s) => s.file)
      );

      if (createError || !projectId) {
        throw createError || new Error("프로젝트 생성에 실패했습니다");
      }

      // 성공 시 프로젝트 페이지로 이동
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error("프로젝트 생성 에러:", err);
      setError(err instanceof Error ? err.message : "프로젝트 생성에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  const isValid = formData.title.trim() && formData.shortDescription.trim() && formData.category;

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
                {/* 대표 이미지 (썸네일) */}
                <div className="flex-shrink-0">
                  <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                    프로젝트 썸네일
                  </label>
                  {formData.thumbnailPreview ? (
                    <div className="group relative">
                      <img
                        src={formData.thumbnailPreview}
                        alt="Project thumbnail"
                        className="h-24 w-24 rounded-2xl border border-surface-200 object-cover shadow-sm dark:border-surface-600"
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
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
                        onChange={handleThumbnailUpload}
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

              <div className="px-6 py-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    짧은 설명 <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => updateField("shortDescription", e.target.value)}
                    placeholder="프로젝트를 한 줄로 요약해주세요 (예: 머신러닝을 활용한 자동 코드 리뷰 도구)"
                    className="min-h-20 resize-none text-base leading-relaxed"
                    maxLength={200}
                  />
                  <p className="text-xs text-surface-400">
                    {formData.shortDescription.length}/200
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    상세 설명
                  </label>
                  <Textarea
                    value={formData.fullDescription}
                    onChange={(e) => updateField("fullDescription", e.target.value)}
                    placeholder="프로젝트에 대해 자세히 설명해주세요. 어떤 문제를 해결하나요? 누구를 위한 서비스인가요? 주요 기능은 무엇인가요?"
                    className="min-h-32 resize-none text-base leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 카테고리 */}
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
                const isSelected = formData.category === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
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

          {/* 기술 스택 */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                기술 스택
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                사용한 기술을 입력하세요 (Enter로 추가, 최대 10개)
              </p>
            </div>

            <div className="space-y-3">
              <Input
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                onKeyDown={handleTechStackKeyDown}
                placeholder="예: React, TypeScript, Node.js"
                className="h-11 text-base"
              />
              {formData.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.techStack.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm dark:border-surface-700 dark:bg-surface-800"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTechStackTag(tag)}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-700"
                      >
                        <X className="h-3 w-3 text-surface-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-6 py-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

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
