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
 * 프로젝트 수정 시 데이터베이스에 저장할 데이터 타입
 */
export interface UpdateProjectData {
  title?: string;
  short_description?: string;
  full_description?: string;
  category?: ProjectCategory;
  tech_stack?: string[]; // JSON 배열로 저장
  thumbnail?: string; // Storage 경로 또는 URL
  gallery_images?: string[]; // Storage 경로 배열 (JSON으로 저장)
  repository_url?: string;
  demo_url?: string;
  android_store_url?: string;
  ios_store_url?: string;
  mac_store_url?: string;
}

/**
 * 프로젝트 수정 결과
 */
export interface UpdateProjectResult {
  success: boolean;
  error: Error | null;
}

/**
 * 프로젝트 수정
 * 
 * @param projectId - 수정할 프로젝트 ID
 * @param data - 프로젝트 데이터
 * @param thumbnailFile - 썸네일 파일 (선택, 새로 업로드하는 경우)
 * @param screenshotFiles - 갤러리 이미지 파일 배열 (선택, 새로 업로드하는 경우)
 * @returns 수정 성공 여부 또는 에러
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectData,
  thumbnailFile?: File | null,
  screenshotFiles?: File[]
): Promise<UpdateProjectResult> {
  try {
    if (!projectId) {
      return {
        success: false,
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    // 현재 로그인한 사용자의 auth_id 확인
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: new Error("로그인이 필요합니다"),
      };
    }

    // auth_id로 사용자 정보 조회
    const { data: dbUser, error: userError } = await supabase
      .schema("odd")
      .from("tbl_users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !dbUser) {
      console.error("사용자 조회 에러:", userError);
      return {
        success: false,
        error: new Error("사용자 정보를 찾을 수 없습니다"),
      };
    }

    // 프로젝트 소유자 확인
    const { data: project, error: projectError } = await supabase
      .schema("odd")
      .from("projects")
      .select("author_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: new Error("프로젝트를 찾을 수 없습니다"),
      };
    }

    if (project.author_id !== dbUser.id) {
      return {
        success: false,
        error: new Error("프로젝트를 수정할 권한이 없습니다"),
      };
    }

    // 1. 이미지 업로드 (새로 업로드하는 경우)
    let thumbnailPath: string | undefined = data.thumbnail;
    // 기존 이미지 URL 유지 (data.gallery_images에 기존 이미지 URL이 있음)
    let galleryImagePaths: string[] = data.gallery_images || [];

    // 썸네일 업로드
    if (thumbnailFile) {
      const { path, error: uploadError } = await uploadProjectThumbnail(
        thumbnailFile,
        authUser.id,
        projectId
      );

      if (uploadError) {
        console.error("썸네일 업로드 에러:", uploadError);
        return {
          success: false,
          error: new Error("썸네일 업로드에 실패했습니다"),
        };
      }
      thumbnailPath = path;
    }

    // 갤러리 이미지 업로드 (기존 이미지와 합치기)
    if (screenshotFiles && screenshotFiles.length > 0) {
      const { paths, error: uploadError } = await uploadProjectScreenshots(
        screenshotFiles,
        authUser.id,
        projectId
      );

      if (uploadError) {
        console.error("갤러리 이미지 업로드 에러:", uploadError);
        return {
          success: false,
          error: new Error("갤러리 이미지 업로드에 실패했습니다"),
        };
      }
      // 기존 이미지 URL과 새로 업로드한 경로를 합침
      galleryImagePaths = [...galleryImagePaths, ...paths];
    }

    // 2. 프로젝트 데이터 업데이트
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.short_description !== undefined) updateData.short_description = data.short_description;
    if (data.full_description !== undefined) updateData.full_description = data.full_description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tech_stack !== undefined) updateData.tech_stack = data.tech_stack;
    if (thumbnailPath !== undefined) updateData.thumbnail = thumbnailPath;
    // gallery_images는 항상 업데이트 (기존 이미지 + 새 이미지 합친 배열)
    if (data.gallery_images !== undefined || galleryImagePaths.length > 0) {
      updateData.gallery_images = galleryImagePaths;
    }
    if (data.repository_url !== undefined) updateData.repository_url = data.repository_url || null;
    if (data.demo_url !== undefined) updateData.demo_url = data.demo_url || null;
    if (data.android_store_url !== undefined) updateData.android_store_url = data.android_store_url || null;
    if (data.ios_store_url !== undefined) updateData.ios_store_url = data.ios_store_url || null;
    if (data.mac_store_url !== undefined) updateData.mac_store_url = data.mac_store_url || null;

    const { error: updateError } = await supabase
      .schema("odd")
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .eq("author_id", dbUser.id); // 소유자 확인을 위해 추가 조건

    if (updateError) {
      console.error("프로젝트 수정 에러:", updateError);
      return {
        success: false,
        error: new Error(updateError.message || "프로젝트 수정에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 수정 에러:", err);
    return {
      success: false,
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
 * 프로젝트 댓글 조회 옵션
 */
export interface FetchProjectCommentsOptions {
  /** 페이지당 최상위 댓글 수 (기본값: 30) */
  limit?: number;
  /** 페이지 오프셋 (기본값: 0) */
  offset?: number;
}

/**
 * 프로젝트 댓글 조회 결과
 */
export interface FetchProjectCommentsResult {
  comments: any[]; // DB에서 반환된 댓글 데이터 (정규화 전)
  /** 페이징 정보 */
  pagination: {
    totalCount: number; // 전체 댓글 개수 (답글 포함, 삭제된 댓글 포함)
    deletedTotalCount: number; // 삭제된 댓글 개수 (답글 포함)
    topLevelCount: number; // 최상위 댓글 개수 (depth=0)
    size: number;
    offset: number;
    hasMore: boolean;
  };
  /** 메타 정보 */
  meta: {
    postId: string;
    limit: number;
    offset: number;
    serverTime: string;
  };
  error: Error | null;
}

/**
 * 프로젝트 댓글 조회
 * 
 * @param projectId - 프로젝트 ID (post_id로 사용)
 * @param options - 페이징 옵션
 * @returns 댓글 목록 또는 에러
 */
export async function fetchProjectComments(
  projectId: string,
  options: FetchProjectCommentsOptions = {}
): Promise<FetchProjectCommentsResult> {
  try {
    if (!projectId) {
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          deletedTotalCount: 0,
          topLevelCount: 0,
          size: 0,
          offset: 0,
          hasMore: false,
        },
        meta: {
          postId: projectId,
          limit: 0,
          offset: 0,
          serverTime: new Date().toISOString(),
        },
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    const limit = options.limit ?? 30;
    const offset = options.offset ?? 0;

    // 프로젝트 ID를 post_id로 사용하여 댓글 조회
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_comments", {
        p_post_id: projectId,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) {
      console.error("프로젝트 댓글 조회 에러:", error);
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          topLevelCount: 0,
          size: limit,
          offset,
          hasMore: false,
        },
        meta: {
          postId: projectId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: new Error(error.message || "댓글을 불러오는데 실패했습니다"),
      };
    }

    // JSONB 응답 파싱
    const result = data as any;
    if (!result || typeof result !== 'object') {
      return {
        comments: [],
        pagination: {
          totalCount: 0,
          topLevelCount: 0,
          size: limit,
          offset,
          hasMore: false,
        },
        meta: {
          postId: projectId,
          limit,
          offset,
          serverTime: new Date().toISOString(),
        },
        error: new Error("잘못된 응답 형식입니다"),
      };
    }

    const comments = result.comments || [];
    const pagination = result.pagination || {
      totalCount: 0,
      topLevelCount: 0,
      size: limit,
      offset,
      hasMore: false,
    };
    const meta = result.meta || {
      postId: projectId,
      limit,
      offset,
      serverTime: new Date().toISOString(),
    };

    return {
      comments,
      pagination: {
        totalCount: pagination.total_count || 0,
        deletedTotalCount: pagination.deleted_total_count || 0,
        topLevelCount: pagination.top_level_count || 0,
        size: pagination.size || limit,
        offset: pagination.offset || offset,
        hasMore: pagination.has_more || false,
      },
      meta: {
        postId: meta.post_id || projectId,
        limit: meta.limit || limit,
        offset: meta.offset || offset,
        serverTime: meta.server_time || new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
    console.error("프로젝트 댓글 조회 에러:", err);
    return {
      comments: [],
      pagination: {
        totalCount: 0,
        deletedTotalCount: 0,
        topLevelCount: 0,
        size: options.limit ?? 30,
        offset: options.offset ?? 0,
        hasMore: false,
      },
      meta: {
        postId: projectId,
        limit: options.limit ?? 30,
        offset: options.offset ?? 0,
        serverTime: new Date().toISOString(),
      },
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
        p_source_type_code: "project",
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

    const { error } = await supabase
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

/**
 * 마일스톤 조회 옵션
 */
export interface FetchMilestonesOptions {
  /** 상태 필터: 'all', 'open', 'closed' (기본값: 'all') */
  status?: "all" | "open" | "closed";
  /** 페이지당 마일스톤 수 (기본값: 30, 최대: 100) */
  limit?: number;
  /** 페이지 오프셋 (기본값: 0) */
  offset?: number;
}

/**
 * 마일스톤 조회 결과
 */
export interface FetchMilestonesResult {
  milestones: Milestone[];
  error: Error | null;
}

/**
 * 마일스톤 목록 조회
 * 
 * @param projectId - 프로젝트 ID
 * @param options - 조회 옵션
 * @returns 마일스톤 목록 또는 에러
 */
export async function fetchMilestones(
  projectId: string,
  options: FetchMilestonesOptions = {}
): Promise<FetchMilestonesResult> {
  try {
    if (!projectId) {
      return {
        milestones: [],
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    const {
      status = "all",
      limit = 30,
      offset = 0,
    } = options;

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_milestones", {
        p_project_id: projectId,
        p_status: status === "all" ? null : status,
        p_limit: Math.min(limit, 100), // 최대 100으로 제한
        p_offset: Math.max(offset, 0), // 최소 0으로 제한
      });

    if (error) {
      console.error("마일스톤 목록 조회 에러:", error);
      return {
        milestones: [],
        error: new Error(error.message || "마일스톤 목록을 불러오는데 실패했습니다"),
      };
    }

    if (!data) {
      return {
        milestones: [],
        error: null,
      };
    }

    // DB 데이터를 Milestone 타입으로 변환
    const milestones: Milestone[] = data.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description || "",
      dueDate: row.due_date || undefined,
      status: row.status as Milestone["status"],
      openIssuesCount: row.open_issues_count || 0,
      closedIssuesCount: row.closed_issues_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at || undefined,
    }));

    return {
      milestones,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 목록 조회 에러:", err);
    return {
      milestones: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 마일스톤 생성 데이터
 */
export interface CreateMilestoneData {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD 형식
}

/**
 * 마일스톤 생성 결과
 */
export interface CreateMilestoneResult {
  milestoneId: string | null;
  error: Error | null;
}

/**
 * 마일스톤 생성
 * 
 * @param projectId - 프로젝트 ID
 * @param data - 마일스톤 데이터
 * @returns 생성된 마일스톤 ID 또는 에러
 */
export async function createMilestone(
  projectId: string,
  data: CreateMilestoneData
): Promise<CreateMilestoneResult> {
  try {
    if (!projectId || !data.title.trim()) {
      return {
        milestoneId: null,
        error: new Error("프로젝트 ID와 제목이 필요합니다"),
      };
    }

    const { data: result, error } = await supabase
      .schema("odd")
      .rpc("v1_create_milestone", {
        p_project_id: projectId,
        p_title: data.title.trim(),
        p_description: data.description?.trim() || null,
        p_due_date: data.dueDate || null,
      });

    if (error) {
      console.error("마일스톤 생성 에러:", error);
      return {
        milestoneId: null,
        error: new Error(error.message || "마일스톤 생성에 실패했습니다"),
      };
    }

    return {
      milestoneId: result,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 생성 에러:", err);
    return {
      milestoneId: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 마일스톤 수정 데이터
 */
export interface UpdateMilestoneData {
  title?: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD 형식
}

/**
 * 마일스톤 수정 결과
 */
export interface UpdateMilestoneResult {
  success: boolean;
  error: Error | null;
}

/**
 * 마일스톤 수정
 * 
 * @param milestoneId - 마일스톤 ID
 * @param data - 수정할 마일스톤 데이터
 * @returns 수정 성공 여부 또는 에러
 */
export async function updateMilestone(
  milestoneId: string,
  data: UpdateMilestoneData
): Promise<UpdateMilestoneResult> {
  try {
    if (!milestoneId) {
      return {
        success: false,
        error: new Error("마일스톤 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_update_milestone", {
        p_milestone_id: milestoneId,
        p_title: data.title?.trim() || null,
        p_description: data.description?.trim() || null,
        p_due_date: data.dueDate || null,
      });

    if (error) {
      console.error("마일스톤 수정 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "마일스톤 수정에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 수정 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 마일스톤 삭제 결과
 */
export interface DeleteMilestoneResult {
  success: boolean;
  error: Error | null;
}

/**
 * 마일스톤 삭제
 * 
 * @param milestoneId - 마일스톤 ID
 * @returns 삭제 성공 여부 또는 에러
 */
export async function deleteMilestone(
  milestoneId: string
): Promise<DeleteMilestoneResult> {
  try {
    if (!milestoneId) {
      return {
        success: false,
        error: new Error("마일스톤 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_delete_milestone", {
        p_milestone_id: milestoneId,
      });

    if (error) {
      console.error("마일스톤 삭제 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "마일스톤 삭제에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 마일스톤 상태 토글 결과
 */
export interface ToggleMilestoneStatusResult {
  success: boolean;
  error: Error | null;
}

/**
 * 마일스톤 상태 토글 (open ↔ closed)
 * 
 * @param milestoneId - 마일스톤 ID
 * @returns 토글 성공 여부 또는 에러
 */
export async function toggleMilestoneStatus(
  milestoneId: string
): Promise<ToggleMilestoneStatusResult> {
  try {
    if (!milestoneId) {
      return {
        success: false,
        error: new Error("마일스톤 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_milestone_status", {
        p_milestone_id: milestoneId,
      });

    if (error) {
      console.error("마일스톤 상태 토글 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "마일스톤 상태 변경에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 상태 토글 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 마일스톤 상세 조회 결과
 */
export interface FetchMilestoneDetailResult {
  milestone: Milestone | null;
  error: Error | null;
}

/**
 * 마일스톤 상세 조회
 * 
 * @param milestoneId - 마일스톤 ID
 * @returns 마일스톤 상세 정보 또는 에러
 */
export async function fetchMilestoneDetail(
  milestoneId: string
): Promise<FetchMilestoneDetailResult> {
  try {
    if (!milestoneId) {
      return {
        milestone: null,
        error: new Error("마일스톤 ID가 필요합니다"),
      };
    }

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_milestone_detail", {
        p_milestone_id: milestoneId,
      });

    if (error) {
      console.error("마일스톤 상세 조회 에러:", error);
      return {
        milestone: null,
        error: new Error(error.message || "마일스톤을 불러오는데 실패했습니다"),
      };
    }

    if (!data || data.length === 0) {
      return {
        milestone: null,
        error: new Error("마일스톤을 찾을 수 없습니다"),
      };
    }

    const row = data[0];

    // DB 데이터를 Milestone 타입으로 변환
    const milestone: Milestone = {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description || "",
      dueDate: row.due_date || undefined,
      status: row.status as Milestone["status"],
      openIssuesCount: row.open_issues_count || 0,
      closedIssuesCount: row.closed_issues_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at || undefined,
    };

    return {
      milestone,
      error: null,
    };
  } catch (err) {
    console.error("마일스톤 상세 조회 에러:", err);
    return {
      milestone: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 태스크 조회 옵션
 */
export interface FetchTasksOptions {
  /** 상태 필터: 'all', 'todo', 'done' (기본값: 'all') */
  status?: "all" | "todo" | "done";
  /** 페이지당 태스크 수 (기본값: 100, 최대: 200) */
  limit?: number;
  /** 페이지 오프셋 (기본값: 0) */
  offset?: number;
}

/**
 * 태스크 조회 결과
 */
export interface FetchTasksResult {
  tasks: MilestoneTask[];
  error: Error | null;
}

/**
 * 태스크 목록 조회
 * 
 * @param milestoneId - 마일스톤 ID
 * @param options - 조회 옵션
 * @returns 태스크 목록 또는 에러
 */
export async function fetchTasks(
  milestoneId: string,
  options: FetchTasksOptions = {}
): Promise<FetchTasksResult> {
  try {
    if (!milestoneId) {
      return {
        tasks: [],
        error: new Error("마일스톤 ID가 필요합니다"),
      };
    }

    const {
      status = "all",
      limit = 100,
      offset = 0,
    } = options;

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_tasks", {
        p_milestone_id: milestoneId,
        p_status: status === "all" ? null : status,
        p_limit: Math.min(limit, 200), // 최대 200으로 제한
        p_offset: Math.max(offset, 0), // 최소 0으로 제한
      });

    if (error) {
      console.error("태스크 목록 조회 에러:", error);
      return {
        tasks: [],
        error: new Error(error.message || "태스크 목록을 불러오는데 실패했습니다"),
      };
    }

    if (!data) {
      return {
        tasks: [],
        error: null,
      };
    }

    // DB 데이터를 MilestoneTask 타입으로 변환
    const tasks: MilestoneTask[] = data.map((row: any) => ({
      id: row.id,
      milestoneId: row.milestone_id,
      title: row.title,
      description: row.description || undefined,
      dueDate: row.due_date || undefined,
      status: row.status as MilestoneTask["status"],
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
    }));

    return {
      tasks,
      error: null,
    };
  } catch (err) {
    console.error("태스크 목록 조회 에러:", err);
    return {
      tasks: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 태스크 생성 데이터
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD 형식
}

/**
 * 태스크 생성 결과
 */
export interface CreateTaskResult {
  taskId: string | null;
  error: Error | null;
}

/**
 * 태스크 생성
 * 
 * @param milestoneId - 마일스톤 ID
 * @param data - 태스크 데이터
 * @returns 생성된 태스크 ID 또는 에러
 */
export async function createTask(
  milestoneId: string,
  data: CreateTaskData
): Promise<CreateTaskResult> {
  try {
    if (!milestoneId || !data.title.trim()) {
      return {
        taskId: null,
        error: new Error("마일스톤 ID와 제목이 필요합니다"),
      };
    }

    const { data: result, error } = await supabase
      .schema("odd")
      .rpc("v1_create_task", {
        p_milestone_id: milestoneId,
        p_title: data.title.trim(),
        p_description: data.description?.trim() || null,
        p_due_date: data.dueDate || null,
      });

    if (error) {
      console.error("태스크 생성 에러:", error);
      return {
        taskId: null,
        error: new Error(error.message || "태스크 생성에 실패했습니다"),
      };
    }

    return {
      taskId: result,
      error: null,
    };
  } catch (err) {
    console.error("태스크 생성 에러:", err);
    return {
      taskId: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 태스크 수정 데이터
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD 형식
}

/**
 * 태스크 수정 결과
 */
export interface UpdateTaskResult {
  success: boolean;
  error: Error | null;
}

/**
 * 태스크 수정
 * 
 * @param taskId - 태스크 ID
 * @param data - 수정할 태스크 데이터
 * @returns 수정 성공 여부 또는 에러
 */
export async function updateTask(
  taskId: string,
  data: UpdateTaskData
): Promise<UpdateTaskResult> {
  try {
    if (!taskId) {
      return {
        success: false,
        error: new Error("태스크 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_update_task", {
        p_task_id: taskId,
        p_title: data.title?.trim() || null,
        p_description: data.description?.trim() || null,
        p_due_date: data.dueDate || null,
      });

    if (error) {
      console.error("태스크 수정 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "태스크 수정에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("태스크 수정 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 태스크 삭제 결과
 */
export interface DeleteTaskResult {
  success: boolean;
  error: Error | null;
}

/**
 * 태스크 삭제
 * 
 * @param taskId - 태스크 ID
 * @returns 삭제 성공 여부 또는 에러
 */
export async function deleteTask(
  taskId: string
): Promise<DeleteTaskResult> {
  try {
    if (!taskId) {
      return {
        success: false,
        error: new Error("태스크 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_delete_task", {
        p_task_id: taskId,
      });

    if (error) {
      console.error("태스크 삭제 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "태스크 삭제에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("태스크 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 태스크 상태 토글 결과
 */
export interface ToggleTaskStatusResult {
  success: boolean;
  error: Error | null;
}

/**
 * 태스크 상태 토글 (todo ↔ done)
 * 
 * @param taskId - 태스크 ID
 * @returns 토글 성공 여부 또는 에러
 */
export async function toggleTaskStatus(
  taskId: string
): Promise<ToggleTaskStatusResult> {
  try {
    if (!taskId) {
      return {
        success: false,
        error: new Error("태스크 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_toggle_task_status", {
        p_task_id: taskId,
      });

    if (error) {
      console.error("태스크 상태 토글 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "태스크 상태 변경에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("태스크 상태 토글 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 변경사항 조회 옵션
 */
export interface FetchChangelogsOptions {
  /** 페이지당 변경사항 수 (기본값: 50, 최대: 100) */
  limit?: number;
  /** 페이지 오프셋 (기본값: 0) */
  offset?: number;
}

/**
 * 변경사항 조회 결과
 */
export interface FetchChangelogsResult {
  changelogs: import("@/pages/project/community/types").ChangelogEntry[];
  error: Error | null;
}

/**
 * 변경사항 목록 조회
 * 
 * @param projectId - 프로젝트 ID
 * @param options - 조회 옵션
 * @returns 변경사항 목록 또는 에러
 */
export async function fetchChangelogs(
  projectId: string,
  options: FetchChangelogsOptions = {}
): Promise<FetchChangelogsResult> {
  try {
    if (!projectId) {
      return {
        changelogs: [],
        error: new Error("프로젝트 ID가 필요합니다"),
      };
    }

    const {
      limit = 50,
      offset = 0,
    } = options;

    // SQL 함수 호출
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_changelogs", {
        p_project_id: projectId,
        p_limit: Math.min(limit, 100), // 최대 100으로 제한
        p_offset: Math.max(offset, 0), // 최소 0으로 제한
      });

    if (error) {
      console.error("변경사항 목록 조회 에러:", error);
      return {
        changelogs: [],
        error: new Error(error.message || "변경사항 목록을 불러오는데 실패했습니다"),
      };
    }

    if (!data) {
      return {
        changelogs: [],
        error: null,
      };
    }

    // DB 데이터를 ChangelogEntry 타입으로 변환
    const changelogs: import("@/pages/project/community/types").ChangelogEntry[] = data.map((row: any) => ({
      id: row.id,
      version: row.version,
      title: row.title,
      description: row.description || "",
      changes: (row.changes || []).map((change: any) => ({
        id: change.id || `ch-${Date.now()}-${Math.random()}`,
        type: change.type as "feature" | "improvement" | "fix" | "breaking",
        description: change.description,
      })),
      releasedAt: row.released_at,
      repositoryUrl: row.repository_url || undefined,
      downloadUrl: row.download_url || undefined,
    }));

    return {
      changelogs,
      error: null,
    };
  } catch (err) {
    console.error("변경사항 목록 조회 에러:", err);
    return {
      changelogs: [],
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 변경사항 생성 데이터
 */
export interface CreateChangelogData {
  version: string;
  title: string;
  description?: string;
  changes: Array<{
    id: string;
    type: "feature" | "improvement" | "fix" | "breaking";
    description: string;
  }>;
  releasedAt?: string; // YYYY-MM-DD 형식
  repositoryUrl?: string;
  downloadUrl?: string;
}

/**
 * 변경사항 생성 결과
 */
export interface CreateChangelogResult {
  changelogId: string | null;
  error: Error | null;
}

/**
 * 변경사항 생성
 * 
 * @param projectId - 프로젝트 ID
 * @param data - 변경사항 데이터
 * @returns 생성된 변경사항 ID 또는 에러
 */
export async function createChangelog(
  projectId: string,
  data: CreateChangelogData
): Promise<CreateChangelogResult> {
  try {
    if (!projectId || !data.version.trim() || !data.title.trim()) {
      return {
        changelogId: null,
        error: new Error("프로젝트 ID, 버전, 제목이 필요합니다"),
      };
    }

    const { data: result, error } = await supabase
      .schema("odd")
      .rpc("v1_create_changelog", {
        p_project_id: projectId,
        p_version: data.version.trim(),
        p_title: data.title.trim(),
        p_description: data.description?.trim() || null,
        p_changes: data.changes || [],
        p_released_at: data.releasedAt || null,
        p_repository_url: data.repositoryUrl || null,
        p_download_url: data.downloadUrl || null,
      });

    if (error) {
      console.error("변경사항 생성 에러:", error);
      return {
        changelogId: null,
        error: new Error(error.message || "변경사항 생성에 실패했습니다"),
      };
    }

    return {
      changelogId: result,
      error: null,
    };
  } catch (err) {
    console.error("변경사항 생성 에러:", err);
    return {
      changelogId: null,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 변경사항 수정 데이터
 */
export interface UpdateChangelogData {
  version?: string;
  title?: string;
  description?: string;
  changes?: Array<{
    id: string;
    type: "feature" | "improvement" | "fix" | "breaking";
    description: string;
  }>;
  releasedAt?: string; // YYYY-MM-DD 형식
  repositoryUrl?: string;
  downloadUrl?: string;
}

/**
 * 변경사항 수정 결과
 */
export interface UpdateChangelogResult {
  success: boolean;
  error: Error | null;
}

/**
 * 변경사항 수정
 * 
 * @param changelogId - 변경사항 ID
 * @param data - 수정할 변경사항 데이터
 * @returns 수정 성공 여부 또는 에러
 */
export async function updateChangelog(
  changelogId: string,
  data: UpdateChangelogData
): Promise<UpdateChangelogResult> {
  try {
    if (!changelogId) {
      return {
        success: false,
        error: new Error("변경사항 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_update_changelog", {
        p_changelog_id: changelogId,
        p_version: data.version?.trim() || null,
        p_title: data.title?.trim() || null,
        p_description: data.description?.trim() || null,
        p_changes: data.changes ? (data.changes as any) : null,
        p_released_at: data.releasedAt || null,
        p_repository_url: data.repositoryUrl || null,
        p_download_url: data.downloadUrl || null,
      });

    if (error) {
      console.error("변경사항 수정 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "변경사항 수정에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("변경사항 수정 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

/**
 * 변경사항 삭제 결과
 */
export interface DeleteChangelogResult {
  success: boolean;
  error: Error | null;
}

/**
 * 변경사항 삭제
 * 
 * @param changelogId - 변경사항 ID
 * @returns 삭제 성공 여부 또는 에러
 */
export async function deleteChangelog(
  changelogId: string
): Promise<DeleteChangelogResult> {
  try {
    if (!changelogId) {
      return {
        success: false,
        error: new Error("변경사항 ID가 필요합니다"),
      };
    }

    const { error } = await supabase
      .schema("odd")
      .rpc("v1_delete_changelog", {
        p_changelog_id: changelogId,
      });

    if (error) {
      console.error("변경사항 삭제 에러:", error);
      return {
        success: false,
        error: new Error(error.message || "변경사항 삭제에 실패했습니다"),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error("변경사항 삭제 에러:", err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error("알 수 없는 오류"),
    };
  }
}

