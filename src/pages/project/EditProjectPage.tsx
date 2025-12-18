import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useUserStore } from "@/entities/user";
import { updateProject, fetchProjectDetail, type Project } from "@/entities/project";
import {
  EditProjectHeader,
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

export function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
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

  // 프로젝트 데이터 로드
  useEffect(() => {
    if (!id) {
      setError("프로젝트 ID가 필요합니다");
      setIsLoading(false);
      return;
    }

    const loadProject = async () => {
      setIsLoading(true);
      setError(null);

      const { overview, error: fetchError } = await fetchProjectDetail(id);

      if (fetchError || !overview.project) {
        console.error("프로젝트 조회 실패:", fetchError);
        setError(fetchError?.message || "프로젝트를 찾을 수 없습니다");
        setIsLoading(false);
        return;
      }

      const loadedProject = overview.project;

      // 작성자 확인
      if (!user || user.id !== loadedProject.author.id) {
        setError("프로젝트를 수정할 권한이 없습니다");
        setIsLoading(false);
        return;
      }

      setProject(loadedProject);

      // 카테고리 ID 찾기 (mappedCategory로 역매핑)
      const categoryId = CATEGORIES.find(
        (c) => c.mappedCategory === loadedProject.category
      )?.id || "";

      // 기존 이미지들을 preview로 설정
      const thumbnailPreview = loadedProject.thumbnail || "";
      const screenshotPreviews: Array<{ file: File; preview: string }> = 
        (loadedProject.galleryImages || []).map((url) => ({
          file: null as any, // 기존 이미지는 File 객체가 없음
          preview: url,
        }));

      setFormData({
        title: loadedProject.title,
        shortDescription: loadedProject.shortDescription,
        fullDescription: loadedProject.fullDescription || "",
        category: categoryId,
        techStack: loadedProject.techStack || [],
        thumbnailFile: null,
        thumbnailPreview,
        screenshots: screenshotPreviews,
        repositoryUrl: loadedProject.repositoryUrl || "",
        demoUrl: loadedProject.demoUrl || "",
        androidStoreUrl: loadedProject.androidStoreUrl || "",
        iosStoreUrl: loadedProject.iosStoreUrl || "",
        macStoreUrl: loadedProject.macStoreUrl || "",
      });

      setIsLoading(false);
    };

    loadProject();
  }, [id, user]);

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
    const MAX_SCREENSHOTS = 10;
    const availableSlots = MAX_SCREENSHOTS - formData.screenshots.length;
    
    if (files.length > availableSlots) {
      alert(`최대 ${MAX_SCREENSHOTS}개까지 추가할 수 있습니다. 현재 ${formData.screenshots.length}개가 등록되어 있어 ${availableSlots}개만 추가할 수 있습니다.`);
      files.slice(0, availableSlots).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            screenshots: [...prev.screenshots, { file, preview: reader.result as string }],
          }));
        };
        reader.readAsDataURL(file);
      });
      return;
    }
    
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
    if (!user || !id) {
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

      // 새로 업로드할 스크린샷 파일만 필터링 (기존 이미지는 file이 null)
      const newScreenshotFiles = formData.screenshots
        .filter((s) => s.file !== null)
        .map((s) => s.file);

      // 기존 이미지 URL 유지 (file이 null인 경우)
      const existingImageUrls = formData.screenshots
        .filter((s) => s.file === null)
        .map((s) => s.preview);

      const { success, error: updateError } = await updateProject(
        id,
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
          // 기존 이미지 URL 유지 (새 파일이 없는 경우)
          gallery_images: existingImageUrls.length > 0 ? existingImageUrls : undefined,
        },
        formData.thumbnailFile,
        newScreenshotFiles.length > 0 ? newScreenshotFiles : undefined
      );

      if (!success || updateError) {
        throw updateError || new Error("프로젝트 수정에 실패했습니다");
      }

      // 성공 시 프로젝트 페이지로 이동
      navigate(`/project/${id}`);
    } catch (err) {
      console.error("프로젝트 수정 에러:", err);
      setError(err instanceof Error ? err.message : "프로젝트 수정에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  const isValid = Boolean(
    formData.title.trim() && formData.shortDescription.trim() && formData.category
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        {id && <EditProjectHeader projectId={id} />}

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
            defaultOpen={true}
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
          mode="edit"
        />
      </div>
    </div>
  );
}

