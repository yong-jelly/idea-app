-- =====================================================
-- LLM 공개 프로젝트 API (manual.read / project.write)
-- =====================================================
--
-- 067_v1_llm_public_api.sql 이후 적용.
--
-- 실행:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/068_v1_llm_project_api.sql
--
-- =====================================================

-- =====================================================
-- 1. 헬퍼 — last_used_at 갱신
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_llm_touch_access_token(p_token_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = odd, public
AS $$
  UPDATE odd.tbl_project_access_tokens
  SET last_used_at = now()
  WHERE id = p_token_id;
$$;

REVOKE ALL ON FUNCTION odd.fn_llm_touch_access_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_llm_touch_access_token(uuid) TO postgres;

COMMENT ON FUNCTION odd.fn_llm_touch_access_token(uuid) IS 'LLM 공개 API 성공 호출 시 access token의 last_used_at 갱신';

-- =====================================================
-- 2. v1_llm_public_manual_read
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_manual_read(
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
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['manual.read']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'manual', jsonb_build_object(
            'public_path', format('/project/%s/llm-manual', v_pid::text),
            'settings_access_path', format('/project/%s/settings/access', v_pid::text),
            'echo_path', format('/project/%s/settings/echo', v_pid::text),
            'available_rpc', jsonb_build_array(
                'v1_llm_public_echo',
                'v1_llm_public_project_read',
                'v1_llm_public_manual_read',
                'v1_llm_public_project_update',
                'v1_llm_public_announcement_list',
                'v1_llm_public_announcement_create',
                'v1_llm_public_announcement_update',
                'v1_llm_public_announcement_delete'
            )
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

COMMENT ON FUNCTION odd.v1_llm_public_manual_read IS 'LLM 공개 매뉴얼 메타 조회. 스코프 manual.read 필요.';

-- =====================================================
-- 3. v1_llm_public_project_update
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_project_update(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_short_description text DEFAULT NULL,
    p_full_description text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_tech_stack jsonb DEFAULT NULL,
    p_repository_url text DEFAULT NULL,
    p_demo_url text DEFAULT NULL,
    p_android_store_url text DEFAULT NULL,
    p_ios_store_url text DEFAULT NULL,
    p_mac_store_url text DEFAULT NULL
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
    v_update_data jsonb := '{}'::jsonb;
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['project.write']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    IF p_category IS NOT NULL AND p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', format('유효하지 않은 카테고리입니다: %s', p_category))
        );
    END IF;

    IF p_title IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('title', trim(p_title));
    END IF;

    IF p_short_description IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('short_description', trim(p_short_description));
    END IF;

    IF p_full_description IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('full_description', p_full_description);
    END IF;

    IF p_category IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('category', p_category);
    END IF;

    IF p_tech_stack IS NOT NULL THEN
        IF jsonb_typeof(p_tech_stack) != 'array' THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_tech_stack은 JSON 배열이어야 합니다')
            );
        END IF;
        v_update_data := v_update_data || jsonb_build_object('tech_stack', p_tech_stack);
    END IF;

    IF p_repository_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('repository_url', NULLIF(trim(p_repository_url), ''));
    END IF;

    IF p_demo_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('demo_url', NULLIF(trim(p_demo_url), ''));
    END IF;

    IF p_android_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('android_store_url', NULLIF(trim(p_android_store_url), ''));
    END IF;

    IF p_ios_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('ios_store_url', NULLIF(trim(p_ios_store_url), ''));
    END IF;

    IF p_mac_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('mac_store_url', NULLIF(trim(p_mac_store_url), ''));
    END IF;

    IF v_update_data = '{}'::jsonb THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '수정할 필드가 없습니다')
        );
    END IF;

    UPDATE odd.projects
    SET
        title = COALESCE((v_update_data->>'title')::text, title),
        short_description = COALESCE((v_update_data->>'short_description')::text, short_description),
        full_description = CASE
            WHEN v_update_data ? 'full_description' THEN (v_update_data->>'full_description')::text
            ELSE full_description
        END,
        category = COALESCE((v_update_data->>'category')::text, category),
        tech_stack = COALESCE((v_update_data->'tech_stack')::jsonb, tech_stack),
        repository_url = CASE
            WHEN v_update_data ? 'repository_url' THEN (v_update_data->>'repository_url')::text
            ELSE repository_url
        END,
        demo_url = CASE
            WHEN v_update_data ? 'demo_url' THEN (v_update_data->>'demo_url')::text
            ELSE demo_url
        END,
        android_store_url = CASE
            WHEN v_update_data ? 'android_store_url' THEN (v_update_data->>'android_store_url')::text
            ELSE android_store_url
        END,
        ios_store_url = CASE
            WHEN v_update_data ? 'ios_store_url' THEN (v_update_data->>'ios_store_url')::text
            ELSE ios_store_url
        END,
        mac_store_url = CASE
            WHEN v_update_data ? 'mac_store_url' THEN (v_update_data->>'mac_store_url')::text
            ELSE mac_store_url
        END
    WHERE id = v_pid
    RETURNING * INTO v_prj;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

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
            'android_store_url', v_prj.android_store_url,
            'ios_store_url', v_prj.ios_store_url,
            'mac_store_url', v_prj.mac_store_url,
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

COMMENT ON FUNCTION odd.v1_llm_public_project_update IS 'LLM 공개 프로젝트 수정. 스코프 project.write 필요.';

-- =====================================================
-- 4. 권한
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_llm_public_manual_read(text, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_llm_public_project_update(text, uuid, text, text, text, text, text, jsonb, text, text, text, text, text) TO anon, authenticated;
