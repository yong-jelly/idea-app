-- =====================================================
-- v1_upsert_user auth_id 경쟁 상태 제거
-- =====================================================
--
-- 목적:
--   - Google OAuth 최초 가입 시 동시 호출로 인한
--     tbl_users_auth_id_key unique 제약 오류를 방지
--   - v1_upsert_user를 INSERT ... ON CONFLICT (auth_id)
--     기반의 원자적 upsert로 변경
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/061_fix_v1_upsert_user_auth_id_race.sql
--
-- 참고:
--   - auth_id 기준 중복 생성은 ON CONFLICT로 처리합니다.
--   - username 충돌은 재시도로 해소합니다.

BEGIN;

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
DECLARE
    v_user odd.tbl_users;
    v_username_base text;
    v_candidate_username text;
    v_attempt integer := 0;
    v_constraint_name text;
BEGIN
    v_username_base := lower(split_part(COALESCE(p_email, p_auth_id::text), '@', 1));

    IF v_username_base IS NULL OR btrim(v_username_base) = '' THEN
        v_username_base := 'user_' || left(replace(p_auth_id::text, '-', ''), 8);
    END IF;

    v_candidate_username := v_username_base;

    LOOP
        BEGIN
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
                p_auth_id,
                p_email,
                v_candidate_username,
                p_display_name,
                p_avatar_url,
                p_avatar_url,
                0,
                'bronze',
                0,
                0,
                0,
                true
            )
            ON CONFLICT ON CONSTRAINT tbl_users_auth_id_key DO UPDATE
            SET
                email = COALESCE(EXCLUDED.email, odd.tbl_users.email),
                -- 사용자가 직접 저장한 avatar_url이 있으면 유지
                avatar_url = COALESCE(odd.tbl_users.avatar_url, EXCLUDED.avatar_url),
                -- OAuth 프로필 이미지는 최신 값으로 보관
                oauth_avatar_url = COALESCE(EXCLUDED.oauth_avatar_url, odd.tbl_users.oauth_avatar_url),
                updated_at = now()
            RETURNING * INTO v_user;

            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;

                IF v_constraint_name = 'tbl_users_username_key' THEN
                    v_attempt := v_attempt + 1;

                    IF v_attempt > 20 THEN
                        RAISE EXCEPTION 'username 생성 재시도 한도를 초과했습니다';
                    END IF;

                    v_candidate_username := v_username_base || floor(random() * 10000)::integer::text;
                ELSE
                    RAISE;
                END IF;
        END;
    END LOOP;

    RETURN QUERY
    SELECT
        (v_user.id)::bigint AS id,
        (v_user.auth_id)::uuid AS auth_id,
        (v_user.username)::text AS username,
        (v_user.display_name)::text AS display_name,
        (v_user.avatar_url)::text AS avatar_url,
        (v_user.bio)::text AS bio,
        CASE
            WHEN v_user.links IS NOT NULL AND v_user.links ? 'website'
            THEN (v_user.links->>'website')::text
            ELSE NULL
        END AS website,
        CASE
            WHEN v_user.links IS NOT NULL AND v_user.links ? 'github'
            THEN (v_user.links->>'github')::text
            ELSE NULL
        END AS github,
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

GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user(uuid, text, text, text) TO anon;

COMMENT ON FUNCTION odd.v1_upsert_user IS 'OAuth 로그인 사용자 생성/갱신 함수. auth_id 기준 원자적 upsert로 중복 가입 경쟁 상태를 방지합니다.';

COMMIT;
