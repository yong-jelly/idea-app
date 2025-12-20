-- =====================================================
-- v1_fetch_project_detail 함수에 is_liked 필드 추가
-- =====================================================
-- 
-- 프로젝트 상세 조회 함수에 현재 사용자의 좋아요 상태를 추가합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/049_update_project_detail_add_is_liked.sql
-- 
-- =====================================================
-- 1. v1_fetch_project_detail 함수 업데이트
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위해 필요)
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
 * 함수 설명: 프로젝트 상세 정보를 조회합니다.
 *           작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.
 *           실제 댓글 개수를 계산하여 반환합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - 프로젝트 상세 정보 (작성자 정보 포함, 실제 댓글 개수 포함, 좋아요 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 *   - 인증된 사용자의 경우 좋아요 상태를 반환하고, 비인증 사용자는 false 반환
 */
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
        -- 실제 댓글 개수 계산 (is_deleted = false인 댓글만 카운트)
        COALESCE(actual_comments_count, 0)::integer AS comments_count,
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
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
        AND c.is_deleted = false
    ) comment_counts ON true
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
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_project_detail IS '프로젝트 상세 정보를 조회하는 함수. 작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다. 실제 댓글 개수를 계산하여 반환합니다.';

