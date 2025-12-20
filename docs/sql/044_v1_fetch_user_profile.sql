-- =====================================================
-- odd.v1_fetch_user_profile: 사용자 프로필 조회 함수
-- =====================================================
-- 
-- 사용자 프로필 정보를 조회하는 함수입니다.
-- username으로 사용자를 찾아 프로필 정보를 반환합니다.
-- 
-- 사용 위치:
--   - ProfilePage에서 사용자 프로필 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_user_profile', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/044_v1_fetch_user_profile.sql
-- 
-- =====================================================
-- 1. 사용자 프로필 조회 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_user_profile(text);

CREATE OR REPLACE FUNCTION odd.v1_fetch_user_profile(
    p_username text
)
RETURNS TABLE (
    id bigint,
    username text,
    display_name text,
    avatar_url text,
    bio text,
    website text,
    github text,
    twitter text,
    points integer,
    level text,
    subscribed_projects_count integer,
    supported_projects_count integer,
    projects_count integer,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 사용자 프로필 정보를 조회합니다.
 *           username으로 사용자를 찾아 프로필 정보를 반환합니다.
 * 
 * 매개변수:
 *   - p_username: 조회할 사용자의 username
 * 
 * 반환값:
 *   - 사용자 프로필 정보
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능
 */
DECLARE
    v_user_id bigint;
BEGIN
    -- username으로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.username = p_username
      AND u.is_active = true;
    
    IF v_user_id IS NULL THEN
        RETURN;  -- 사용자를 찾을 수 없으면 빈 결과 반환
    END IF;
    
    -- 사용자 프로필 정보 조회
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.bio,
        -- links JSON에서 website 추출
        CASE 
            WHEN u.links IS NOT NULL AND u.links ? 'website' 
            THEN (u.links->>'website')::text
            ELSE NULL
        END AS website,
        -- links JSON에서 github 추출
        CASE 
            WHEN u.links IS NOT NULL AND u.links ? 'github' 
            THEN (u.links->>'github')::text
            ELSE NULL
        END AS github,
        -- links JSON에서 twitter 추출
        CASE 
            WHEN u.links IS NOT NULL AND u.links ? 'twitter' 
            THEN (u.links->>'twitter')::text
            ELSE NULL
        END AS twitter,
        u.points,
        u.level,
        COALESCE((
            SELECT COUNT(*)
            FROM odd.tbl_project_bookmarks pb
            WHERE pb.user_id = u.id
        ), 0)::integer AS subscribed_projects_count,
        0::integer AS supported_projects_count,  -- 프로젝트 서포트 기능 미구현
        COALESCE((
            SELECT COUNT(*)
            FROM odd.projects p
            WHERE p.author_id = u.id
        ), 0)::integer AS projects_count,
        u.created_at
    FROM odd.tbl_users u
    WHERE u.id = v_user_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_user_profile: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_profile TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_user_profile IS '사용자 프로필 정보를 조회하는 함수. username으로 사용자를 찾아 프로필 정보를 반환합니다.';

