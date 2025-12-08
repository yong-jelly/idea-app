import { useState, useRef } from "react";
import { Image, AtSign, Hash, Smile, X, Loader2 } from "lucide-react";
import { Button, Card, Avatar, Textarea, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { usePostStore, type PostType } from "@/entities/post";

const MAX_LENGTH = 280;

interface PostComposerProps {
  projectId?: string;
  projectTitle?: string;
  /** modal: 모달 내부에서 사용 (Card 없음), inline: 피드 상단에서 사용 (Card 있음) */
  variant?: "inline" | "modal";
  onSuccess?: () => void;
}

export function PostComposer({ projectId, projectTitle, variant = "inline", onSuccess }: PostComposerProps) {
  const { user } = useUserStore();
  const { addPost } = usePostStore();
  
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedProject, setLinkedProject] = useState<{ id: string; title: string } | null>(
    projectId && projectTitle ? { id: projectId, title: projectTitle } : null
  );
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;

    setIsSubmitting(true);

    try {
      const postType: PostType = linkedProject ? "project_update" : "text";
      
      addPost({
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        type: postType,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        projectId: linkedProject?.id,
        projectTitle: linkedProject?.title,
      });

      setContent("");
      setImages([]);
      setLinkedProject(null);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 데모에서는 파일 URL을 생성하지 않고 placeholder 사용
    const newImages = Array.from(files).map(
      (_, i) => `/placeholder-image-${Date.now()}-${i}.jpg`
    );
    setImages((prev) => [...prev, ...newImages].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user) return null;

  const composerContent = (
    <div className="flex gap-3">
      <Avatar
        src={user.avatar}
        alt={user.displayName}
        fallback={user.displayName}
        size="md"
      />

      <div className="flex-1">
        {/* Linked Project */}
        {linkedProject && (
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Hash className="h-3 w-3" />
              {linkedProject.title}
              <button
                onClick={() => setLinkedProject(null)}
                className="ml-1 hover:text-accent-rose transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="무슨 일이 있나요? 프로젝트 소식을 공유하세요..."
          className={cn(
            "resize-none border-0 p-0 text-sm focus:ring-0 bg-transparent",
            variant === "modal" ? "min-h-32" : "min-h-24"
          )}
        />

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden"
              >
                <div className="flex h-full items-center justify-center text-sm text-surface-400">
                  이미지 {index + 1}
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-surface-900/60 p-1 text-white hover:bg-surface-900/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-800">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <AtSign className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Hash className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Smile className="h-[18px] w-[18px]" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Character Count */}
            <div
              className={cn(
                "text-xs tabular-nums",
                remainingChars <= 20
                  ? "text-accent-amber"
                  : "text-surface-400",
                isOverLimit && "text-accent-rose font-medium"
              )}
            >
              {remainingChars}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  게시 중...
                </>
              ) : (
                "게시하기"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal variant는 Card 없이 렌더링
  if (variant === "modal") {
    return composerContent;
  }

  // Inline variant는 Card로 감싸서 렌더링
  return (
    <Card variant="bordered" className="p-4">
      {composerContent}
    </Card>
  );
}
