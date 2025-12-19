-- =====================================================
-- odd.v1_update_user_profile: 사용자 프로필 업데이트 함수
-- =====================================================
-- 
-- 현재 로그인한 사용자의 프로필 정보를 업데이트합니다.
-- display_name, bio, avatar_url, links를 업데이트할 수 있습니다.
-- 
-- 사용 위치:
--   - ProfileEditModal에서 프로필 수정 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_update_user_profile', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/005_v1_update_user_profile.sql
-- 
-- =====================================================
-- 1. 테이블 스키마 업데이트
-- =====================================================

-- links 컬럼 추가 (이미 추가된 경우 무시)
-- links는 jsonb 타입으로 website, github, twitter를 저장
ALTER TABLE odd.tbl_users 
ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}'::jsonb;

-- 인덱스 추가 (선택사항)
-- GIN 인덱스로 JSON 검색 최적화
CREATE INDEX IF NOT EXISTS idx_tbl_users_links ON odd.tbl_users USING gin(links);

-- 기존 함수 삭제 (반환 타입 변경을 위해)
DROP FUNCTION IF EXISTS odd.v1_update_user_profile(text, text, text, jsonb);

-- 프로필 업데이트 함수
CREATE OR REPLACE FUNCTION odd.v1_update_user_profile(
    p_display_name text DEFAULT NULL,
    p_bio text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL,
    p_links jsonb DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
    auth_id uuid,
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
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자의 프로필 정보를 업데이트합니다.
 *           display_name, bio, avatar_url, links를 업데이트할 수 있습니다.
 *           p_bio와 p_avatar_url이 빈 문자열('')이면 NULL로 저장하여 필드를 삭제합니다.
 * 
 * 매개변수:
 *   - p_display_name: 표시 이름 (NULL이면 업데이트하지 않음)
 *   - p_bio: 자기소개 (NULL이면 업데이트하지 않음, 빈 문자열('')이면 NULL로 저장)
 *   - p_avatar_url: 프로필 이미지 경로 (NULL이면 업데이트하지 않음, 빈 문자열('')이면 NULL로 저장)
 *                   형식: {auth_id}/images/profile/profile-{timestamp}.{ext}
 *   - p_links: 링크 정보 JSON (NULL이면 업데이트하지 않음)
 *              형식: {"website": "https://example.com", "github": "username", "twitter": "username"}
 * 
 * 반환값:
 *   - 업데이트된 사용자 레코드 (odd.tbl_users)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 자신의 프로필 수정 가능
 *   - RLS 정책과 함께 작동하여 보안 강화
 * 
 * 예시 쿼리:
 *   -- 프로필 전체 업데이트
 *   SELECT * FROM odd.v1_update_user_profile(
 *     '홍길동',
 *     '풀스택 개발자입니다',
 *     'b75408a1-c1cf-43b6-b6f1-3b7288745b62/images/profile/profile-1702800000000.jpg',
 *     '{"website": "https://example.com", "github": "username", "twitter": "username"}'::jsonb
 *   );
 * 
 *   -- bio만 삭제 (빈 문자열 전달)
 *   SELECT * FROM odd.v1_update_user_profile(
 *     NULL,
 *     '',
 *     NULL,
 *     NULL
 *   );
 * 
 *   -- avatar_url만 업데이트
 *   SELECT * FROM odd.v1_update_user_profile(
 *     NULL,
 *     NULL,
 *     'b75408a1-c1cf-43b6-b6f1-3b7288745b62/images/profile/profile-1702800000001.jpg',
 *     NULL
 *   );
 */
DECLARE
    v_user odd.tbl_users;
    v_auth_id uuid;
    v_bio_value text;
    v_avatar_url_value text;
BEGIN
    -- 현재 사용자 auth_id 가져오기
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: 로그인이 필요합니다';
    END IF;

    -- 사용자 존재 확인
    SELECT * INTO v_user
    FROM odd.tbl_users
    WHERE tbl_users.auth_id = v_auth_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: 사용자를 찾을 수 없습니다';
    END IF;

    -- bio 처리
    IF p_bio IS NOT NULL THEN
        IF trim(p_bio) = '' THEN
            v_bio_value := NULL;
        ELSE
            v_bio_value := trim(p_bio);
        END IF;
    END IF;

    -- avatar_url 처리
    IF p_avatar_url IS NOT NULL THEN
        IF trim(p_avatar_url) = '' THEN
            v_avatar_url_value := NULL;
        ELSE
            v_avatar_url_value := trim(p_avatar_url);
        END IF;
    END IF;

    -- 프로필 업데이트
    UPDATE odd.tbl_users
    SET 
        display_name = CASE 
            WHEN p_display_name IS NOT NULL AND trim(p_display_name) != '' THEN trim(p_display_name)
            WHEN p_display_name IS NOT NULL THEN tbl_users.display_name  -- 빈 문자열이면 기존 값 유지
            ELSE tbl_users.display_name
        END,
        bio = CASE 
            WHEN p_bio IS NOT NULL THEN v_bio_value
            ELSE tbl_users.bio
        END,
        avatar_url = CASE 
            WHEN p_avatar_url IS NOT NULL THEN v_avatar_url_value
            ELSE tbl_users.avatar_url
        END,
        links = COALESCE(p_links, tbl_users.links),
        updated_at = now()
    WHERE tbl_users.auth_id = v_auth_id
    RETURNING * INTO v_user;

    -- links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환
    RETURN QUERY
    SELECT 
        (v_user.id)::bigint AS id,
        (v_user.auth_id)::uuid AS auth_id,
        (v_user.username)::text AS username,
        (v_user.display_name)::text AS display_name,
        (v_user.avatar_url)::text AS avatar_url,
        (v_user.bio)::text AS bio,
        -- links JSON에서 website 추출
        CASE 
            WHEN v_user.links IS NOT NULL AND v_user.links ? 'website' 
            THEN (v_user.links->>'website')::text
            ELSE NULL
        END AS website,
        -- links JSON에서 github 추출
        CASE 
            WHEN v_user.links IS NOT NULL AND v_user.links ? 'github' 
            THEN (v_user.links->>'github')::text
            ELSE NULL
        END AS github,
        -- links JSON에서 twitter 추출
        CASE 
            WHEN v_user.links IS NOT NULL AND v_user.links ? 'twitter' 
            THEN (v_user.links->>'twitter')::text
            ELSE NULL
        END AS twitter,
        (v_user.points)::integer AS points,
        (v_user.level)::text AS level,
        (v_user.subscribed_projects_count)::integer AS subscribed_projects_count,
        (v_user.supported_projects_count)::integer AS supported_projects_count,
        (v_user.projects_count)::integer AS projects_count,
        (v_user.is_active)::boolean AS is_active,
        (v_user.created_at)::timestamptz AS created_at,
        (v_user.updated_at)::timestamptz AS updated_at;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_update_user_profile(text, text, text, jsonb) TO authenticated;

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * avatar_url 경로 형식:
 *   {auth_id}/images/profile/profile-{timestamp}.{ext}
 * 
 * 예시:
 *   b75408a1-c1cf-43b6-b6f1-3b7288745b62/images/profile/profile-1702800000000.jpg
 * 
 * 중요:
 *   - avatar_url은 Storage 경로를 저장 (전체 URL이 아님)
 *   - 프론트엔드에서 getProfileImageUrl()로 리사이즈된 URL 생성
 *   - 폴더명은 auth_id (UUID)를 사용해야 RLS 정책과 일치
 * 
 * links JSON 구조:
 *   {
 *     "website": "https://example.com",
 *     "github": "username",
 *     "twitter": "username"
 *   }
 * 
 * 빈 값 처리:
 *   - p_bio가 빈 문자열('')이면 NULL로 저장 (삭제)
 *   - p_avatar_url이 빈 문자열('')이면 NULL로 저장 (삭제)
 *   - p_links의 빈 값은 프론트엔드에서 제거 후 전달
 */

