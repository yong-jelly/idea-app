-- =====================================================
-- 저장한 프로젝트 조회 함수 수정
-- =====================================================
-- 
-- 내가 생성한 프로젝트와 저장한 프로젝트를 구분하여 반환하도록 수정합니다.
-- - is_my_project: 내가 생성한 프로젝트 여부 (true: 생성한 프로젝트, false: 저장한 프로젝트)
-- - 내가 생성한 프로젝트는 생성일 최신순으로 정렬
-- - 내가 저장한 프로젝트는 저장일 순으로 정렬 (내가 생성한 프로젝트 제외)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/041_update_fetch_saved_projects.sql
-- 
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_saved_projects(integer, integer);

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
/*
 * 함수 설명: 현재 사용자가 저장한 프로젝트 목록을 조회합니다.
 *           내가 생성한 프로젝트와 저장한 프로젝트를 구분하여 반환합니다.
 *           - 내가 생성한 프로젝트: 생성일 최신순으로 정렬
 *           - 내가 저장한 프로젝트: 저장일 순으로 정렬 (내가 생성한 프로젝트 제외)
 * 
 * 매개변수:
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 저장한 프로젝트 목록 (작성자 정보, 저장 일시, 내가 생성한 프로젝트 여부 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 인증된 사용자만 접근 가능
 *   - 현재 로그인한 사용자의 저장 목록만 반환
 */
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

-- 권한 부여
GRANT EXECUTE ON FUNCTION odd.v1_fetch_saved_projects TO authenticated;

-- 코멘트 추가
COMMENT ON FUNCTION odd.v1_fetch_saved_projects IS '현재 사용자가 저장한 프로젝트 목록을 조회하는 함수. 내가 생성한 프로젝트와 저장한 프로젝트를 구분하여 반환합니다.';






