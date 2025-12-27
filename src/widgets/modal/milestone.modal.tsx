/**
 * 마일스톤 작성/수정 모달 컴포넌트
 * 
 * 프로젝트 마일스톤(목표)을 작성하고 수정하는 모달입니다.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
} from "lucide-react";
import { Button, Textarea, Input } from "@/shared/ui";
import type { Milestone } from "@/entities/project";
import {
  createMilestone,
  updateMilestone,
} from "@/entities/project/api/project.api";

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMilestone: Milestone | null;
  projectId: string;
  onSave: () => void; // 저장 후 마일스톤 목록 새로고침을 위한 콜백
}

export function MilestoneModal({
  isOpen,
  onClose,
  editingMilestone,
  projectId,
  onSave,
}: MilestoneModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 모달이 열릴 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (editingMilestone) {
        setFormData({
          title: editingMilestone.title,
          description: editingMilestone.description,
          dueDate: editingMilestone.dueDate || "",
        });
      } else {
        setFormData({ title: "", description: "", dueDate: "" });
      }
    }
  }, [isOpen, editingMilestone]);

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
   * 마일스톤 저장 핸들러
   * 새 마일스톤 추가 또는 기존 마일스톤 수정
   */
  const handleSave = async () => {
    if (!formData.title.trim() || isSaving) return;

    setIsSaving(true);

    try {
      if (editingMilestone) {
        // 마일스톤 수정
        const { error } = await updateMilestone(editingMilestone.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error) {
          console.error("마일스톤 수정 실패:", error);
          alert(error.message || "마일스톤 수정에 실패했습니다");
          setIsSaving(false);
          return;
        }
      } else {
        // 마일스톤 생성
        const { milestoneId, error } = await createMilestone(projectId, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error || !milestoneId) {
          console.error("마일스톤 생성 실패:", error);
          alert(error?.message || "마일스톤 생성에 실패했습니다");
          setIsSaving(false);
          return;
        }
      }

      // 마일스톤 목록 새로고침을 위한 콜백 호출
      onClose();
      onSave();
    } catch (err) {
      console.error("마일스톤 저장 에러:", err);
      alert("마일스톤 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
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
        <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
          
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
                {editingMilestone ? "목표 편집" : "새 목표"}
              </h1>
            </div>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={!formData.title.trim() || isSaving}
              className="rounded-full"
            >
              {isSaving ? "처리 중..." : editingMilestone ? "저장" : "추가"}
            </Button>
          </header>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6">
              {/* 목표 이름 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  목표 이름 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="예: v2.0 출시, 1000명 사용자 달성"
                  maxLength={50}
                  disabled={isSaving}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.title.length}/50
                </p>
              </div>

              {/* 기한 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  목표 기한
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                  disabled={isSaving}
                />
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  설명
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="이 목표에 대해 간단히 설명해주세요"
                  maxLength={200}
                  rows={3}
                  disabled={isSaving}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.description.length}/200
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

