-- =====================================================
-- 사용자 프로필 이미지 우선순위 수정
-- =====================================================
-- 
-- 사용자가 업로드한 프로필 이미지가 Google OAuth 아바타보다 우선되도록 수정합니다.
-- 
-- 문제:
--   - v1_upsert_user에서 Google OAuth 세션 동기화 시 avatar_url을 덮어쓰고 있음
--   - 사용자가 업로드한 이미지(Storage 경로)가 Google OAuth 아바타로 덮어써짐
-- 
-- 해결:
--   1. tbl_users에 oauth_avatar_url 컬럼 추가 (Google OAuth 아바타 저장)
--   2. v1_upsert_user: 업로드한 이미지가 있으면 덮어쓰지 않고, OAuth 아바타는 oauth_avatar_url에 저장
--   3. v1_fetch_user_profile: avatar_url이 NULL이면 oauth_avatar_url 사용
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/053_fix_user_avatar_priority.sql
-- 
-- =====================================================

-- 1. oauth_avatar_url 컬럼 추가
-- =====================================================

ALTER TABLE odd.tbl_users
ADD COLUMN IF NOT EXISTS oauth_avatar_url text;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_tbl_users_oauth_avatar_url ON odd.tbl_users(oauth_avatar_url) WHERE oauth_avatar_url IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN odd.tbl_users.oauth_avatar_url IS 'Google OAuth 아바타 URL (기본 프로필 이미지). 사용자가 업로드한 이미지가 없을 때 사용됩니다.';

-- =====================================================
-- 2. v1_upsert_user 함수 수정
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_upsert_user(uuid, text, text, text);

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
 *           기존 사용자의 경우 display_name과 업로드한 avatar_url은 유지하며 덮어쓰지 않습니다.
 * 
 * avatar_url 우선순위:
 *   1. 사용자가 업로드한 이미지 (avatar_url이 Storage 경로 형식: {auth_id}/images/profile/...)
 *   2. Google OAuth 아바타 (oauth_avatar_url에 저장)
 * 
 * 매개변수:
 *   - p_auth_id: Supabase Auth의 user.id (UUID)
 *   - p_email: 사용자 이메일
 *   - p_display_name: 표시 이름 (신규 사용자 생성 시에만 사용, 기존 사용자는 무시)
 *   - p_avatar_url: 프로필 이미지 URL (Google OAuth 아바타)
 * 
 * 반환값:
 *   - 사용자 레코드 (odd.tbl_users)
 *   - links JSON 필드를 파싱하여 website, github, twitter를 별도 컬럼으로 반환
 */
DECLARE
    v_user odd.tbl_users;
    v_username text;
    v_existing_user odd.tbl_users;
    v_auth_id uuid;
    v_has_uploaded_image boolean;
BEGIN
    -- 기존 사용자 확인
    v_auth_id := p_auth_id;
    SELECT * INTO v_existing_user
    FROM odd.tbl_users
    WHERE tbl_users.auth_id = v_auth_id;

    IF FOUND THEN
        -- 업로드한 이미지가 있는지 확인 (Storage 경로 형식: {auth_id}/images/profile/...)
        v_has_uploaded_image := (
            v_existing_user.avatar_url IS NOT NULL 
            AND v_existing_user.avatar_url LIKE v_auth_id::text || '/images/profile/%'
        );
        
        -- 기존 사용자 업데이트
        -- display_name: 사용자가 프로필에서 수정한 값이므로 OAuth 세션의 이름으로 덮어쓰지 않음
        -- avatar_url: 업로드한 이미지가 있으면 덮어쓰지 않음
        -- oauth_avatar_url: OAuth 아바타는 항상 업데이트 (기본 프로필 이미지로 사용)
        UPDATE odd.tbl_users
        SET 
            email = COALESCE(p_email, tbl_users.email),
            -- display_name은 기존 값 유지 (OAuth 세션의 이름으로 덮어쓰지 않음)
            avatar_url = CASE 
                WHEN v_has_uploaded_image THEN tbl_users.avatar_url  -- 업로드한 이미지 유지
                ELSE tbl_users.avatar_url  -- avatar_url은 변경하지 않음 (oauth_avatar_url 사용)
            END,
            oauth_avatar_url = COALESCE(p_avatar_url, tbl_users.oauth_avatar_url),  -- OAuth 아바타 업데이트
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
            oauth_avatar_url,
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
            NULL,  -- 신규 사용자는 아직 업로드한 이미지가 없음
            p_avatar_url,  -- OAuth 아바타 저장
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
-- 3. v1_fetch_user_profile 함수 수정
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
 * avatar_url 우선순위:
 *   1. 사용자가 업로드한 이미지 (avatar_url이 Storage 경로 형식: {auth_id}/images/profile/...)
 *   2. Google OAuth 아바타 (oauth_avatar_url)
 * 
 * 매개변수:
 *   - p_username: 조회할 사용자의 username
 * 
 * 반환값:
 *   - 사용자 프로필 정보
 */
DECLARE
    v_user_id bigint;
    v_auth_id uuid;
BEGIN
    -- username으로 사용자 ID 및 auth_id 조회
    SELECT u.id, u.auth_id INTO v_user_id, v_auth_id
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
        -- avatar_url 우선순위:
        -- 1. 업로드한 이미지 (Storage 경로 형식: {auth_id}/images/profile/...)
        -- 2. Google OAuth 아바타 (oauth_avatar_url)
        CASE 
            WHEN u.avatar_url IS NOT NULL AND u.avatar_url LIKE v_auth_id::text || '/images/profile/%' THEN u.avatar_url
            WHEN u.avatar_url IS NOT NULL AND (u.avatar_url LIKE 'http://%' OR u.avatar_url LIKE 'https://%') THEN u.avatar_url
            WHEN u.oauth_avatar_url IS NOT NULL THEN u.oauth_avatar_url
            ELSE NULL
        END AS avatar_url,
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
-- 4. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO anon;

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_profile(text) TO anon;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_upsert_user IS 'OAuth 로그인 시 사용자 정보를 저장/업데이트하는 함수. 사용자가 업로드한 프로필 이미지는 덮어쓰지 않고, OAuth 아바타는 oauth_avatar_url에 저장합니다.';
COMMENT ON FUNCTION odd.v1_fetch_user_profile IS '사용자 프로필 정보를 조회하는 함수. 업로드한 이미지가 있으면 우선 사용하고, 없으면 oauth_avatar_url을 사용합니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * avatar_url 우선순위:
 *   1. 사용자가 업로드한 이미지 (avatar_url: {auth_id}/images/profile/profile-{timestamp}.{ext})
 *   2. Google OAuth 아바타 (oauth_avatar_url: https://lh3.googleusercontent.com/...)
 * 
 * 컬럼 설명:
 *   - avatar_url: 사용자가 업로드한 프로필 이미지 경로 (Storage 경로 또는 외부 URL)
 *   - oauth_avatar_url: Google OAuth 기본 아바타 URL
 * 
 * v1_upsert_user 동작:
 *   - 기존 사용자의 경우:
 *     * avatar_url이 Storage 경로 형식이면 덮어쓰지 않음
 *     * oauth_avatar_url은 항상 업데이트 (기본 프로필 이미지로 사용)
 *   - 신규 사용자의 경우:
 *     * avatar_url은 NULL
 *     * oauth_avatar_url에 OAuth 아바타 저장
 * 
 * v1_fetch_user_profile 동작:
 *   - avatar_url이 Storage 경로 형식이면 그대로 반환
 *   - avatar_url이 NULL이거나 외부 URL이 아니면 oauth_avatar_url 반환
 */
