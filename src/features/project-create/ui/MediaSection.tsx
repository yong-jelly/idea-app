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

const MAX_SCREENSHOTS = 10;

export function MediaSection({
  screenshots,
  onScreenshotUpload,
  onRemoveScreenshot,
}: MediaSectionProps) {
  const canAddMore = screenshots.length < MAX_SCREENSHOTS;
  const remainingCount = MAX_SCREENSHOTS - screenshots.length;

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
            스크린샷
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            앱 화면이나 기능을 보여주는 이미지를 추가하세요 (최대 {MAX_SCREENSHOTS}개)
          </p>
        </div>
        {screenshots.length > 0 && (
          <span className="text-xs text-surface-400 dark:text-surface-500">
            {screenshots.length}/{MAX_SCREENSHOTS}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {screenshots.map((screenshot, index) => (
          <div key={index} className="group relative">
            <img
              src={screenshot.preview}
              alt={`Screenshot ${index + 1}`}
              className="h-28 w-40 rounded-lg border border-surface-200 object-cover shadow-sm dark:border-surface-600"
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
        {canAddMore && (
          <label className="flex h-28 w-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-surface-300 bg-surface-50 transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-primary-500">
            <ImageIcon className="h-6 w-6 text-surface-400" />
            <span className="text-xs text-surface-400">추가</span>
            {remainingCount < MAX_SCREENSHOTS && (
              <span className="text-xs text-surface-300 dark:text-surface-600">
                {remainingCount}개 남음
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onScreenshotUpload}
              className="hidden"
            />
          </label>
        )}
        {!canAddMore && (
          <div className="flex h-28 w-40 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-surface-200 bg-surface-50/50 dark:border-surface-700 dark:bg-surface-800/30">
            <ImageIcon className="h-6 w-6 text-surface-300 dark:text-surface-600" />
            <span className="text-xs text-surface-300 dark:text-surface-600">
              최대 {MAX_SCREENSHOTS}개
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

