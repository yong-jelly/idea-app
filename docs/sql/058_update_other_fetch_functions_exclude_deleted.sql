-- =====================================================
-- 기타 프로젝트 조회 함수들에 deleted_at 필터 추가
-- =====================================================
-- 
-- v1_fetch_user_projects와 v1_fetch_saved_projects 함수에서
-- deleted_at이 NULL인 프로젝트만 조회하도록 수정합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/058_update_other_fetch_functions_exclude_deleted.sql
-- 
-- =====================================================
-- 1. v1_fetch_user_projects 함수 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_user_projects(
    p_username text,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
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
    is_liked boolean,
    is_bookmarked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_target_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- username으로 대상 사용자 ID 조회
    SELECT u.id INTO v_target_user_id
    FROM odd.tbl_users u
    WHERE u.username = p_username
      AND u.is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RETURN;  -- 사용자를 찾을 수 없으면 빈 결과 반환
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 사용자가 생성한 프로젝트 목록 조회
    RETURN QUERY
    WITH project_comments AS (
        -- 프로젝트별 실제 댓글 개수 계산
        SELECT 
            c.post_id AS project_id,
            COUNT(*)::integer AS comments_count
        FROM odd.tbl_comments c
        WHERE c.source_type_code = 'project'
          AND c.is_deleted = false
        GROUP BY c.post_id
    )
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
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
        COALESCE(pc.comments_count, 0)::integer AS comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        false AS is_liked,  -- 프로젝트 좋아요 기능 미구현
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_project_bookmarks pb
                WHERE pb.project_id = p.id AND pb.user_id = v_user_id
            )
        ELSE false END AS is_bookmarked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN project_comments pc ON p.id = pc.project_id
    WHERE p.author_id = v_target_user_id
        AND p.deleted_at IS NULL  -- 삭제되지 않은 프로젝트만 조회
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_user_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. v1_fetch_saved_projects 함수 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_saved_projects(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
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
    -- 저장 일시
    saved_at timestamptz,
    -- 내가 생성한 프로젝트 여부
    is_my_project boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 저장한 프로젝트 목록 조회
    -- 내가 생성한 프로젝트는 생성일 최신순으로, 저장한 프로젝트는 저장일 순으로 정렬
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
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        pb.created_at AS saved_at,
        -- 내가 생성한 프로젝트 여부
        (p.author_id = v_user_id) AS is_my_project
    FROM odd.tbl_project_bookmarks pb
    INNER JOIN odd.projects p ON pb.project_id = p.id
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE pb.user_id = v_user_id
        AND p.deleted_at IS NULL  -- 삭제되지 않은 프로젝트만 조회
    ORDER BY 
        -- 내가 생성한 프로젝트를 먼저 표시 (생성일 최신순)
        CASE WHEN p.author_id = v_user_id THEN 0 ELSE 1 END,
        -- 내가 생성한 프로젝트는 생성일 최신순
        CASE WHEN p.author_id = v_user_id THEN p.created_at END DESC,
        -- 저장한 프로젝트는 저장일 순
        CASE WHEN p.author_id != v_user_id THEN pb.created_at END DESC
    LIMIT p_limit
    OFFSET p_offset;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_saved_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_projects TO anon;

-- 인증된 사용자만 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_saved_projects TO authenticated;

-- =====================================================
-- 4. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_user_projects IS '특정 사용자가 생성한 프로젝트 목록을 조회하는 함수. deleted_at이 NULL인 프로젝트만 조회합니다.';
COMMENT ON FUNCTION odd.v1_fetch_saved_projects IS '현재 사용자가 저장한 프로젝트 목록을 조회하는 함수. deleted_at이 NULL인 프로젝트만 조회합니다.';

