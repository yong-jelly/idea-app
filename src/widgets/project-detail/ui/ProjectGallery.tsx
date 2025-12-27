import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ProjectGalleryProps {
  images: string[];
}

export function ProjectGallery({ images }: ProjectGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Compact gallery for sidebar
  return (
    <>
      <div className="space-y-2">
        {/* Main image */}
        <button
          onClick={() => openLightbox(0)}
          className="w-full aspect-video rounded-lg overflow-hidden bg-surface-100 dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-surface-300 dark:hover:ring-surface-600 transition-all"
        >
          <img
            src={images[0]}
            alt="Gallery"
            className="w-full h-full object-cover"
          />
        </button>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-1.5">
            {images.slice(1, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx + 1)}
                className="aspect-square rounded-md overflow-hidden bg-surface-100 dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-surface-300 dark:hover:ring-surface-600 transition-all relative"
              >
                <img src={img} alt={`Gallery ${idx + 2}`} className="w-full h-full object-cover" />
                {/* Show remaining count on last visible thumbnail */}
                {idx === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">+{images.length - 5}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
        onNext={() => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
        onSelect={setLightboxIndex}
      />
    </>
  );
}

// Lightbox component
function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <span className="text-white/80 text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
          title="닫기 (ESC)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Click to close overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />

      {/* Image */}
      <div className="absolute inset-0 flex items-center justify-center p-16 pointer-events-none">
        <img
          src={images[currentIndex]}
          alt={`Gallery ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain pointer-events-auto rounded-lg ring-1 ring-white/10"
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            title="이전 (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            title="다음 (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className={cn(
                  "shrink-0 w-16 h-12 rounded-lg overflow-hidden ring-2 transition-all",
                  currentIndex === idx
                    ? "ring-white"
                    : "ring-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




