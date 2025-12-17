import { Upload, X } from "lucide-react";
import { Input, Textarea } from "@/shared/ui";

interface BasicInfoSectionProps {
  title: string;
  shortDescription: string;
  fullDescription: string;
  thumbnailPreview: string;
  onTitleChange: (value: string) => void;
  onShortDescriptionChange: (value: string) => void;
  onFullDescriptionChange: (value: string) => void;
  onThumbnailUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveThumbnail: () => void;
}

export function BasicInfoSection({
  title,
  shortDescription,
  fullDescription,
  thumbnailPreview,
  onTitleChange,
  onShortDescriptionChange,
  onFullDescriptionChange,
  onThumbnailUpload,
  onRemoveThumbnail,
}: BasicInfoSectionProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="border-b border-surface-100 px-6 py-4 dark:border-surface-800">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
          기본 정보
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          프로젝트의 핵심 정보를 입력하세요
        </p>
      </div>

      <div className="divide-y divide-surface-100 dark:divide-surface-800">
        <div className="flex flex-col gap-5 px-6 py-5 md:flex-row">
          {/* 대표 이미지 (썸네일) */}
          <div className="flex-shrink-0">
            <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
              프로젝트 썸네일
            </label>
            {thumbnailPreview ? (
              <div className="group relative">
                <img
                  src={thumbnailPreview}
                  alt="Project thumbnail"
                  className="h-24 w-24 rounded-2xl border border-surface-200 object-cover shadow-sm dark:border-surface-600"
                />
                <button
                  type="button"
                  onClick={onRemoveThumbnail}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50 transition-all hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:bg-surface-800/50 dark:hover:border-primary-500">
                <Upload className="h-6 w-6 text-surface-400" />
                <span className="mt-1 text-xs text-surface-400">업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onThumbnailUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 제목 */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              프로젝트 제목 <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="예: AI 기반 코드 리뷰 도구"
              className="h-12 text-base"
            />
            <p className="text-xs text-surface-400">
              프로젝트를 대표하는 이름을 입력하세요
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              짧은 설명 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={shortDescription}
              onChange={(e) => onShortDescriptionChange(e.target.value)}
              placeholder="프로젝트를 한 줄로 요약해주세요 (예: 머신러닝을 활용한 자동 코드 리뷰 도구)"
              className="min-h-20 resize-none text-base leading-relaxed"
              maxLength={200}
            />
            <p className="text-xs text-surface-400">
              {shortDescription.length}/200
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              상세 설명
            </label>
            <Textarea
              value={fullDescription}
              onChange={(e) => onFullDescriptionChange(e.target.value)}
              placeholder="프로젝트에 대해 자세히 설명해주세요. 어떤 문제를 해결하나요? 누구를 위한 서비스인가요? 주요 기능은 무엇인가요?"
              className="min-h-32 resize-none text-base leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

