import { supabase } from "@/shared/lib/supabase";
import { uploadProjectThumbnail, uploadProjectScreenshots, getProjectImageUrl } from "@/shared/lib/storage";
import { getProfileImageUrl } from "@/shared/lib/storage";
import type { ProjectCategory, Project } from "../model/project.types";

/**
 * 프로젝트 생성 시 데이터베이스에 저장할 데이터 타입
 */
export interface CreateProjectData {
  title: string;
  short_description: string;
  full_description?: string;
  category: ProjectCategory;
  tech_stack: string[]; // JSON 배열로 저장
  thumbnail?: string; // Storage 경로 또는 URL
  gallery_images?: string[]; // Storage 경로 배열 (JSON으로 저장)
  repository_url?: string;
  demo_url?: string;
  android_store_url?: string;
  ios_store_url?: string;
  mac_store_url?: string;
  author_id?: number; // tbl_users.id (bigint) - 선택사항, API에서 자동 조회
}

/**
 * 프로젝트 생성 결과
 */
export interface CreateProjectResult {
  projectId: string | null;
  error: Error | null;
}

/**
 * 프로젝트 생성
 * 
 * @param data - 프로젝트 데이터
 * @param thumbnailFile - 썸네일 파일 (선택)
 * @param screenshotFiles - 갤러리 이미지 파일 배열 (선택)
 * @returns 생성된 프로젝트 ID 또는 에러
 */
export async function createProject(
  data: CreateProjectData,
  thumbnailFile?: File | null,
  screenshotFiles?: File[]
): Promise<CreateProjectResult> {
  try {
    // 현재 로그인한 사용자의 auth_id 확인
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        projectId: null,
        error: new Error("로그인이 필요합니다"),
      };
    }

    // auth_id로 사용자 정보 조회 (RLS 정책과 일치하도록)
    const { data: dbUser, error: userError } = await supabase
      .schema("odd")
      .from("tbl_users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !dbUser) {
      console.error("사용자 조회 에러:", userError);
      return {
        projectId: null,
        error: new Error("사용자 정보를 찾을 수 없습니다"),
      };
    }

    // 1. 프로젝트 데이터 먼저 생성 (projectId 필요)
    const projectData: any = {
      title: data.title,
      short_description: data.short_description,
      full_description: data.full_description || null,
      category: data.category,
      tech_stack: data.tech_stack,
      repository_url: data.repository_url || null,
      demo_url: data.demo_url || null,
      android_store_url: data.android_store_url || null,
      ios_store_url: data.ios_store_url || null,
      mac_store_url: data.mac_store_url || null,
      author_id: dbUser.id, // DB에서 조회한 실제 사용자 ID 사용
      likes_count: 0,
      comments_count: 0,
      backers_count: 0,
      current_funding: 0,
      target_funding: 0,
      days_left: 0,
      status: "funding",
      featured: false,
      created_at: new Date().toISOString(),
    };

    // 인증 세션 확인 (디버깅용)
    const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
    if (sessionCheckError || !session) {
      console.error("세션 확인 에러:", sessionCheckError);
      return {
        projectId: null,
        error: new Error("인증 세션이 없습니다. 다시 로그인해주세요."),
      };
    }
    console.log("인증 세션 확인:", {
      userId: session.user.id,
      authorId: dbUser.id,
      hasAccessToken: !!session.access_token,
    });

    // 프로젝트 생성
    const { data: project, error: insertError } = await supabase
      .schema("odd")
      .from("projects")
      .insert(projectData)
      .select("id")
      .single();

    if (insertError || !project) {
      console.error("프로젝트 생성 에러:", {
        error: insertError,
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        projectData: {
          ...projectData,
          author_id: dbUser.id,
        },
        authUserId: authUser.id,
        dbUserId: dbUser.id,
      });
      return {
        projectId: null,
        error: new Error(insertError?.message || "프로젝트 생성에 실패했습니다"),
      };
    }

    const projectId = project.id;

    // 2. 이미지 업로드 (프로젝트 생성 성공 후)
    let thumbnailPath: string | undefined = data.thumbnail;
    let galleryImagePaths: string[] = data.gallery_images || [];

    // 썸네일 업로드
    if (thumbnailFile) {
      const { path, error: uploadError } = await uploadProjectThumbnail(
        thumbnailFile,
        authUser.id, // auth_id (UUID) 사용
        projectId
      );

      if (uploadError) {
        console.error("썸네일 업로드 에러:", uploadError);
        // 이미지 업로드 실패해도 프로젝트는 생성되었으므로 경고만
        console.warn("썸네일 업로드 실패, 프로젝트는 생성되었습니다");
      } else {
        thumbnailPath = path;
      }
    }

    // 갤러리 이미지 업로드
    if (screenshotFiles && screenshotFiles.length > 0) {
      const { paths, error: uploadError } = await uploadProjectScreenshots(
        screenshotFiles,
        authUser.id, // auth_id (UUID) 사용
        projectId
      );

      if (uploadError) {
        console.error("갤러리 이미지 업로드 에러:", uploadError);
        console.warn("갤러리 이미지 업로드 실패, 프로젝트는 생성되었습니다");
      } else {
        galleryImagePaths = paths;
      }
    }

    // 3. 이미지 경로 업데이트 (이미지가 업로드된 경우)
    if (thumbnailPath || galleryImagePaths.length > 0) {
      const updateData: any = {};
      if (thumbnailPath) {
        updateData.thumbnail = thumbnailPath;
      }
      if (galleryImagePaths.length > 0) {
        updateData.gallery_images = galleryImagePaths;
      }

      const { error: updateError } = await supabase
        .schema("odd")
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (updateError) {
        console.error("이미지 경로 업데이트 에러:", updateError);
        // 업데이트 실패해도 프로젝트는 생성되었으므로 경고만
        console.warn("이미지 경로 업데이트 실패, 프로젝트는 생성되었습니다");
      }
    }

    return {
      projectId,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 생성 에러:", err);
    return {
      projectId: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 목록 조회 옵션
 */
export interface FetchProjectsOptions {
  featured?: boolean; // 주목할 프로젝트만 조회
  category?: ProjectCategory; // 카테고리 필터
  limit?: number; // 조회 개수 제한
  offset?: number; // 페이지네이션 오프셋
  orderBy?: "created_at" | "likes_count" | "comments_count"; // 정렬 기준
  orderDirection?: "asc" | "desc"; // 정렬 방향
}

/**
 * 프로젝트 목록 조회 결과
 */
export interface FetchProjectsResult {
  projects: Project[];
  error: Error | null;
}

/**
 * 프로젝트 목록 조회
 * 
 * @param options - 조회 옵션
 * @returns 프로젝트 목록 또는 에러
 */
export async function fetchProjects(
  options: FetchProjectsOptions = {}
): Promise<FetchProjectsResult> {
  try {
    const {
      featured,
      category,
      limit = 50,
      offset = 0,
      orderBy = "created_at",
      orderDirection = "desc",
    } = options;

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_projects", {
        p_featured: featured ?? null,
        p_category: category ?? null,
        p_limit: Math.min(limit, 100), // 최대 100으로 제한
        p_offset: Math.max(offset, 0), // 최소 0으로 제한
        p_order_by: orderBy,
        p_order_direction: orderDirection,
      });

    if (error) {
      console.error("프로젝트 목록 조회 에러:", error);
      return {
        projects: [],
        error: new Error(error.message || "프로젝트 목록을 불러오는데 실패했습니다"),
      };
    }

    if (!data) {
      return {
        projects: [],
        error: null,
      };
    }

    // DB 데이터를 Project 타입으로 변환
    const projects: Project[] = data.map((row: any) => {
      // 썸네일 URL 변환 (Storage 경로인 경우)
      let thumbnailUrl: string | undefined = undefined;
      if (row.thumbnail) {
        if (row.thumbnail.startsWith("http://") || row.thumbnail.startsWith("https://")) {
          thumbnailUrl = row.thumbnail;
        } else {
          thumbnailUrl = getProjectImageUrl(row.thumbnail);
        }
      }

      // 갤러리 이미지 URL 변환
      const galleryImages: string[] = [];
      if (row.gallery_images && Array.isArray(row.gallery_images)) {
        row.gallery_images.forEach((path: string) => {
          if (path.startsWith("http://") || path.startsWith("https://")) {
            galleryImages.push(path);
          } else {
            galleryImages.push(getProjectImageUrl(path));
          }
        });
      }

      // 기술 스택 파싱
      const techStack: string[] = [];
      if (row.tech_stack && Array.isArray(row.tech_stack)) {
        techStack.push(...row.tech_stack);
      }

      return {
        id: row.id,
        title: row.title,
        shortDescription: row.short_description,
        fullDescription: row.full_description || undefined,
        category: row.category as ProjectCategory,
        techStack,
        author: {
          id: String(row.author_id || ""),
          username: row.author_username || "",
          displayName: row.author_display_name || "",
          avatar: row.author_avatar_url ? getProfileImageUrl(row.author_avatar_url, "sm") : undefined,
        },
        thumbnail: thumbnailUrl,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        repositoryUrl: row.repository_url || undefined,
        demoUrl: row.demo_url || undefined,
        androidStoreUrl: row.android_store_url || undefined,
        iosStoreUrl: row.ios_store_url || undefined,
        macStoreUrl: row.mac_store_url || undefined,
        currentFunding: row.current_funding || 0,
        targetFunding: row.target_funding || 0,
        backersCount: row.backers_count || 0,
        likesCount: row.likes_count || 0,
        // TODO: 커뮤니티 기능 구현 후 실제 댓글 카운트로 변경
        commentsCount: row.comments_count || 0, // 현재는 DB의 기본값(0) 사용, 실제 댓글 시스템 연동 필요
        daysLeft: row.days_left || 0,
        status: row.status as Project["status"],
        featured: row.featured || false,
        createdAt: row.created_at,
      };
    });

    return {
      projects,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 목록 조회 에러:", err);
    return {
      projects: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 상세 조회 결과
 * 확장 가능한 구조로 설계 (추후 community, counters 등 추가 예정)
 */
export interface FetchProjectDetailResult {
  overview: {
    project: Project;
  };
  // TODO: 커뮤니티 기능 구현 후 추가
  // community?: {
  //   latestPosts: CommunityPost[];
  //   announcements: Announcement[];
  // };
  // TODO: 카운터 기능 구현 후 추가
  // counters?: {
  //   supporter: number;
  //   comments: number;
  //   saved: number;
  // };
  error: Error | null;
}

/**
 * 프로젝트 상세 조회
 * 
 * @param projectId - 프로젝트 ID
 * @returns 프로젝트 상세 정보 또는 에러
 */
export async function fetchProjectDetail(
  projectId: string
): Promise<FetchProjectDetailResult> {
  try {
    if (!projectId) {
      return {
        overview: {
          project: {} as Project,
        },
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_project_detail", {
        p_project_id: projectId,
      });

    if (error) {
      console.error("프로젝트 상세 조회 에러:", error);
      return {
        overview: {
          project: {} as Project,
        },
        error: new Error(error.message || "프로젝트를 불러오는데 실패했습니다"),
      };
    }

    if (!data || data.length === 0) {
      return {
        overview: {
          project: {} as Project,
        },
        error: new Error("프로젝트를 찾을 수 없습니다"),
      };
    }

    const row = data[0];

    // 썸네일 URL 변환 (Storage 경로인 경우)
    let thumbnailUrl: string | undefined = undefined;
    if (row.thumbnail) {
      if (row.thumbnail.startsWith("http://") || row.thumbnail.startsWith("https://")) {
        thumbnailUrl = row.thumbnail;
      } else {
        thumbnailUrl = getProjectImageUrl(row.thumbnail);
      }
    }

    // 갤러리 이미지 URL 변환
    const galleryImages: string[] = [];
    if (row.gallery_images && Array.isArray(row.gallery_images)) {
      row.gallery_images.forEach((path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) {
          galleryImages.push(path);
        } else {
          galleryImages.push(getProjectImageUrl(path));
        }
      });
    }

    // 기술 스택 파싱
    const techStack: string[] = [];
    if (row.tech_stack && Array.isArray(row.tech_stack)) {
      techStack.push(...row.tech_stack);
    }

    // Project 타입으로 변환
    const project: Project = {
      id: row.id,
      title: row.title,
      shortDescription: row.short_description,
      fullDescription: row.full_description || undefined,
      category: row.category as ProjectCategory,
      techStack,
      author: {
        id: String(row.author_id || ""),
        username: row.author_username || "",
        displayName: row.author_display_name || "",
        avatar: row.author_avatar_url ? getProfileImageUrl(row.author_avatar_url, "sm") : undefined,
      },
      thumbnail: thumbnailUrl,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      repositoryUrl: row.repository_url || undefined,
      demoUrl: row.demo_url || undefined,
      androidStoreUrl: row.android_store_url || undefined,
      iosStoreUrl: row.ios_store_url || undefined,
      macStoreUrl: row.mac_store_url || undefined,
      currentFunding: row.current_funding || 0,
      targetFunding: row.target_funding || 0,
      backersCount: row.backers_count || 0,
      likesCount: row.likes_count || 0,
      // TODO: 커뮤니티 기능 구현 후 실제 댓글 카운트로 변경
      commentsCount: row.comments_count || 0, // 현재는 DB의 기본값(0) 사용, 실제 댓글 시스템 연동 필요
      daysLeft: row.days_left || 0,
      status: row.status as Project["status"],
      featured: row.featured || false,
      createdAt: row.created_at,
    };

    return {
      overview: {
        project,
      },
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 상세 조회 에러:", err);
    return {
      overview: {
        project: {} as Project,
      },
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 댓글 조회 결과
 */
export interface FetchProjectCommentsResult {
  comments: any[]; // DB에서 반환된 댓글 데이터 (정규화 전)
  error: Error | null;
}

/**
 * 프로젝트 댓글 조회
 * 
 * @param projectId - 프로젝트 ID (post_id로 사용)
 * @returns 댓글 목록 또는 에러
 */
export async function fetchProjectComments(
  projectId: string
): Promise<FetchProjectCommentsResult> {
  try {
    if (!projectId) {
      return {
        comments: [],
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    // 프로젝트 ID를 post_id로 사용하여 댓글 조회
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_comments", {
        p_post_id: projectId,
        p_limit: 200,
        p_offset: 0,
      });

    if (error) {
      console.error("프로젝트 댓글 조회 에러:", error);
      return {
        comments: [],
        error: new Error(error.message || "댓글을 불러오는데 실패했습니다"),
      };
    }

    return {
      comments: data || [],
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 조회 에러:", err);
    return {
      comments: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 댓글 생성 결과
 */
export interface CreateProjectCommentResult {
  comment: any | null;
  error: Error | null;
}

/**
 * 프로젝트 댓글 생성
 * 
 * @param projectId - 프로젝트 ID (post_id로 사용)
 * @param content - 댓글 내용
 * @param parentId - 부모 댓글 ID (답글인 경우)
 * @param images - 이미지 URL 배열 (선택)
 * @returns 생성된 댓글 또는 에러
 */
export async function createProjectComment(
  projectId: string,
  content: string,
  parentId?: string,
  images?: string[]
): Promise<CreateProjectCommentResult> {
  try {
    if (!projectId || !content.trim()) {
      return {
        comment: null,
        error: new Error("프로젝트 ID와 댓글 내용이 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_create_comment", {
        p_post_id: projectId,
        p_content: content.trim(),
        p_parent_id: parentId || null,
        p_images: images ? (images as any) : [],
      });

    if (error) {
      console.error("프로젝트 댓글 생성 에러:", error);
      return {
        comment: null,
        error: new Error(error.message || "댓글 작성에 실패했습니다"),
      };
    }

    return {
      comment: data,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 생성 에러:", err);
    return {
      comment: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 댓글 수정 결과
 */
export interface UpdateProjectCommentResult {
  comment: any | null;
  error: Error | null;
}

/**
 * 프로젝트 댓글 수정
 * 
 * @param commentId - 댓글 ID
 * @param content - 수정할 댓글 내용
 * @param images - 이미지 URL 배열 (선택)
 * @returns 수정된 댓글 또는 에러
 */
export async function updateProjectComment(
  commentId: string,
  content: string,
  images?: string[]
): Promise<UpdateProjectCommentResult> {
  try {
    if (!commentId || !content.trim()) {
      return {
        comment: null,
        error: new Error("댓글 ID와 내용이 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_update_comment", {
        p_comment_id: commentId,
        p_content: content.trim(),
        p_images: images ? (images as any) : null,
      });

    if (error) {
      console.error("프로젝트 댓글 수정 에러:", error);
      return {
        comment: null,
        error: new Error(error.message || "댓글 수정에 실패했습니다"),
      };
    }

    return {
      comment: data,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 수정 에러:", err);
    return {
      comment: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 댓글 삭제 결과
 */
export interface DeleteProjectCommentResult {
  success: boolean;
  error: Error | null;
}

/**
 * 프로젝트 댓글 삭제
 * 
 * @param commentId - 댓글 ID
 * @returns 삭제 성공 여부 또는 에러
 */
export async function deleteProjectComment(
  commentId: string
): Promise<DeleteProjectCommentResult> {
  try {
    if (!commentId) {
      return {
        success: false,
        error: new Error("댓글 ID가 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_delete_comment", {
        p_comment_id: commentId,
      });

    if (error) {
      console.error("프로젝트 댓글 삭제 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "댓글 삭제에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 프로젝트 댓글 좋아요 토글 결과
 */
export interface ToggleProjectCommentLikeResult {
  isLiked: boolean;
  likesCount: number;
  error: Error | null;
}

/**
 * 프로젝트 댓글 좋아요 토글
 * 
 * @param commentId - 댓글 ID
 * @returns 좋아요 상태 및 카운트 또는 에러
 */
export async function toggleProjectCommentLike(
  commentId: string
): Promise<ToggleProjectCommentLikeResult> {
  try {
    if (!commentId) {
      return {
        isLiked: false,
        likesCount: 0,
        error: new Error("댓글 ID가 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_comment_like", {
        p_comment_id: commentId,
      });

    if (error) {
      console.error("프로젝트 댓글 좋아요 토글 에러:", error);
      return {
        isLiked: false,
        likesCount: 0,
        error: new Error(error.message || "좋아요 처리에 실패했습니다"),
      };
    }

    const result = data as { is_liked: boolean; likes_count: number };

    return {
      isLiked: result.is_liked,
      likesCount: result.likes_count,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 좋아요 토글 에러:", err);
    return {
      isLiked: false,
      likesCount: 0,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

