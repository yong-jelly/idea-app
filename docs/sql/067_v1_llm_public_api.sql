-- =====================================================
-- LLM 공개 API (anon 호출) — 액세스 토큰 + 스코프 검증
-- =====================================================
--
-- PostgREST: POST /rest/v1/rpc/v1_llm_public_echo 등
-- 헤더: apikey, Authorization: Bearer <anon key> (비로그인 호출)
--
-- 실행:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/067_v1_llm_public_api.sql
--
-- =====================================================

-- =====================================================
-- 1. 프로젝트 키 파생 (프론트 deriveProjectKeyFromProjectId 와 동일)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_derive_project_key(p_project_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'prj_'
    || substr(replace(p_project_id::text, '-', ''), 1, 8)
    || '_'
    || substr(replace(p_project_id::text, '-', ''), 9, 8);
$$;

CREATE INDEX IF NOT EXISTS idx_projects_llm_derived_key
    ON odd.projects ((odd.fn_derive_project_key(id)));

COMMENT ON FUNCTION odd.fn_derive_project_key(uuid) IS 'LLM 공개 API용 project_key (prj_xxxxxxxx_yyyyyyyy)';

-- =====================================================
-- 2. 평문 토큰 → SHA-256 hex (odd_pat_…)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_llm_access_token_hash(p_plain text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = odd, public, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(trim(p_plain), 'UTF8'), 'sha256'), 'hex');
$$;

-- =====================================================
-- 3. 공개 접근 검증 (내부용)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_llm_validate_public_access(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_required_scopes text[] DEFAULT ARRAY[]::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public, extensions
AS $$
DECLARE
    v_pid uuid;
    v_row odd.tbl_project_access_tokens%ROWTYPE;
    v_hash text;
    v_req text;
    v_has boolean;
BEGIN
    IF p_plain_token IS NULL OR length(trim(p_plain_token)) < 16 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INVALID_TOKEN', 'message', '액세스 토큰이 비어 있거나 형식이 올바르지 않습니다')
        );
    END IF;

    IF trim(p_plain_token) NOT LIKE 'odd_pat_%' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INVALID_TOKEN', 'message', '토큰은 odd_pat_ 접두로 시작해야 합니다')
        );
    END IF;

    IF p_project_id IS NULL AND (p_project_key IS NULL OR length(trim(p_project_key)) < 1) THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INVALID_ARGUMENT', 'message', 'p_project_id 또는 p_project_key 중 하나는 필수입니다')
        );
    END IF;

    IF p_project_id IS NOT NULL AND p_project_key IS NOT NULL THEN
        IF lower(trim(p_project_key)) <> lower(odd.fn_derive_project_key(p_project_id)) THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'INVALID_ARGUMENT', 'message', 'project_id와 project_key가 일치하지 않습니다')
            );
        END IF;
    END IF;

    IF p_project_id IS NOT NULL THEN
        v_pid := p_project_id;
        IF NOT EXISTS (SELECT 1 FROM odd.projects pr WHERE pr.id = v_pid) THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'NOT_FOUND', 'message', '프로젝트를 찾을 수 없습니다')
            );
        END IF;
    ELSE
        SELECT pr.id INTO v_pid
        FROM odd.projects pr
        WHERE lower(odd.fn_derive_project_key(pr.id)) = lower(trim(p_project_key));

        IF v_pid IS NULL THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'INVALID_PROJECT_KEY', 'message', 'project_key에 해당하는 프로젝트가 없습니다')
            );
        END IF;
    END IF;

    v_hash := odd.fn_llm_access_token_hash(p_plain_token);

    SELECT t.* INTO v_row
    FROM odd.tbl_project_access_tokens t
    WHERE t.project_id = v_pid
      AND t.token_hash = v_hash
      AND t.revoked_at IS NULL
      AND (t.expires_at IS NULL OR t.expires_at > now())
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INVALID_TOKEN', 'message', '토큰이 유효하지 않거나 만료·폐기되었습니다')
        );
    END IF;

    IF p_required_scopes IS NOT NULL AND array_length(p_required_scopes, 1) IS NOT NULL THEN
        FOREACH v_req IN ARRAY p_required_scopes
        LOOP
            SELECT EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(v_row.scopes) AS s(txt)
                WHERE s.txt = trim(v_req)
            ) INTO v_has;

            IF NOT COALESCE(v_has, false) THEN
                RETURN jsonb_build_object(
                    'ok', false,
                    'error', jsonb_build_object(
                        'code', 'INSUFFICIENT_SCOPE',
                        'message', format('필요 스코프: %s', v_req),
                        'required_scopes', to_jsonb(p_required_scopes),
                        'token_scopes', v_row.scopes
                    )
                );
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'token_id', v_row.id,
        'project_id', v_pid,
        'token_prefix', v_row.token_prefix,
        'scopes', v_row.scopes
    );
END;
$$;

-- =====================================================
-- 4. v1_llm_public_echo
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_echo(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public, extensions
AS $$
DECLARE
    v_val jsonb;
    v_tid uuid;
    v_pid uuid;
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['echo.invoke']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    UPDATE odd.tbl_project_access_tokens
    SET last_used_at = now()
    WHERE id = v_tid;

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'echo', jsonb_build_object(
            'received', COALESCE(p_payload, '{}'::jsonb),
            'server_time', to_jsonb(now())
        ),
        'token', jsonb_build_object(
            'id', v_tid,
            'prefix', v_val->>'token_prefix',
            'scopes', v_val->'scopes'
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INTERNAL', 'message', SQLERRM)
        );
END;
$$;

-- =====================================================
-- 5. v1_llm_public_project_read
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_project_read(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public, extensions
AS $$
DECLARE
    v_val jsonb;
    v_tid uuid;
    v_pid uuid;
    v_prj odd.projects%ROWTYPE;
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['project.read']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    UPDATE odd.tbl_project_access_tokens
    SET last_used_at = now()
    WHERE id = v_tid;

    SELECT * INTO v_prj FROM odd.projects WHERE id = v_pid;

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'project', jsonb_build_object(
            'title', v_prj.title,
            'short_description', v_prj.short_description,
            'full_description', v_prj.full_description,
            'category', v_prj.category,
            'tech_stack', v_prj.tech_stack,
            'repository_url', v_prj.repository_url,
            'demo_url', v_prj.demo_url,
            'status', v_prj.status,
            'featured', v_prj.featured,
            'created_at', v_prj.created_at,
            'updated_at', v_prj.updated_at
        ),
        'token', jsonb_build_object(
            'id', v_tid,
            'prefix', v_val->>'token_prefix',
            'scopes', v_val->'scopes'
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'INTERNAL', 'message', SQLERRM)
        );
END;
$$;

-- =====================================================
-- 6. 권한 — anon 은 공개 RPC 2개만. 헬퍼는 postgres(소유자)만 직접 호출.
-- =====================================================

REVOKE ALL ON FUNCTION odd.fn_derive_project_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_derive_project_key(uuid) TO postgres;

REVOKE ALL ON FUNCTION odd.fn_llm_access_token_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_llm_access_token_hash(text) TO postgres;

REVOKE ALL ON FUNCTION odd.fn_llm_validate_public_access(text, uuid, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_llm_validate_public_access(text, uuid, text, text[]) TO postgres;

GRANT EXECUTE ON FUNCTION odd.v1_llm_public_echo(text, uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_llm_public_project_read(text, uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION odd.v1_llm_public_echo IS 'LLM 공개 에코. 스코프 echo.invoke 필요.';
COMMENT ON FUNCTION odd.v1_llm_public_project_read IS 'LLM 공개 프로젝트 요약 조회. 스코프 project.read 필요.';
