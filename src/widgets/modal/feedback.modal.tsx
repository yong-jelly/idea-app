/**
 * 사용자 피드백 작성/수정 모달 컴포넌트
 * 
 * 사용자가 버그 리포트, 기능 요청, 개선 제안 등을 작성하고 수정하는 모달입니다.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  X,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Textarea, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { supabase } from "@/shared/lib/supabase";
import { uploadPostImages, extractStoragePath } from "@/shared/lib/storage";
import type { UserFeedback } from "@/pages/project/community/types";
import { FEEDBACK_TYPE_INFO } from "@/pages/project/community/constants";

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFeedback: UserFeedback | null;
  projectId: string;
  onSave: () => void; // 저장 후 피드백 목록 새로고침을 위한 콜백
  onDelete?: (feedbackId: string) => void; // 삭제 핸들러
}

export function UserFeedbackModal({
  isOpen,
  onClose,
  editingFeedback,
  projectId,
  onSave,
  onDelete,
}: UserFeedbackModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    type: "feature" as "bug" | "feature" | "improvement" | "question",
    title: "",
    content: "",
    images: [] as Array<{ file: File | null; preview: string }>, // 기존 이미지는 file이 null, preview는 URL
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // 모달이 열릴 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (editingFeedback) {
        // 기존 이미지를 preview로 설정 (file은 null)
        const existingImages = (editingFeedback.images || []).map((url) => ({
          file: null as File | null,
          preview: url,
        }));
        setFormData({
          type: editingFeedback.type,
          title: editingFeedback.title,
          content: editingFeedback.content,
          images: existingImages,
        });
      } else {
        setFormData({ type: "feature", title: "", content: "", images: [] });
      }
    }
  }, [isOpen, editingFeedback]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  /**
   * 이미지 업로드 핸들러
   * 최대 3개까지 업로드 가능
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const MAX_IMAGES = 3;
    const remainingSlots = MAX_IMAGES - formData.images.length;
    
    if (remainingSlots <= 0) {
      alert(`최대 ${MAX_IMAGES}개까지 추가할 수 있습니다.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    // 새 파일들을 preview와 함께 추가
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, { file, preview: reader.result as string }].slice(0, MAX_IMAGES),
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * 이미지 제거 핸들러
   */
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /**
   * 피드백 저장 핸들러
   * 새 피드백 추가 또는 기존 피드백 수정
   */
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    const hasNewImages = formData.images.some(img => img.file !== null);

    try {
      // Supabase Auth에서 현재 사용자의 auth_id 가져오기
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        alert("로그인이 필요합니다.");
        setIsSubmitting(false);
        return;
      }

      if (editingFeedback) {
        // 피드백 수정
        // 기존 이미지 유지: file이 null이고 preview가 있는 경우 (Storage URL에서 경로 추출)
        const existingImagePaths = formData.images
          .filter((img) => img.file === null && img.preview)
          .map((img) => {
            // preview가 Storage URL이면 경로 추출, 이미 경로면 그대로 사용
            return extractStoragePath(img.preview);
          });
        
        // 새로 업로드할 이미지 파일만 필터링
        const newImageFiles = formData.images
          .filter((img) => img.file !== null)
          .map((img) => img.file as File);
        
        let allImagePaths: string[] = [...existingImagePaths];
        
        // 새 이미지가 있으면 업로드
        if (newImageFiles.length > 0) {
          setIsUploadingImages(true);
          const { paths, error: uploadError } = await uploadPostImages(
            newImageFiles,
            authUser.id,
            editingFeedback.id
          );

          if (uploadError) {
            alert(`이미지 업로드 실패: ${uploadError.message}`);
            setIsSubmitting(false);
            setIsUploadingImages(false);
            return;
          }

          allImagePaths = [...existingImagePaths, ...paths];
        }

        const finalImages = allImagePaths.length > 0 ? allImagePaths : [];

        const { error } = await supabase
          .schema("odd")
          .rpc("v1_update_feedback", {
            p_post_id: editingFeedback.id,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: finalImages,
            p_feedback_type: formData.type,
          });

        if (error) {
          console.error("피드백 수정 실패:", error);
          alert(`피드백 수정 실패: ${error.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      } else {
        // 새 피드백 생성: 먼저 피드백을 생성하고, 실제 포스트 ID로 이미지를 업로드
        const { data: postId, error: createError } = await supabase
          .schema("odd")
          .rpc("v1_create_feedback", {
            p_project_id: projectId,
            p_feedback_type: formData.type,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: [], // 먼저 빈 배열로 생성
          });

        if (createError) {
          console.error("피드백 생성 실패:", createError);
          alert(`피드백 생성 실패: ${createError.message}`);
          setIsSubmitting(false);
          return;
        }

        // 피드백 생성 후 실제 포스트 ID로 이미지 업로드
        const newImageFiles = formData.images
          .filter((img) => img.file !== null)
          .map((img) => img.file as File);
        
        if (newImageFiles.length > 0 && postId) {
          setIsUploadingImages(true);
          const { paths, error: uploadError } = await uploadPostImages(
            newImageFiles,
            authUser.id,
            postId
          );

          if (uploadError) {
            console.error("이미지 업로드 실패:", uploadError);
            alert(`이미지 업로드 실패: ${uploadError.message}`);
            // 피드백은 이미 생성되었으므로 계속 진행 (이미지 없이 생성됨)
          } else if (paths.length > 0) {
            // 이미지 경로를 피드백(포스트)에 업데이트
            const { error: updateError } = await supabase
              .schema("odd")
              .from("tbl_posts")
              .update({ images: paths })
              .eq("id", postId);

            if (updateError) {
              console.error("이미지 경로 업데이트 실패:", updateError);
            }
          }
        }
      }

      // 피드백 목록 새로고침을 위한 콜백 호출
      onClose();
      onSave();
    } catch (err) {
      console.error("피드백 저장 에러:", err);
      alert("피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = () => {
    if (!editingFeedback || !onDelete) return;
    
    if (!confirm("정말 이 피드백을 삭제하시겠습니까?")) {
      return;
    }
    
    onDelete(editingFeedback.id);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
          
          {/* 헤더 */}
          <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </button>
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {editingFeedback ? "피드백 수정" : "피드백 작성"}
              </h1>
            </div>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={
                isSubmitting ||
                isUploadingImages ||
                !formData.title.trim() || 
                !formData.content.trim()
              }
              className="rounded-full"
            >
              {isUploadingImages ? "이미지 업로드 중..." : isSubmitting ? "저장 중..." : editingFeedback ? "저장" : "작성"}
            </Button>
          </header>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6">
              {/* 피드백 타입 선택 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  타입 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["feature", "bug", "improvement", "question"] as const).map((type) => {
                    const info = FEEDBACK_TYPE_INFO[type];
                    const Icon = info.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type }))}
                        disabled={isSubmitting || isUploadingImages}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                          formData.type === type
                            ? cn(info.color, info.color.includes("rose") ? "border-rose-300 dark:border-rose-700" : info.color.includes("amber") ? "border-amber-300 dark:border-amber-700" : info.color.includes("blue") ? "border-blue-300 dark:border-blue-700" : "border-primary-300 dark:border-primary-700")
                            : "border-transparent bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 제목 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="피드백 제목을 입력하세요"
                  maxLength={100}
                  disabled={isSubmitting || isUploadingImages}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.title.length}/100
                </p>
              </div>

              {/* 내용 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  내용 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="피드백 내용을 자세히 작성해주세요. 버그의 경우 재현 방법, 기능 요청의 경우 사용 시나리오를 포함해주세요."
                  maxLength={2000}
                  rows={6}
                  disabled={isSubmitting || isUploadingImages}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.content.length}/2000
                </p>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  이미지 (최대 3개)
                </label>
                
                {/* 이미지 미리보기 */}
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.images.map((image, index) => {
                      return (
                        <div key={index} className="relative">
                          <img
                            src={image.preview}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                            disabled={isSubmitting || isUploadingImages}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* 이미지 업로드 버튼 */}
                {formData.images.length < 3 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isSubmitting || isUploadingImages}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg text-surface-500 hover:border-primary-300 hover:text-primary-500 dark:hover:border-primary-700 transition-colors"
                      disabled={isSubmitting || isUploadingImages}
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-sm">이미지 추가 ({formData.images.length}/3)</span>
                    </button>
                  </>
                )}
                <p className="text-xs text-surface-400">
                  스크린샷이나 관련 이미지를 첨부하면 더 명확하게 전달할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          
          {/* 푸터 - 삭제 버튼 (수정 모드에서만) */}
          {editingFeedback && (
            <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                disabled={isSubmitting || isUploadingImages}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                피드백 삭제
              </Button>
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

