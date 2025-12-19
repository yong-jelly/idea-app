import { useEffect } from "react";

/**
 * 모달의 ESC 키 닫기 및 body 스크롤 잠금을 처리하는 훅
 */
export function useModal(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // ESC 키 이벤트는 부모 컴포넌트에서 처리하도록 함
        // 필요시 callback을 받아서 처리할 수 있음
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);
}

/**
 * 모달의 ESC 키 닫기 및 body 스크롤 잠금을 처리하는 훅 (onClose 콜백 포함)
 */
export function useModalWithClose(isOpen: boolean, onClose: () => void) {
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
}

