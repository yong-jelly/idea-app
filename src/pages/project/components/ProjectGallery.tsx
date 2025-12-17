import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ProjectGalleryProps {
  images: string[];
}

export function ProjectGallery({ images }: ProjectGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="relative rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 aspect-video">
        <img
          src={images[currentImageIndex]}
          alt={`Gallery ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImageIndex((i) =>
                  i > 0 ? i - 1 : images.length - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() =>
                setCurrentImageIndex((i) =>
                  i < images.length - 1 ? i + 1 : 0
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      {/* Thumbnails */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            className={cn(
              "shrink-0 w-20 h-14 rounded-lg overflow-hidden ring-2 transition-all",
              currentImageIndex === idx
                ? "ring-primary-500"
                : "ring-transparent hover:ring-surface-300 dark:hover:ring-surface-600"
            )}
          >
            <img
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

