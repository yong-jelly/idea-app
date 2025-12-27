import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, Textarea } from "@/shared/ui";

interface DevResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  onSubmit: (response: string) => void;
}

export function DevResponseModal({
  isOpen,
  onClose,
  initialValue = "",
  onSubmit,
}: DevResponseModalProps) {
  const [response, setResponse] = useState(initialValue);

  useEffect(() => {
    setResponse(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
              개발자 답변 작성
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <X className="h-5 w-5 text-surface-500" />
            </button>
          </header>
          <div className="p-4 space-y-4">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="사용자에게 전달할 공식 답변을 작성하세요..."
              className="min-h-[120px]"
              autoFocus
            />
            <p className="text-xs text-surface-500">
              공식 답변은 피드백 상단에 강조되어 표시됩니다.
            </p>
          </div>
          <footer className="h-14 flex items-center justify-end gap-2 px-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              onClick={() => {
                onSubmit(response);
                onClose();
              }}
              disabled={!response.trim()}
            >
              저장
            </Button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}

