import { supabase } from "./supabase";

/**
 * Storage 버킷 이름
 */
export const STORAGE_BUCKETS = {
  USER_IMAGES: "1dd-user-images",
} as const;

/**
 * 이미지 리사이즈 옵션
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
  quality?: number; // 1-100
}

/**
 * 프로필 이미지 업로드
 * 
 * @param file - 업로드할 파일
 * @param userId - 사용자 ID (auth.uid())
 * @returns 업로드된 파일 경로
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<{ path: string; error: Error | null }> {
  try {
    // 파일 유효성 검사
    if (!file.type.startsWith("image/")) {
      return { path: "", error: new Error("이미지 파일만 업로드 가능합니다") };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { path: "", error: new Error("파일 크기는 5MB 이하여야 합니다") };
    }

    // 파일명 생성: profile-{timestamp}.{extension}
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `profile-${timestamp}.${extension}`;
    const filePath = `${userId}/images/profile/${fileName}`;

    // Storage에 업로드
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_IMAGES)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Storage 업로드 에러:", error);
      return { path: "", error: new Error(error.message) };
    }

    return { path: filePath, error: null };
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    return {
      path: "",
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로필 이미지 삭제
 * 
 * @param filePath - 삭제할 파일 경로
 * @returns 성공 여부
 */
export async function deleteProfileImage(
  filePath: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_IMAGES)
      .remove([filePath]);

    if (error) {
      console.error("Storage 삭제 에러:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("이미지 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 이미지 URL 가져오기 (리사이즈 옵션 포함)
 * 
 * @param filePath - 파일 경로
 * @param transform - 리사이즈 옵션
 * @returns 이미지 URL
 */
export function getImageUrl(
  filePath: string,
  transform?: ImageTransformOptions
): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.USER_IMAGES)
    .getPublicUrl(filePath, {
      transform: transform
        ? {
            width: transform.width,
            height: transform.height,
            resize: transform.resize || "cover",
            quality: transform.quality || 80,
          }
        : undefined,
    });

  return data.publicUrl;
}

/**
 * 프로필 이미지 URL 가져오기 (프리셋)
 * 
 * @param filePath - 파일 경로
 * @param size - 이미지 크기 ('sm' | 'md' | 'lg' | 'xl')
 * @returns 이미지 URL
 */
export function getProfileImageUrl(
  filePath: string | null | undefined,
  size: "sm" | "md" | "lg" | "xl" = "md"
): string | undefined {
  if (!filePath) return undefined;

  const sizeMap = {
    sm: { width: 40, height: 40 },
    md: { width: 100, height: 100 },
    lg: { width: 200, height: 200 },
    xl: { width: 400, height: 400 },
  };

  return getImageUrl(filePath, {
    ...sizeMap[size],
    resize: "cover",
    quality: 85,
  });
}

