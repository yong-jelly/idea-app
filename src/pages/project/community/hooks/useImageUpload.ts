import { useState, useRef, useCallback } from "react";
import { filesToDataURLs } from "../utils/image.utils";

/**
 * 이미지 업로드 관련 상태와 핸들러를 제공하는 훅
 */
export function useImageUpload(maxImages: number = 3) {
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      try {
        const dataURLs = await filesToDataURLs(filesToProcess, remainingSlots);
        setImages((prev) => [...prev, ...dataURLs].slice(0, maxImages));
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [images.length, maxImages]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return {
    images,
    fileInputRef,
    handleImageUpload,
    removeImage,
    openFileDialog,
    clearImages,
    setImages,
  };
}

