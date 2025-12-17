import { X, Image as ImageIcon } from "lucide-react";

interface Screenshot {
  file: File;
  preview: string;
}

interface MediaSectionProps {
  screenshots: Screenshot[];
  onScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: (index: number) => void;
}

export function MediaSection({
  screenshots,
  onScreenshotUpload,
  onRemoveScreenshot,
}: MediaSectionProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
        스크린샷
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400">
        앱 화면이나 기능을 보여주는 이미지를 추가하세요
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {screenshots.map((screenshot, index) => (
          <div key={index} className="group relative">
            <img
              src={screenshot.preview}
              alt={`Screenshot ${index + 1}`}
              className="h-28 w-auto rounded-lg border border-surface-200 object-cover shadow-sm dark:border-surface-600"
            />
            <button
              type="button"
              onClick={() => onRemoveScreenshot(index)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-surface-300 bg-surface-50 transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-primary-500">
          <ImageIcon className="h-6 w-6 text-surface-400" />
          <span className="text-xs text-surface-400">추가</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onScreenshotUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

