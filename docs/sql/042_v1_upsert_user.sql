-- =====================================================
-- odd.v1_upsert_user: 사용자 생성/업데이트 함수
-- =====================================================
-- 
-- OAuth 로그인 시 사용자 정보를 저장/업데이트하는 함수입니다.
-- 기존 사용자는 업데이트하고, 신규 사용자는 생성합니다.
-- 
-- 사용 위치:
--   - AuthCallbackPage에서 OAuth 로그인 시 호출
--   - UserStore의 syncUserFromSession에서 세션 동기화 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_upsert_user', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/042_v1_upsert_user.sql
-- 
-- =====================================================
-- 1. 기존 함수 삭제 (반환 타입 변경을 위해)
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_upsert_user(uuid, text, text, text);

-- =====================================================
-- 2. 사용자 생성/업데이트 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_upsert_user(
    p_auth_id uuid,
    p_email text,
    p_display_name text DEFAULT NULL,
    p_avatar_url text DEFAULT NULL
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
 * 함수 설명: OAuth 로그인 시 사용자 정보를 저장/업데이트합니다.
 *           기존 사용자(auth_id 존재)는 업데이트하고, 신규 사용자는 생성합니다.
 *           기존 사용자의 경우 display_name은 유지하며 덮어쓰지 않습니다.
 *           links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환합니다.
 * 
 * 매개변수:
 *   - p_auth_id: Supabase Auth의 user.id (UUID)
 *   - p_email: 사용자 이메일
 *   - p_display_name: 표시 이름 (신규 사용자 생성 시에만 사용, 기존 사용자는 무시)
 *   - p_avatar_url: 프로필 이미지 URL
 * 
 * 반환값:
 *   - 사용자 레코드 (odd.tbl_users)
 *   - links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 자신의 정보 조회 가능
 *   - RLS 정책과 함께 작동하여 보안 강화
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_upsert_user(
 *     'b75408a1-c1cf-43b6-b6f1-3b7288745b62'::uuid,
 *     'user@example.com',
 *     '홍길동',
 *     'https://example.com/avatar.jpg'
 *   );
 */
DECLARE
    v_user odd.tbl_users;
    v_username text;
    v_existing_user odd.tbl_users;
    v_auth_id uuid;
BEGIN
    -- 기존 사용자 확인
    v_auth_id := p_auth_id;
    SELECT * INTO v_existing_user
    FROM odd.tbl_users
    WHERE tbl_users.auth_id = v_auth_id;

    IF FOUND THEN
        -- 기존 사용자 업데이트 (email과 avatar_url만 업데이트, display_name은 유지)
        -- display_name은 사용자가 프로필에서 수정한 값이므로 OAuth 세션의 이름으로 덮어쓰지 않음
        UPDATE odd.tbl_users
        SET 
            email = COALESCE(p_email, tbl_users.email),
            -- display_name은 기존 값 유지 (OAuth 세션의 이름으로 덮어쓰지 않음)
            avatar_url = COALESCE(p_avatar_url, tbl_users.avatar_url),
            updated_at = now()
        WHERE tbl_users.auth_id = v_auth_id
        RETURNING * INTO v_user;
    ELSE
        -- 신규 사용자 생성
        -- username 자동 생성 (email의 @ 앞부분 사용, 중복 시 숫자 추가)
        v_username := lower(split_part(p_email, '@', 1));
        
        -- username 중복 확인 및 처리
        WHILE EXISTS (SELECT 1 FROM odd.tbl_users WHERE tbl_users.username = v_username) LOOP
            v_username := v_username || floor(random() * 1000)::text;
        END LOOP;

        INSERT INTO odd.tbl_users (
            auth_id,
            email,
            username,
            display_name,
            avatar_url,
            points,
            level,
            subscribed_projects_count,
            supported_projects_count,
            projects_count,
            is_active
        )
        VALUES (
            v_auth_id,
            p_email,
            v_username,
            p_display_name,
            p_avatar_url,
            0,
            'bronze',
            0,
            0,
            0,
            true
        )
        RETURNING * INTO v_user;
    END IF;

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
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_upsert_user IS 'OAuth 로그인 시 사용자 정보를 저장/업데이트하는 함수. links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환합니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * links JSON 구조:
 *   {
 *     "website": "https://example.com",
 *     "github": "username",
 *     "twitter": "username"
 *   }
 * 
 * 반환값:
 *   - links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환
 *   - 프론트엔드에서 바로 사용할 수 있도록 파싱된 값 반환
 */

