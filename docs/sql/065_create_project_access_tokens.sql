-- =====================================================
-- 프로젝트 액세스 토큰 (LLM/API) 테이블 및 RPC
-- =====================================================
--
-- 프로젝트 작성자가 발급하는 액세스 토큰을 저장합니다.
-- 평문 토큰은 DB에 저장하지 않고 SHA-256 해시만 보관합니다.
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/065_create_project_access_tokens.sql
--
-- =====================================================
-- 1. 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_project_access_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES odd.projects(id) ON DELETE CASCADE,
    issued_by_user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,

    token_name text NOT NULL,
    -- SHA-256 hex 문자열
    token_hash text NOT NULL,
    -- 목록 표시용 (평문 앞부분)
    token_prefix text NOT NULL,
    scopes jsonb NOT NULL DEFAULT '[]'::jsonb,

    expires_at timestamptz NULL,
    revoked_at timestamptz NULL,
    last_used_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_access_token_name_len CHECK (char_length(trim(token_name)) BETWEEN 1 AND 15),
    CONSTRAINT chk_project_access_token_prefix_len CHECK (char_length(token_prefix) >= 8 AND char_length(token_prefix) <= 32)
);

CREATE INDEX IF NOT EXISTS idx_tbl_project_access_tokens_project_id
    ON odd.tbl_project_access_tokens(project_id);

CREATE INDEX IF NOT EXISTS idx_tbl_project_access_tokens_active
    ON odd.tbl_project_access_tokens(project_id)
    WHERE revoked_at IS NULL;

COMMENT ON TABLE odd.tbl_project_access_tokens IS '프로젝트 LLM/API 액세스 토큰 (해시만 저장)';
COMMENT ON COLUMN odd.tbl_project_access_tokens.token_name IS '표시용 이름 1~15자 (trim 기준)';
COMMENT ON COLUMN odd.tbl_project_access_tokens.token_hash IS '평문 토큰의 SHA-256 hex';
COMMENT ON COLUMN odd.tbl_project_access_tokens.token_prefix IS '목록에 표시할 접두사 (비밀 전체 아님)';

-- =====================================================
-- 2. RLS — 직접 테이블 접근 차단 (RPC만 사용)
-- =====================================================

ALTER TABLE odd.tbl_project_access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "block_direct_tbl_project_access_tokens" ON odd.tbl_project_access_tokens;

-- 기본 거부 — 클라이언트는 SECURITY DEFINER RPC만 사용
CREATE POLICY "block_direct_tbl_project_access_tokens"
    ON odd.tbl_project_access_tokens
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);

-- =====================================================
-- 3. 헬퍼: 허용 스코프 검증
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_validate_mcp_scopes(p_scopes text[])
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_scope text;
    v_allowed text[] := ARRAY[
        'project.read', 'project.write',
        'announcement.read', 'announcement.write',
        'milestone.read', 'milestone.write',
        'changelog.read', 'changelog.write',
        'manual.read', 'echo.invoke'
    ];
BEGIN
    IF p_scopes IS NULL OR array_length(p_scopes, 1) IS NULL OR array_length(p_scopes, 1) < 1 THEN
        RAISE EXCEPTION '스코프는 최소 1개 이상 필요합니다';
    END IF;
    FOREACH v_scope IN ARRAY p_scopes
    LOOP
        IF trim(v_scope) = '' OR NOT (trim(v_scope) = ANY(v_allowed)) THEN
            RAISE EXCEPTION '허용되지 않은 스코프입니다: %', v_scope;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- 4. v1_create_project_access_token
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_project_access_token(
    p_project_id uuid,
    p_token_name text,
    p_scopes text[],
    p_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public, extensions
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_author_id bigint;
    v_plain text;
    v_hash text;
    v_prefix text;
    v_id uuid;
    v_name text;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;

    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = p_project_id;

    IF v_project_author_id IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;

    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 토큰을 발급할 수 있습니다';
    END IF;

    v_name := trim(p_token_name);
    IF v_name IS NULL OR length(v_name) < 1 OR length(v_name) > 15 THEN
        RAISE EXCEPTION '토큰 이름은 1~15자여야 합니다';
    END IF;

    PERFORM odd.fn_validate_mcp_scopes(p_scopes);

    /* odd_pat_ + 24바이트 hex = 예측 어려운 토큰 */
    v_plain := 'odd_pat_' || encode(extensions.gen_random_bytes(24), 'hex');
    v_hash := encode(extensions.digest(convert_to(v_plain, 'UTF8'), 'sha256'), 'hex');
    v_prefix := left(v_plain, 16);

    INSERT INTO odd.tbl_project_access_tokens (
        project_id,
        issued_by_user_id,
        token_name,
        token_hash,
        token_prefix,
        scopes,
        expires_at
    ) VALUES (
        p_project_id,
        v_user_id,
        v_name,
        v_hash,
        v_prefix,
        to_jsonb(p_scopes),
        p_expires_at
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'plain_token', v_plain
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_project_access_token: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. v1_fetch_project_access_tokens
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_project_access_tokens(
    p_project_id uuid,
    p_include_revoked boolean DEFAULT false
)
RETURNS TABLE (
    id uuid,
    token_name text,
    token_prefix text,
    scopes jsonb,
    expires_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz,
    is_revoked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_author_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;

    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = p_project_id;

    IF v_project_author_id IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;

    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 토큰 목록을 조회할 수 있습니다';
    END IF;

    RETURN QUERY
    SELECT
        t.id,
        t.token_name,
        t.token_prefix,
        t.scopes,
        t.expires_at,
        t.last_used_at,
        t.created_at,
        (t.revoked_at IS NOT NULL) AS is_revoked
    FROM odd.tbl_project_access_tokens t
    WHERE t.project_id = p_project_id
      AND (p_include_revoked OR t.revoked_at IS NULL)
    ORDER BY t.created_at DESC;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_project_access_tokens: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. v1_revoke_project_access_token
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_revoke_project_access_token(
    p_token_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;

    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    SELECT t.project_id INTO v_project_id
    FROM odd.tbl_project_access_tokens t
    WHERE t.id = p_token_id;

    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '토큰을 찾을 수 없습니다';
    END IF;

    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;

    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 토큰을 폐기할 수 있습니다';
    END IF;

    UPDATE odd.tbl_project_access_tokens
    SET revoked_at = now()
    WHERE id = p_token_id
      AND revoked_at IS NULL;

    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_revoke_project_access_token: %', SQLERRM;
END;
$$;

-- =====================================================
-- 7. 권한
-- =====================================================

REVOKE ALL ON odd.tbl_project_access_tokens FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_project_access_tokens TO postgres;

GRANT EXECUTE ON FUNCTION odd.fn_validate_mcp_scopes(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_create_project_access_token(uuid, text, text[], timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_access_tokens(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_revoke_project_access_token(uuid) TO authenticated;

COMMENT ON FUNCTION odd.v1_create_project_access_token IS '프로젝트 액세스 토큰 발급. 평문은 응답에만 1회 포함.';
COMMENT ON FUNCTION odd.v1_fetch_project_access_tokens IS '프로젝트 토큰 목록 (해시 제외).';
COMMENT ON FUNCTION odd.v1_revoke_project_access_token IS '액세스 토큰 폐기.';
