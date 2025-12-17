import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera, Link as LinkIcon, Github, Twitter, X, ArrowLeft } from "lucide-react";
import { Button, Input, Textarea, Avatar } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";
import {
  uploadProfileImage,
  deleteProfileImage,
  getProfileImageUrl,
} from "@/shared/lib/storage";

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

  // links를 formData에서 관리 (DB의 links 컬럼과 매핑)
  const getLinksFromUser = () => {
    if (user?.website || user?.github || user?.twitter) {
      return {
        website: user.website || "",
        github: user.github || "",
        twitter: user.twitter || "",
      };
    }
    return { website: "", github: "", twitter: "" };
  };

  const [links, setLinks] = useState(getLinksFromUser());

  const [previewAvatar, setPreviewAvatar] = useState<string | undefined>(user?.avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      // avatar_url이 있으면 Storage 경로로 간주하고 리사이즈된 URL 사용
      setPreviewAvatar(
        user.avatar
          ? getProfileImageUrl(user.avatar, "xl")
          : undefined
      );
      setLinks(getLinksFromUser());
      setSelectedFile(null);
    }
  }, [user, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkChange = (field: "website" | "github" | "twitter", value: string) => {
    setLinks((prev) => ({ ...prev, [field]: value }));
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

      // 파일 선택 시 미리보기만 표시 (업로드는 저장 시 수행)
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewAvatar(result);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    // 기존 이미지가 있으면 삭제
    if (user?.avatar && !selectedFile) {
      const { error } = await deleteProfileImage(user.avatar);
      if (error) {
        console.error("이미지 삭제 에러:", error);
        // 삭제 실패해도 UI는 업데이트
      }
    }

    setPreviewAvatar(undefined);
    setFormData((prev) => ({ ...prev, avatar: "" }));
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.displayName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (!user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setIsUploadingImage(selectedFile !== null);

    try {
      let avatarPath: string | null = null;

      // 새 이미지가 선택된 경우 업로드
      if (selectedFile) {
        setIsUploadingImage(true);
        
        // Supabase Auth에서 현재 사용자의 auth_id 가져오기
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          alert("로그인이 필요합니다.");
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        }

        const { path, error: uploadError } = await uploadProfileImage(
          selectedFile,
          authUser.id // auth_id (UUID) 사용
        );

        if (uploadError) {
          alert(`이미지 업로드 실패: ${uploadError.message}`);
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        }

        avatarPath = path;

        // 기존 이미지가 있으면 삭제
        if (user.avatar && user.avatar !== avatarPath) {
          await deleteProfileImage(user.avatar);
        }
      } else if (!previewAvatar && user.avatar) {
        // 이미지가 제거된 경우 (preview가 없고 기존 이미지가 있음)
        await deleteProfileImage(user.avatar);
        avatarPath = ""; // 빈 문자열로 전달하여 DB에서 null로 처리
      } else if (previewAvatar && user.avatar) {
        // 기존 이미지 유지
        avatarPath = user.avatar;
      }

      // links 객체 생성 (빈 값 제거)
      const linksData: Record<string, string> = {};
      if (links.website.trim()) linksData.website = links.website.trim();
      if (links.github.trim()) linksData.github = links.github.trim();
      if (links.twitter.trim()) linksData.twitter = links.twitter.trim();

      // Supabase API 호출
      const bioValue = formData.bio.trim();
      
      const { data: updatedUser, error } = await supabase
        .schema("odd")
        .rpc("v1_update_user_profile", {
          p_display_name: formData.displayName.trim(),
          p_bio: bioValue,
          p_avatar_url: avatarPath !== null ? avatarPath : undefined,
          p_links: Object.keys(linksData).length > 0 ? linksData : null,
        });

      if (error) {
        console.error("프로필 업데이트 에러:", error);
        alert(`프로필 업데이트 실패: ${error.message}`);
        setIsLoading(false);
        setIsUploadingImage(false);
        return;
      }

      // UserStore 업데이트 (리사이즈된 URL 사용)
      updateUser({
        displayName: updatedUser.display_name || "",
        bio: updatedUser.bio || undefined,
        website: linksData.website || undefined,
        github: linksData.github || undefined,
        twitter: linksData.twitter || undefined,
        avatar: updatedUser.avatar_url || undefined, // Storage 경로 저장
      });

      setIsLoading(false);
      setIsUploadingImage(false);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err) {
      console.error("프로필 업데이트 에러:", err);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
      setIsLoading(false);
      setIsUploadingImage(false);
    }
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
    setPreviewAvatar(
      user?.avatar ? getProfileImageUrl(user.avatar, "xl") : undefined
    );
    setLinks(getLinksFromUser());
    setSelectedFile(null);
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
              disabled={isLoading || isUploadingImage}
              isLoading={isLoading || isUploadingImage}
              className="rounded-full"
            >
              {isUploadingImage ? "이미지 업로드 중..." : isLoading ? "저장 중..." : "저장"}
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
                  {!isUploadingImage && (
                    <>
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={isLoading}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </button>
                      {previewAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isLoading}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-surface-900 text-white hover:bg-surface-700 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading || isUploadingImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isLoading || isUploadingImage}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? "이미지 선택됨" : "이미지 변경"}
                </button>
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-surface-400 dark:text-surface-500">
                    댓글 등을 통해 다른 사용자들에게 보여지는 이름입니다.
                  </span>
                </div>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="이름을 입력하세요"
                  maxLength={30}
                  disabled={isLoading}
                />
                <p className="text-xs text-surface-500 text-right">
                  {formData.displayName.length}/30
                </p>
              </div>

              {/* 자기소개 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    자기소개
                  </label>
                  <span className="text-xs text-surface-400 dark:text-surface-500">
                    프로필 페이지에서 다른 사용자들에게 보여지는 정보입니다.
                  </span>
                </div>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="자신을 소개해주세요"
                  maxLength={160}
                  rows={3}
                  disabled={isLoading}
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
                    value={links.website}
                    onChange={(e) => handleLinkChange("website", e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>

                {/* GitHub */}
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={links.github}
                    onChange={(e) => handleLinkChange("github", e.target.value)}
                    placeholder="GitHub 사용자명"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>

                {/* Twitter */}
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={links.twitter}
                    onChange={(e) => handleLinkChange("twitter", e.target.value)}
                    placeholder="Twitter 사용자명 (@제외)"
                    className="pl-10"
                    disabled={isLoading}
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
