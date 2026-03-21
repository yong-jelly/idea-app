-- =====================================================
-- LLM 공개 공지/업데이트 API (announcement.read / announcement.write)
-- =====================================================
--
-- 067, 068 이후 적용.
--
-- 실행:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/069_v1_llm_announcement_api.sql
--
-- =====================================================

-- =====================================================
-- 1. 헬퍼 — 링크 프리뷰 정규화
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_llm_normalize_link_preview(p_link_preview jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_link_url text;
    v_link_item jsonb;
    v_result jsonb := '[]'::jsonb;
BEGIN
    IF p_link_preview IS NULL THEN
        RETURN NULL;
    END IF;

    IF jsonb_typeof(p_link_preview) = 'array' THEN
        FOR v_link_item IN
            SELECT value
            FROM jsonb_array_elements(p_link_preview)
        LOOP
            EXIT WHEN jsonb_array_length(v_result) >= 3;

            IF jsonb_typeof(v_link_item) = 'object' THEN
                v_link_url := trim(COALESCE(v_link_item->>'url', ''));

                IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
                    v_result := v_result || jsonb_build_array(
                        jsonb_build_object('url', v_link_url)
                    );
                END IF;
            END IF;
        END LOOP;
    ELSIF jsonb_typeof(p_link_preview) = 'object' THEN
        v_link_url := trim(COALESCE(p_link_preview->>'url', ''));

        IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
            v_result := jsonb_build_array(jsonb_build_object('url', v_link_url));
        END IF;
    END IF;

    IF jsonb_array_length(v_result) = 0 THEN
        RETURN NULL;
    END IF;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION odd.fn_llm_normalize_link_preview(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_llm_normalize_link_preview(jsonb) TO postgres;

-- =====================================================
-- 2. 헬퍼 — 공지 응답 객체
-- =====================================================

CREATE OR REPLACE FUNCTION odd.fn_llm_build_announcement_json(p_post_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = odd, public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'project_id', p.project_id,
    'author_id', p.author_id,
    'content', p.content,
    'images', p.images,
    'link_preview', p.link_preview,
    'likes_count', p.likes_count,
    'comments_count', p.comments_count,
    'is_pinned', p.is_pinned,
    'is_deleted', p.is_deleted,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'title', pa.title,
    'post_type', pa.post_type,
    'vote_options', CASE
      WHEN pa.post_type = 'vote' THEN (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', pv.id::text,
              'text', pv.option_text,
              'votes_count', pv.votes_count,
              'sort_order', pv.sort_order
            )
            ORDER BY pv.sort_order
          ),
          '[]'::jsonb
        )
        FROM odd.tbl_post_votes pv
        WHERE pv.post_id = p.id
      )
      ELSE NULL
    END
  )
  FROM odd.tbl_posts p
  INNER JOIN odd.tbl_post_announcements pa ON pa.post_id = p.id
  WHERE p.id = p_post_id;
$$;

REVOKE ALL ON FUNCTION odd.fn_llm_build_announcement_json(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION odd.fn_llm_build_announcement_json(uuid) TO postgres;

COMMENT ON FUNCTION odd.fn_llm_build_announcement_json(uuid) IS 'LLM 공개 공지 CRUD 응답용 단일 announcement JSON';

-- =====================================================
-- 3. v1_llm_public_announcement_list
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_announcement_list(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_post_type text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
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
    v_items jsonb;
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['announcement.read']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', format('유효하지 않은 포스트 타입입니다: %s', p_post_type))
        );
    END IF;

    IF p_limit < 1 OR p_limit > 100 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'limit은 1 이상 100 이하여야 합니다')
        );
    END IF;

    IF p_offset < 0 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'offset은 0 이상이어야 합니다')
        );
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    SELECT COALESCE(
        jsonb_agg(odd.fn_llm_build_announcement_json(x.id) ORDER BY x.is_pinned DESC, x.created_at DESC),
        '[]'::jsonb
    ) INTO v_items
    FROM (
        SELECT p.id, p.is_pinned, p.created_at
        FROM odd.tbl_posts p
        INNER JOIN odd.tbl_post_announcements pa ON pa.post_id = p.id
        WHERE p.project_id = v_pid
          AND p.source_type = 'community'
          AND p.is_deleted = false
          AND (p_post_type IS NULL OR pa.post_type = p_post_type)
        ORDER BY p.is_pinned DESC, p.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) x;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'items', v_items,
        'meta', jsonb_build_object(
            'limit', p_limit,
            'offset', p_offset,
            'post_type', p_post_type
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

COMMENT ON FUNCTION odd.v1_llm_public_announcement_list IS 'LLM 공개 공지/업데이트 목록 조회. 스코프 announcement.read 필요.';

-- =====================================================
-- 4. v1_llm_public_announcement_create
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_announcement_create(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_post_type text DEFAULT 'announcement',
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_link_preview jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT false,
    p_vote_options text[] DEFAULT NULL
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
    v_actor_user_id bigint;
    v_post_id uuid;
    v_post_db_type text;
    v_project_title text;
    v_option_text text;
    v_sort_order integer;
    v_images jsonb := COALESCE(p_images, '[]'::jsonb);
    v_link_preview jsonb;
BEGIN
    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['announcement.write']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    SELECT issued_by_user_id INTO v_actor_user_id
    FROM odd.tbl_project_access_tokens
    WHERE id = v_tid;

    SELECT title INTO v_project_title
    FROM odd.projects
    WHERE id = v_pid;

    IF p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', format('유효하지 않은 포스트 타입입니다: %s', p_post_type))
        );
    END IF;

    IF p_title IS NULL OR trim(p_title) = '' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '제목은 필수입니다')
        );
    END IF;

    IF p_content IS NULL OR trim(p_content) = '' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '본문은 필수입니다')
        );
    END IF;

    IF jsonb_typeof(v_images) != 'array' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_images는 JSON 배열이어야 합니다')
        );
    END IF;

    IF jsonb_array_length(v_images) > 3 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '이미지는 최대 3장까지 첨부할 수 있습니다')
        );
    END IF;

    IF p_post_type = 'vote' THEN
        IF p_vote_options IS NULL OR array_length(p_vote_options, 1) < 2 THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '투표 옵션은 최소 2개 이상 필요합니다')
            );
        END IF;
        IF array_length(p_vote_options, 1) > 5 THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '투표 옵션은 최대 5개까지 가능합니다')
            );
        END IF;
    END IF;

    v_link_preview := odd.fn_llm_normalize_link_preview(p_link_preview);

    v_post_db_type := CASE p_post_type
        WHEN 'announcement' THEN 'text'
        WHEN 'update' THEN 'project_update'
        WHEN 'vote' THEN 'text'
    END;

    INSERT INTO odd.tbl_posts (
        author_id,
        type,
        content,
        images,
        link_preview,
        project_id,
        source_type,
        source_id,
        source_name,
        source_emoji,
        is_pinned
    ) VALUES (
        v_actor_user_id,
        v_post_db_type,
        trim(p_content),
        v_images,
        v_link_preview,
        v_pid,
        'community',
        v_pid,
        v_project_title,
        '📢',
        COALESCE(p_is_pinned, false)
    )
    RETURNING id INTO v_post_id;

    INSERT INTO odd.tbl_post_announcements (
        post_id,
        title,
        post_type,
        is_pinned
    ) VALUES (
        v_post_id,
        trim(p_title),
        p_post_type,
        COALESCE(p_is_pinned, false)
    );

    IF p_post_type = 'vote' THEN
        v_sort_order := 0;
        FOREACH v_option_text IN ARRAY p_vote_options
        LOOP
            IF v_option_text IS NOT NULL AND trim(v_option_text) != '' THEN
                INSERT INTO odd.tbl_post_votes (
                    post_id,
                    option_text,
                    sort_order
                ) VALUES (
                    v_post_id,
                    trim(v_option_text),
                    v_sort_order
                );
                v_sort_order := v_sort_order + 1;
            END IF;
        END LOOP;
    END IF;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'item', odd.fn_llm_build_announcement_json(v_post_id),
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

COMMENT ON FUNCTION odd.v1_llm_public_announcement_create IS 'LLM 공개 공지/업데이트/투표 생성. 스코프 announcement.write 필요.';

-- =====================================================
-- 5. v1_llm_public_announcement_update
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_announcement_update(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_post_id uuid DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_link_preview jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT NULL,
    p_post_type text DEFAULT NULL,
    p_vote_options text[] DEFAULT NULL
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
    v_post_pid uuid;
    v_post_type text;
    v_option_text text;
    v_sort_order integer;
    v_vote_response_count integer := 0;
    v_link_preview jsonb;
BEGIN
    IF p_post_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_post_id는 필수입니다')
        );
    END IF;

    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['announcement.write']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    SELECT project_id INTO v_post_pid
    FROM odd.tbl_posts
    WHERE id = p_post_id
      AND source_type = 'community'
      AND is_deleted = false;

    IF v_post_pid IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'NOT_FOUND', 'message', '공지 포스트를 찾을 수 없습니다')
        );
    END IF;

    IF v_post_pid != v_pid THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'FORBIDDEN', 'message', '해당 프로젝트에 속한 포스트만 수정할 수 있습니다')
        );
    END IF;

    SELECT post_type INTO v_post_type
    FROM odd.tbl_post_announcements
    WHERE post_id = p_post_id;

    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', format('유효하지 않은 포스트 타입입니다: %s', p_post_type))
        );
    END IF;

    IF p_images IS NOT NULL THEN
        IF jsonb_typeof(p_images) != 'array' THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_images는 JSON 배열이어야 합니다')
            );
        END IF;
        IF jsonb_array_length(p_images) > 3 THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '이미지는 최대 3장까지 첨부할 수 있습니다')
            );
        END IF;
    END IF;

    IF v_post_type != 'vote' AND p_post_type = 'vote' AND p_vote_options IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '투표 타입으로 변경할 때는 투표 옵션이 필요합니다')
        );
    END IF;

    IF p_vote_options IS NOT NULL THEN
        IF array_length(p_vote_options, 1) < 2 THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '투표 옵션은 최소 2개 이상 필요합니다')
            );
        END IF;
        IF array_length(p_vote_options, 1) > 5 THEN
            RETURN jsonb_build_object(
                'ok', false,
                'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '투표 옵션은 최대 5개까지 가능합니다')
            );
        END IF;
    END IF;

    IF v_post_type = 'vote' AND ((p_post_type IS NOT NULL AND p_post_type != 'vote') OR p_vote_options IS NOT NULL) THEN
        SELECT COUNT(*)::integer INTO v_vote_response_count
        FROM odd.tbl_post_vote_responses
        WHERE post_id = p_post_id;

        IF v_vote_response_count > 0 THEN
            IF p_post_type IS NOT NULL AND p_post_type != 'vote' THEN
                RETURN jsonb_build_object(
                    'ok', false,
                    'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '응답이 있는 투표는 다른 타입으로 변경할 수 없습니다')
                );
            END IF;

            IF p_vote_options IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'ok', false,
                    'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', '응답이 있는 투표는 옵션을 수정할 수 없습니다')
                );
            END IF;
        END IF;
    END IF;

    v_link_preview := odd.fn_llm_normalize_link_preview(p_link_preview);

    IF p_post_type IS NOT NULL AND v_post_type = 'vote' AND p_post_type != 'vote' THEN
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;
    END IF;

    IF p_content IS NOT NULL OR p_images IS NOT NULL OR p_is_pinned IS NOT NULL OR p_link_preview IS NOT NULL THEN
        UPDATE odd.tbl_posts
        SET
            content = COALESCE(p_content, content),
            images = CASE
                WHEN p_images IS NULL THEN images
                ELSE p_images
            END,
            link_preview = CASE
                WHEN p_link_preview IS NULL THEN link_preview
                ELSE v_link_preview
            END,
            is_pinned = COALESCE(p_is_pinned, is_pinned)
        WHERE id = p_post_id;
    END IF;

    IF p_title IS NOT NULL OR p_is_pinned IS NOT NULL OR p_post_type IS NOT NULL THEN
        UPDATE odd.tbl_post_announcements
        SET
            title = COALESCE(p_title, title),
            is_pinned = COALESCE(p_is_pinned, is_pinned),
            post_type = COALESCE(p_post_type, post_type)
        WHERE post_id = p_post_id;
    END IF;

    IF p_post_type IS NOT NULL THEN
        v_post_type := p_post_type;
    END IF;

    IF v_post_type = 'vote' AND p_vote_options IS NOT NULL THEN
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;

        v_sort_order := 0;
        FOREACH v_option_text IN ARRAY p_vote_options
        LOOP
            IF v_option_text IS NOT NULL AND trim(v_option_text) != '' THEN
                INSERT INTO odd.tbl_post_votes (
                    post_id,
                    option_text,
                    sort_order
                ) VALUES (
                    p_post_id,
                    trim(v_option_text),
                    v_sort_order
                );
                v_sort_order := v_sort_order + 1;
            END IF;
        END LOOP;
    END IF;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'item', odd.fn_llm_build_announcement_json(p_post_id),
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

COMMENT ON FUNCTION odd.v1_llm_public_announcement_update IS 'LLM 공개 공지/업데이트/투표 수정. 스코프 announcement.write 필요.';

-- =====================================================
-- 6. v1_llm_public_announcement_delete
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_llm_public_announcement_delete(
    p_plain_token text,
    p_project_id uuid DEFAULT NULL,
    p_project_key text DEFAULT NULL,
    p_post_id uuid DEFAULT NULL
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
    v_post_pid uuid;
BEGIN
    IF p_post_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'VALIDATION_ERROR', 'message', 'p_post_id는 필수입니다')
        );
    END IF;

    v_val := odd.fn_llm_validate_public_access(
        p_plain_token,
        p_project_id,
        p_project_key,
        ARRAY['announcement.write']::text[]
    );

    IF COALESCE((v_val->>'ok')::boolean, false) IS NOT TRUE THEN
        RETURN jsonb_build_object('ok', false, 'error', v_val->'error');
    END IF;

    v_tid := (v_val->>'token_id')::uuid;
    v_pid := (v_val->>'project_id')::uuid;

    SELECT project_id INTO v_post_pid
    FROM odd.tbl_posts
    WHERE id = p_post_id
      AND source_type = 'community'
      AND is_deleted = false;

    IF v_post_pid IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'NOT_FOUND', 'message', '공지 포스트를 찾을 수 없습니다')
        );
    END IF;

    IF v_post_pid != v_pid THEN
        RETURN jsonb_build_object(
            'ok', false,
            'error', jsonb_build_object('code', 'FORBIDDEN', 'message', '해당 프로젝트에 속한 포스트만 삭제할 수 있습니다')
        );
    END IF;

    UPDATE odd.tbl_posts
    SET is_deleted = true
    WHERE id = p_post_id;

    PERFORM odd.fn_llm_touch_access_token(v_tid);

    RETURN jsonb_build_object(
        'ok', true,
        'project_id', v_pid,
        'project_key', odd.fn_derive_project_key(v_pid),
        'deleted_post_id', p_post_id,
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

COMMENT ON FUNCTION odd.v1_llm_public_announcement_delete IS 'LLM 공개 공지/업데이트 삭제(soft delete). 스코프 announcement.write 필요.';

-- =====================================================
-- 7. 권한
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_llm_public_announcement_list(text, uuid, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_llm_public_announcement_create(text, uuid, text, text, text, text, jsonb, jsonb, boolean, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_llm_public_announcement_update(text, uuid, text, uuid, text, text, jsonb, jsonb, boolean, text, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_llm_public_announcement_delete(text, uuid, text, uuid) TO anon, authenticated;
