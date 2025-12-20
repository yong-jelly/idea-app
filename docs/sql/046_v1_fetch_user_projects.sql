-- =====================================================
-- odd.v1_fetch_user_projects: 사용자가 생성한 프로젝트 목록 조회 함수
-- =====================================================
-- 
-- 특정 사용자가 생성한 프로젝트 목록을 조회합니다.
-- 작성자 정보와 실제 댓글 개수를 포함합니다.
-- 
-- 사용 위치:
--   - ProfilePage의 프로젝트 탭에서 사용자가 생성한 프로젝트 목록 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_user_projects', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/046_v1_fetch_user_projects.sql
-- 
-- =====================================================
-- 1. 사용자가 생성한 프로젝트 목록 조회 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_user_projects(text, integer, integer);

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
/*
 * 함수 설명: 특정 사용자가 생성한 프로젝트 목록을 조회합니다.
 *           작성자 정보와 실제 댓글 개수를 포함합니다.
 * 
 * 매개변수:
 *   - p_username: 조회할 사용자의 username
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 사용자가 생성한 프로젝트 목록 (작성자 정보, 인터랙션 상태, 실제 댓글 개수 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능
 *   - 현재 사용자 정보는 auth.uid()로 조회 (인증되지 않은 경우 NULL)
 */
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
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_user_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_projects TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_user_projects IS '특정 사용자가 생성한 프로젝트 목록을 조회하는 함수. 작성자 정보와 실제 댓글 개수를 포함합니다.';

