import { useState } from "react";
import { useNavigate } from "react-router";
import { useUserStore } from "@/entities/user";
import { createProject } from "@/entities/project";
import {
  CreateProjectHeader,
  BasicInfoSection,
  CategorySection,
  CATEGORIES,
  TechStackSection,
  MediaSection,
  UrlSection,
  SubmitSection,
} from "@/features/project-create";

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

  const isValid = Boolean(
    formData.title.trim() && formData.shortDescription.trim() && formData.category
  );

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <CreateProjectHeader />

        {/* 폼 컨텐츠 */}
        <div className="space-y-6">
          <BasicInfoSection
            title={formData.title}
            shortDescription={formData.shortDescription}
            fullDescription={formData.fullDescription}
            thumbnailPreview={formData.thumbnailPreview}
            onTitleChange={(value) => updateField("title", value)}
            onShortDescriptionChange={(value) => updateField("shortDescription", value)}
            onFullDescriptionChange={(value) => updateField("fullDescription", value)}
            onThumbnailUpload={handleThumbnailUpload}
            onRemoveThumbnail={() => {
              updateField("thumbnailFile", null);
              updateField("thumbnailPreview", "");
            }}
          />

          <CategorySection
            selectedCategory={formData.category}
            onCategorySelect={(categoryId) => updateField("category", categoryId)}
          />

          <TechStackSection
            techStack={formData.techStack}
            onTechStackChange={(techStack) => updateField("techStack", techStack)}
          />

          <MediaSection
            screenshots={formData.screenshots}
            onScreenshotUpload={handleScreenshotUpload}
            onRemoveScreenshot={removeScreenshot}
          />

          <UrlSection
            repositoryUrl={formData.repositoryUrl}
            demoUrl={formData.demoUrl}
            androidStoreUrl={formData.androidStoreUrl}
            iosStoreUrl={formData.iosStoreUrl}
            macStoreUrl={formData.macStoreUrl}
            onRepositoryUrlChange={(value) => updateField("repositoryUrl", value)}
            onDemoUrlChange={(value) => updateField("demoUrl", value)}
            onAndroidStoreUrlChange={(value) => updateField("androidStoreUrl", value)}
            onIosStoreUrlChange={(value) => updateField("iosStoreUrl", value)}
            onMacStoreUrlChange={(value) => updateField("macStoreUrl", value)}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-6 py-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <SubmitSection
          isValid={isValid}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
