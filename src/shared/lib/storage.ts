import { supabase } from "./supabase";

/**
 * Storage 버킷 이름
 */
export const STORAGE_BUCKETS = {
  USER_IMAGES: "1dd-user-images",
  PROJECT_IMAGES: "1dd-user-images", // 같은 버킷 사용, 경로로 구분
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
  const transformOptions = transform
    ? {
        width: transform.width,
        height: transform.height,
        resize: transform.resize || "cover",
        quality: transform.quality || 80,
      }
    : undefined;

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.USER_IMAGES)
    .getPublicUrl(filePath, {
      transform: transformOptions,
    });

  // 개발 환경에서 생성된 URL 확인용 로그
  if (import.meta.env.DEV && transformOptions) {
    console.log("[Storage] 이미지 리사이즈 URL 생성:", {
      filePath,
      transform: transformOptions,
      url: data.publicUrl,
    });
  }

  return data.publicUrl;
}

/**
 * 프로필 이미지 URL 가져오기 (프리셋)
 * 
 * @param filePath - 파일 경로 또는 이미지 URL
 * @param size - 이미지 크기 ('sm' | 'md' | 'lg' | 'xl')
 * @returns 이미지 URL
 */
export function getProfileImageUrl(
  filePath: string | null | undefined,
  size: "sm" | "md" | "lg" | "xl" = "md"
): string | undefined {
  if (!filePath) return undefined;

  // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
  // Storage 경로가 아닌 외부 URL이므로 리사이즈 불가, 그대로 반환
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

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

/**
 * 프로젝트 썸네일 업로드
 * 
 * @param file - 업로드할 파일
 * @param userId - 사용자 ID (auth.uid())
 * @param projectId - 프로젝트 ID
 * @returns 업로드된 파일 경로
 */
export async function uploadProjectThumbnail(
  file: File,
  userId: string,
  projectId: string
): Promise<{ path: string; error: Error | null }> {
  try {
    // 파일 유효성 검사
    if (!file.type.startsWith("image/")) {
      return { path: "", error: new Error("이미지 파일만 업로드 가능합니다") };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { path: "", error: new Error("파일 크기는 5MB 이하여야 합니다") };
    }

    // 파일명 생성: thumbnail-{timestamp}.{extension}
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `thumbnail-${timestamp}.${extension}`;
    const filePath = `${userId}/images/projects/${projectId}/${fileName}`;

    // Storage에 업로드
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.PROJECT_IMAGES)
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
 * 프로젝트 갤러리 이미지 업로드
 * 
 * @param files - 업로드할 파일 배열
 * @param userId - 사용자 ID (auth.uid())
 * @param projectId - 프로젝트 ID
 * @returns 업로드된 파일 경로 배열
 */
export async function uploadProjectScreenshots(
  files: File[],
  userId: string,
  projectId: string
): Promise<{ paths: string[]; error: Error | null }> {
  try {
    const paths: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 파일 유효성 검사
      if (!file.type.startsWith("image/")) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 이미지 파일만 업로드 가능합니다`) };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 파일 크기는 5MB 이하여야 합니다`) };
      }

      // 파일명 생성: screenshot-{timestamp}-{index}.{extension}
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `screenshot-${timestamp}-${i}.${extension}`;
      const filePath = `${userId}/images/projects/${projectId}/screenshots/${fileName}`;

      // Storage에 업로드
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.PROJECT_IMAGES)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) {
        console.error(`Storage 업로드 에러 (파일 ${i + 1}):`, error);
        return { paths: [], error: new Error(`파일 ${i + 1} 업로드 실패: ${error.message}`) };
      }

      paths.push(filePath);
    }

    return { paths, error: null };
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    return {
      paths: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 이미지 URL 가져오기
 * 
 * @param filePath - 파일 경로
 * @param transform - 리사이즈 옵션
 * @returns 이미지 URL
 */
export function getProjectImageUrl(
  filePath: string,
  transform?: ImageTransformOptions
): string {
  return getImageUrl(filePath, transform);
}

/**
 * 포스트 이미지 업로드
 * 
 * @param files - 업로드할 파일 배열 (최대 3개)
 * @param userId - 사용자 ID (auth.uid())
 * @param postId - 포스트 ID
 * @returns 업로드된 파일 경로 배열
 */
export async function uploadPostImages(
  files: File[],
  userId: string,
  postId: string
): Promise<{ paths: string[]; error: Error | null }> {
  try {
    if (files.length === 0) {
      return { paths: [], error: null };
    }

    if (files.length > 3) {
      return { paths: [], error: new Error("이미지는 최대 3개까지 업로드 가능합니다") };
    }

    const paths: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 파일 유효성 검사
      if (!file.type.startsWith("image/")) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 이미지 파일만 업로드 가능합니다`) };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 파일 크기는 5MB 이하여야 합니다`) };
      }

      // 파일명 생성: post-{timestamp}-{index}.{extension}
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `post-${timestamp}-${i}.${extension}`;
      const filePath = `${userId}/images/posts/${postId}/${fileName}`;

      // Storage에 업로드
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_IMAGES)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) {
        console.error(`Storage 업로드 에러 (파일 ${i + 1}):`, error);
        return { paths: [], error: new Error(`파일 ${i + 1} 업로드 실패: ${error.message}`) };
      }

      paths.push(filePath);
    }

    return { paths, error: null };
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    return {
      paths: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 댓글 이미지 업로드
 * 
 * @param files - 업로드할 파일 배열 (최대 3개)
 * @param userId - 사용자 ID (auth.uid())
 * @param commentId - 댓글 ID
 * @returns 업로드된 파일 경로 배열
 */
export async function uploadCommentImages(
  files: File[],
  userId: string,
  commentId: string
): Promise<{ paths: string[]; error: Error | null }> {
  try {
    if (files.length === 0) {
      return { paths: [], error: null };
    }

    if (files.length > 3) {
      return { paths: [], error: new Error("이미지는 최대 3개까지 업로드 가능합니다") };
    }

    const paths: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 파일 유효성 검사
      if (!file.type.startsWith("image/")) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 이미지 파일만 업로드 가능합니다`) };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { paths: [], error: new Error(`파일 ${i + 1}: 파일 크기는 5MB 이하여야 합니다`) };
      }

      // 파일명 생성: comment-{timestamp}-{index}.{extension}
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `comment-${timestamp}-${i}.${extension}`;
      const filePath = `${userId}/images/comments/${commentId}/${fileName}`;

      // Storage에 업로드
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_IMAGES)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) {
        console.error(`Storage 업로드 에러 (파일 ${i + 1}):`, error);
        return { paths: [], error: new Error(`파일 ${i + 1} 업로드 실패: ${error.message}`) };
      }

      paths.push(filePath);
    }

    return { paths, error: null };
  } catch (err) {
    console.error("이미지 업로드 에러:", err);
    return {
      paths: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

