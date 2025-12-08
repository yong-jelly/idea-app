import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { useProjectStore } from "@/entities/project";

interface FeatureRequestFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FeatureRequestForm({ projectId, onSuccess, onCancel }: FeatureRequestFormProps) {
  const { user } = useUserStore();
  const { addFeatureRequest } = useProjectStore();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setIsSubmitting(true);

    try {
      addFeatureRequest({
        projectId,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        title: title.trim(),
        description: description.trim(),
      });

      setTitle("");
      setDescription("");
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          기능 제안하기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              제안 제목 *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 다크 모드 지원"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              상세 설명 *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 기능이 필요한지, 왜 필요한지 자세히 설명해주세요... (최소 20자)"
              className="min-h-32"
            />
            <p className="mt-1 text-xs text-slate-500">
              {description.length}/20 (최소 20자)
            </p>
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                "제안하기"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

