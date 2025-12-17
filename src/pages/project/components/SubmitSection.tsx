import { Sparkles } from "lucide-react";
import { Button } from "@/shared/ui";

interface SubmitSectionProps {
  isValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitSection({
  isValid,
  isSubmitting,
  onSubmit,
}: SubmitSectionProps) {
  return (
    <div className="mt-8 rounded-xl border border-surface-200 bg-white px-6 py-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            프로젝트 등록 마무리
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            입력한 내용을 확인한 뒤 등록을 완료하세요
          </p>
        </div>
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="h-11 gap-2 rounded-full px-6"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              등록 중
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              등록하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

