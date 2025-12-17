import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, Input, Textarea } from "@/shared/ui";
import type { MilestoneTask } from "@/entities/project";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: MilestoneTask | null;
  onSubmit: (data: { title: string; description: string; dueDate: string }) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  editingTask,
  onSubmit,
}: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || "",
        dueDate: editingTask.dueDate || "",
      });
    } else {
      setFormData({ title: "", description: "", dueDate: "" });
    }
  }, [editingTask, isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
          <header className="h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {editingTask ? "태스크 수정" : "새 태스크 추가"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <X className="h-5 w-5 text-surface-500" />
            </button>
          </header>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                제목 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="태스크 제목을 입력하세요"
                className="h-10"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                설명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="태스크에 대한 상세 설명을 입력하세요"
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                마감일
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="h-10"
              />
            </div>
          </div>
          <footer className="h-14 flex items-center justify-end gap-2 px-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
              {editingTask ? "수정" : "추가"}
            </Button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}

