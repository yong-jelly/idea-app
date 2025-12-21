-- =====================================================
-- 프로젝트 조회 함수들에 category_id 필드 추가
-- =====================================================
-- 
-- 프로젝트 조회 함수들에 category_id 필드를 추가하여 원본 카테고리 ID를 반환하도록 합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/052_add_category_id_to_fetch_functions.sql
-- 
-- =====================================================

-- 1. v1_fetch_project_detail 함수 업데이트
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_project_detail(uuid);

CREATE OR REPLACE FUNCTION odd.v1_fetch_project_detail(
    p_project_id uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    category_id text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_project_id uuid;
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 프로젝트 ID 유효성 검사
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 ID는 필수입니다';
    END IF;
    
    v_project_id := p_project_id;
    
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- 프로젝트 상세 조회
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.category_id,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        p.comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 좋아요 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_project_likes pl
                WHERE pl.project_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE p.id = v_project_id
    LIMIT 1;

    -- 프로젝트가 없는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다: %', v_project_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_project_detail: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. v1_fetch_projects 함수 업데이트
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_projects(boolean, text, integer, integer, text, text);

CREATE OR REPLACE FUNCTION odd.v1_fetch_projects(
    p_featured boolean DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_order_by text DEFAULT 'created_at',
    p_order_direction text DEFAULT 'desc'
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    category_id text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원합니다.
 *           작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.
 * 
 * 매개변수:
 *   - p_featured: 주목할 프로젝트만 조회 (NULL이면 모든 프로젝트)
 *   - p_category: 카테고리 필터 (NULL이면 모든 카테고리)
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지 오프셋 (기본값: 0)
 *   - p_order_by: 정렬 기준 (기본값: 'created_at')
 *   - p_order_direction: 정렬 방향 (기본값: 'desc')
 * 
 * 반환값:
 *   - 프로젝트 목록 (작성자 정보, 좋아요 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 *   - 인증된 사용자의 경우 좋아요 상태를 반환하고, 비인증 사용자는 false 반환
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_limit integer;
    v_offset integer;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- limit과 offset 유효성 검사
    v_limit := LEAST(COALESCE(p_limit, 50), 100);
    v_offset := GREATEST(COALESCE(p_offset, 0), 0);
    
    -- 카테고리 유효성 검사
    IF p_category IS NOT NULL AND p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RAISE EXCEPTION '유효하지 않은 카테고리입니다: %', p_category;
    END IF;
    
    -- 프로젝트 목록 조회
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.category_id,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        p.comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 좋아요 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_project_likes pl
                WHERE pl.project_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE 
        -- featured 필터
        (p_featured IS NULL OR p.featured = p_featured)
        -- category 필터
        AND (p_category IS NULL OR p.category = p_category)
    ORDER BY
        CASE 
            WHEN p_order_by = 'likes_count' AND p_order_direction = 'desc' THEN p.likes_count
            WHEN p_order_by = 'likes_count' AND p_order_direction = 'asc' THEN p.likes_count
            WHEN p_order_by = 'comments_count' AND p_order_direction = 'desc' THEN p.comments_count
            WHEN p_order_by = 'comments_count' AND p_order_direction = 'asc' THEN p.comments_count
            ELSE NULL
        END DESC NULLS LAST,
        CASE 
            WHEN p_order_by = 'likes_count' AND p_order_direction = 'asc' THEN p.likes_count
            WHEN p_order_by = 'comments_count' AND p_order_direction = 'asc' THEN p.comments_count
            ELSE NULL
        END ASC NULLS LAST,
        CASE 
            WHEN p_order_by = 'created_at' AND p_order_direction = 'desc' THEN p.created_at
            ELSE NULL
        END DESC NULLS LAST,
        CASE 
            WHEN p_order_by = 'created_at' AND p_order_direction = 'asc' THEN p.created_at
            ELSE NULL
        END ASC NULLS LAST
    LIMIT v_limit
    OFFSET v_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 권한 부여
-- =====================================================

-- 인증된 사용자와 공개 사용자 모두 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects(boolean, text, integer, integer, text, text) TO authenticated, anon;

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * category_id 필드:
 *   - 원본 카테고리 ID를 저장합니다 (예: devtool, utility, productivity 등)
 *   - category 필드와 함께 사용하여 편집 시 정확한 카테고리를 표시합니다
 *   - 기존 프로젝트의 경우 category_id가 NULL일 수 있습니다
 */

