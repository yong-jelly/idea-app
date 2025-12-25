# API 설계 가이드

이 문서는 Supabase를 사용한 API 설계 및 클라이언트 구현 가이드를 제공합니다.

## 📋 목차

1. [API 설계 원칙](#1-api-설계-원칙)
2. [RPC 함수 설계](#2-rpc-함수-설계)
3. [클라이언트 API 함수 작성](#3-클라이언트-api-함수-작성)
4. [에러 처리](#4-에러-처리)
5. [타입 정의](#5-타입-정의)
6. [캐싱 전략](#6-캐싱-전략)

## 1. API 설계 원칙

### 1.1 명명 규칙

- **RPC 함수**: `v1_*`, `v2_*` (버전 관리)
- **함수명**: 동사 + 명사 (`v1_create_user`, `v1_fetch_projects`)
- **파라미터**: `p_*` 접두사 (`p_user_id`, `p_limit`)

### 1.2 버전 관리

- 기존 함수 수정 시 새 버전 생성
- 하위 호환성 유지
- 마이그레이션 가이드 작성

### 1.3 응답 형식

모든 RPC 함수는 일관된 응답 형식을 반환합니다:

```typescript
// 성공 응답
{
  data: T,
  error: null
}

// 에러 응답
{
  data: null,
  error: {
    message: string,
    code: string,
    details?: any
  }
}
```

## 2. RPC 함수 설계

### 2.1 함수 구조

```sql
CREATE OR REPLACE FUNCTION odd.v1_function_name(
  -- 파라미터 정의
  p_param1 TYPE,
  p_param2 TYPE DEFAULT default_value
)
RETURNS return_type -- 또는 TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER -- 또는 SECURITY INVOKER
AS $$
DECLARE
  -- 변수 선언
BEGIN
  -- 로직 구현
  RETURN result;
END;
$$;
```

### 2.2 CRUD 함수 예시

#### CREATE 함수

```sql
CREATE OR REPLACE FUNCTION odd.v1_create_project(
  p_author_id BIGINT,
  p_title VARCHAR,
  p_short_description TEXT,
  p_category VARCHAR DEFAULT NULL
)
RETURNS odd.tbl_projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project odd.tbl_projects;
BEGIN
  -- 권한 검증
  IF NOT EXISTS (
    SELECT 1 FROM odd.tbl_users 
    WHERE id = p_author_id AND auth_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 프로젝트 생성
  INSERT INTO odd.tbl_projects (
    author_id, title, short_description, category
  )
  VALUES (
    p_author_id, p_title, p_short_description, p_category
  )
  RETURNING * INTO v_project;
  
  RETURN v_project;
END;
$$;
```

#### READ 함수 (단일 조회)

```sql
CREATE OR REPLACE FUNCTION odd.v1_fetch_project_detail(
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  short_description TEXT,
  author JSONB,
  likes_count BIGINT,
  comments_count BIGINT,
  is_liked BOOLEAN,
  is_bookmarked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.short_description,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'displayName', u.display_name,
      'avatar', u.avatar_url
    ) AS author,
    COUNT(DISTINCT pl.id)::BIGINT AS likes_count,
    COUNT(DISTINCT c.id)::BIGINT AS comments_count,
    -- 현재 사용자가 좋아요 했는지 확인
    EXISTS(
      SELECT 1 FROM odd.tbl_project_likes pl2
      WHERE pl2.project_id = p.id
        AND pl2.user_id IN (
          SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    ) AS is_liked,
    -- 현재 사용자가 북마크 했는지 확인
    EXISTS(
      SELECT 1 FROM odd.tbl_project_bookmarks pb
      WHERE pb.project_id = p.id
        AND pb.user_id IN (
          SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    ) AS is_bookmarked
  FROM odd.tbl_projects p
  INNER JOIN odd.tbl_users u ON p.author_id = u.id
  LEFT JOIN odd.tbl_project_likes pl ON p.id = pl.project_id
  LEFT JOIN odd.tbl_comments c ON c.source_id = p.id::TEXT AND c.source_type = 'project'
  WHERE p.id = p_project_id
    AND p.deleted_at IS NULL
  GROUP BY p.id, u.id;
END;
$$;
```

#### READ 함수 (목록 조회)

```sql
CREATE OR REPLACE FUNCTION odd.v1_fetch_projects(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category VARCHAR DEFAULT NULL,
  p_user_id BIGINT DEFAULT NULL -- 특정 사용자의 프로젝트만 조회
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  short_description TEXT,
  author JSONB,
  thumbnail TEXT,
  likes_count BIGINT,
  comments_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.short_description,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'displayName', u.display_name,
      'avatar', u.avatar_url
    ) AS author,
    p.thumbnail,
    COUNT(DISTINCT pl.id)::BIGINT AS likes_count,
    COUNT(DISTINCT c.id)::BIGINT AS comments_count,
    p.created_at
  FROM odd.tbl_projects p
  INNER JOIN odd.tbl_users u ON p.author_id = u.id
  LEFT JOIN odd.tbl_project_likes pl ON p.id = pl.project_id
  LEFT JOIN odd.tbl_comments c ON c.source_id = p.id::TEXT AND c.source_type = 'project'
  WHERE p.deleted_at IS NULL
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_user_id IS NULL OR p.author_id = p_user_id)
  GROUP BY p.id, u.id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

#### UPDATE 함수

```sql
CREATE OR REPLACE FUNCTION odd.v1_update_project(
  p_project_id UUID,
  p_title VARCHAR DEFAULT NULL,
  p_short_description TEXT DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL
)
RETURNS odd.tbl_projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project odd.tbl_projects;
  v_user_id BIGINT;
BEGIN
  -- 현재 사용자 ID 조회
  SELECT id INTO v_user_id
  FROM odd.tbl_users
  WHERE auth_id = auth.uid();
  
  -- 권한 검증
  IF NOT EXISTS (
    SELECT 1 FROM odd.tbl_projects
    WHERE id = p_project_id
      AND author_id = v_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized or project not found';
  END IF;
  
  -- 프로젝트 업데이트
  UPDATE odd.tbl_projects
  SET
    title = COALESCE(p_title, title),
    short_description = COALESCE(p_short_description, short_description),
    category = COALESCE(p_category, category),
    updated_at = NOW()
  WHERE id = p_project_id
  RETURNING * INTO v_project;
  
  RETURN v_project;
END;
$$;
```

#### DELETE 함수 (Soft Delete)

```sql
CREATE OR REPLACE FUNCTION odd.v1_delete_project(
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id BIGINT;
BEGIN
  -- 현재 사용자 ID 조회
  SELECT id INTO v_user_id
  FROM odd.tbl_users
  WHERE auth_id = auth.uid();
  
  -- 권한 검증
  IF NOT EXISTS (
    SELECT 1 FROM odd.tbl_projects
    WHERE id = p_project_id
      AND author_id = v_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unauthorized or project not found';
  END IF;
  
  -- Soft Delete
  UPDATE odd.tbl_projects
  SET deleted_at = NOW()
  WHERE id = p_project_id;
  
  RETURN TRUE;
END;
$$;
```

## 3. 클라이언트 API 함수 작성

### 3.1 파일 구조

```
entities/
└── project/
    ├── api/
    │   └── project.api.ts    # API 함수
    ├── model/
    │   ├── project.types.ts  # 타입 정의
    │   └── project.store.ts  # 상태 관리
    └── index.ts              # Public API
```

### 3.2 API 함수 작성 예시

```typescript
// src/entities/project/api/project.api.ts
import { supabase } from "@/shared/lib/supabase";
import type { Project } from "../model/project.types";

/**
 * 프로젝트 생성
 */
export async function createProject(params: {
  title: string;
  shortDescription: string;
  category?: string;
}): Promise<Project> {
  // 현재 사용자 ID 조회
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Unauthorized");
  
  const { data: dbUser } = await supabase
    .schema("odd")
    .from("tbl_users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();
    
  if (!dbUser) throw new Error("User not found");
  
  // RPC 함수 호출
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_create_project", {
      p_author_id: dbUser.id,
      p_title: params.title,
      p_short_description: params.shortDescription,
      p_category: params.category || null,
    })
    .single();
    
  if (error) throw error;
  return transformProject(data);
}

/**
 * 프로젝트 목록 조회
 */
export async function fetchProjects(params: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<Project[]> {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_fetch_projects", {
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
      p_category: params.category || null,
    });
    
  if (error) throw error;
  return data.map(transformProject);
}

/**
 * 프로젝트 상세 조회
 */
export async function fetchProjectDetail(id: string): Promise<Project> {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_fetch_project_detail", {
      p_project_id: id,
    })
    .single();
    
  if (error) throw error;
  return transformProject(data);
}

/**
 * 프로젝트 업데이트
 */
export async function updateProject(
  id: string,
  updates: {
    title?: string;
    shortDescription?: string;
    category?: string;
  }
): Promise<Project> {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_update_project", {
      p_project_id: id,
      p_title: updates.title || null,
      p_short_description: updates.shortDescription || null,
      p_category: updates.category || null,
    })
    .single();
    
  if (error) throw error;
  return transformProject(data);
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .schema("odd")
    .rpc("v1_delete_project", {
      p_project_id: id,
    });
    
  if (error) throw error;
}

/**
 * DB 응답을 클라이언트 타입으로 변환
 */
function transformProject(data: any): Project {
  return {
    id: data.id,
    title: data.title,
    shortDescription: data.short_description,
    author: data.author,
    thumbnail: data.thumbnail,
    likesCount: data.likes_count || 0,
    commentsCount: data.comments_count || 0,
    isLiked: data.is_liked || false,
    isBookmarked: data.is_bookmarked || false,
    createdAt: data.created_at,
  };
}
```

## 4. 에러 처리

### 4.1 에러 타입 정의

```typescript
// src/shared/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: any): never {
  if (error instanceof ApiError) {
    throw error;
  }
  
  // Supabase 에러 처리
  if (error?.code) {
    throw new ApiError(
      error.message || "API 요청 실패",
      error.code,
      error.details
    );
  }
  
  // 일반 에러
  throw new ApiError(error?.message || "알 수 없는 오류가 발생했습니다");
}
```

### 4.2 API 함수에서 에러 처리

```typescript
export async function createProject(params: {
  title: string;
  shortDescription: string;
}): Promise<Project> {
  try {
    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_create_project", params)
      .single();
      
    if (error) {
      throw handleApiError(error);
    }
    
    return transformProject(data);
  } catch (error) {
    console.error("[createProject] 에러:", error);
    throw error;
  }
}
```

## 5. 타입 정의

### 5.1 엔티티 타입

```typescript
// src/entities/project/model/project.types.ts
export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  category?: string;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
  };
  thumbnail?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}
```

### 5.2 API 파라미터 타입

```typescript
export interface CreateProjectParams {
  title: string;
  shortDescription: string;
  category?: string;
}

export interface FetchProjectsParams {
  limit?: number;
  offset?: number;
  category?: string;
}
```

## 6. 캐싱 전략

### 6.1 Zustand를 사용한 캐싱

```typescript
// src/entities/project/model/project.store.ts
import { create } from "zustand";
import { fetchProjects, fetchProjectDetail } from "../api/project.api";
import type { Project } from "./project.types";

interface ProjectStore {
  projects: Project[];
  projectCache: Record<string, Project>;
  isLoading: boolean;
  
  loadProjects: (params?: FetchProjectsParams) => Promise<void>;
  loadProjectDetail: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  projectCache: {},
  isLoading: false,
  
  loadProjects: async (params) => {
    set({ isLoading: true });
    try {
      const projects = await fetchProjects(params || {});
      set({ projects, isLoading: false });
    } catch (error) {
      console.error("[loadProjects] 에러:", error);
      set({ isLoading: false });
    }
  },
  
  loadProjectDetail: async (id) => {
    // 캐시 확인
    const cached = get().projectCache[id];
    if (cached) return;
    
    set({ isLoading: true });
    try {
      const project = await fetchProjectDetail(id);
      set((state) => ({
        projectCache: { ...state.projectCache, [id]: project },
        isLoading: false,
      }));
    } catch (error) {
      console.error("[loadProjectDetail] 에러:", error);
      set({ isLoading: false });
    }
  },
}));
```

## 📚 참고 자료

- [Supabase RPC 함수 문서](https://supabase.com/docs/guides/database/functions)
- [백엔드 구조 가이드](./03_backend-supabase.md)
- [코드 패턴 가이드](./09_code-patterns.md)

