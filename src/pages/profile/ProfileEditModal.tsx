import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera, Link as LinkIcon, Github, Twitter, X, ArrowLeft } from "lucide-react";
import { Button, Input, Textarea, Avatar } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

export interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user, updateUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    website: user?.website || "",
    github: user?.github || "",
    twitter: user?.twitter || "",
    avatar: user?.avatar || "",
  });

  const [previewAvatar, setPreviewAvatar] = useState<string | undefined>(user?.avatar);
  const [isLoading, setIsLoading] = useState(false);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  // user가 변경되면 formData 업데이트
  useEffect(() => {
    if (user && open) {
      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
        avatar: user.avatar || "",
      });
      setPreviewAvatar(user.avatar);
    }
  }, [user, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewAvatar(result);
        setFormData((prev) => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(undefined);
    setFormData((prev) => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.displayName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    updateUser({
      displayName: formData.displayName.trim(),
      bio: formData.bio.trim() || undefined,
      website: formData.website.trim() || undefined,
      github: formData.github.trim() || undefined,
      twitter: formData.twitter.trim() || undefined,
      avatar: formData.avatar || undefined,
    });

    setIsLoading(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      website: user?.website || "",
      github: user?.github || "",
      twitter: user?.twitter || "",
      avatar: user?.avatar || "",
    });
    setPreviewAvatar(user?.avatar);
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 - 데스크톱에서만 보임 */}
      <div
        className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-xl md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
          
          {/* 헤더 */}
          <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </button>
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                프로필 수정
              </h1>
            </div>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </header>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6">
              {/* 프로필 이미지 */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    src={previewAvatar}
                    alt={formData.displayName}
                    fallback={formData.displayName}
                    size="xl"
                    className="h-24 w-24"
                  />
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  {previewAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-surface-900 text-white hover:bg-surface-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  이미지 변경
                </button>
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  이름 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="이름을 입력하세요"
                  maxLength={30}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.displayName.length}/30
                </p>
              </div>

              {/* 자기소개 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  자기소개
                </label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="자신을 소개해주세요"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.bio.length}/160
                </p>
              </div>

              {/* 링크 섹션 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  링크
                </label>

                {/* 웹사이트 */}
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>

                {/* GitHub */}
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={formData.github}
                    onChange={(e) => handleChange("github", e.target.value)}
                    placeholder="GitHub 사용자명"
                    className="pl-10"
                  />
                </div>

                {/* Twitter */}
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={formData.twitter}
                    onChange={(e) => handleChange("twitter", e.target.value)}
                    placeholder="Twitter 사용자명 (@제외)"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
