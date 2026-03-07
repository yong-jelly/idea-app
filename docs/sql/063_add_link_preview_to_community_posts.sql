-- =====================================================
-- 커뮤니티 포스트 관련 링크 저장/조회 지원
-- =====================================================
--
-- 목적:
--   - 커뮤니티 공지/업데이트/투표 포스트에 관련 링크를 저장한다
--   - 기존 odd.tbl_posts.link_preview 컬럼을 재사용한다
--   - 커뮤니티 전용 조회/생성/수정/투표 응답 함수에 link_preview를 포함한다
--
-- 저장 형식:
--   - 기본 저장값: [{"url": "https://example.com"}]::jsonb
--   - 최대 3개까지 저장한다
--   - 빈 값, 유효하지 않은 URL, url 없는 객체는 저장 시 제외한다
--   - 최종 유효 링크가 없으면 NULL로 정규화한다
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/063_add_link_preview_to_community_posts.sql

BEGIN;

-- =====================================================
-- 1. 커뮤니티 포스트 조회 함수에 link_preview 추가
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_community_posts(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION odd.v1_fetch_community_posts(
    p_project_id uuid,
    p_post_type text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    author_id bigint,
    type text,
    content text,
    images jsonb,
    link_preview jsonb,
    likes_count integer,
    comments_count integer,
    is_pinned boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    is_liked boolean,
    title text,
    post_type text,
    vote_options jsonb,
    voted_option_id uuid,
    total_votes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    v_auth_id := auth.uid();

    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;

    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;

    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;

    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;

    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.author_id,
        p.type,
        p.content,
        p.images,
        p.link_preview,
        p.likes_count,
        p.comments_count,
        p.is_pinned,
        p.created_at,
        p.updated_at,
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_post_likes pl
                WHERE pl.post_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked,
        pa.title,
        pa.post_type,
        CASE
            WHEN pa.post_type = 'vote' THEN
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', pv.id::text,
                            'text', pv.option_text,
                            'votesCount', pv.votes_count,
                            'sortOrder', pv.sort_order
                        ) ORDER BY pv.sort_order
                    ) FILTER (WHERE pv.id IS NOT NULL),
                    '[]'::jsonb
                )
            ELSE NULL::jsonb
        END AS vote_options,
        CASE
            WHEN pa.post_type = 'vote' AND v_user_id IS NOT NULL THEN
                (SELECT pvr.vote_option_id
                 FROM odd.tbl_post_vote_responses pvr
                 WHERE pvr.post_id = p.id AND pvr.user_id = v_user_id
                 LIMIT 1)
            ELSE NULL::uuid
        END AS voted_option_id,
        CASE
            WHEN pa.post_type = 'vote' THEN
                COALESCE(SUM(pv.votes_count), 0)::integer
            ELSE NULL::integer
        END AS total_votes
    FROM odd.tbl_posts p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    INNER JOIN odd.tbl_post_announcements pa ON p.id = pa.post_id
    LEFT JOIN odd.tbl_post_votes pv ON p.id = pv.post_id AND pa.post_type = 'vote'
    WHERE
        p.is_deleted = false
        AND p.project_id = p_project_id
        AND p.source_type = 'community'
        AND (p_post_type IS NULL OR pa.post_type = p_post_type)
    GROUP BY
        p.id, p.author_id, p.type, p.content, p.images, p.link_preview, p.likes_count, p.comments_count,
        p.is_pinned, p.created_at, p.updated_at,
        u.username, u.display_name, u.avatar_url,
        pa.title, pa.post_type, v_user_id
    ORDER BY
        p.is_pinned DESC,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_community_posts: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 커뮤니티 포스트 생성 함수에 p_link_preview 추가
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_create_community_post(uuid, text, text, text, jsonb, boolean, text[]) CASCADE;
DROP FUNCTION IF EXISTS odd.v1_create_community_post(uuid, text, text, text, jsonb, jsonb, boolean, text[]) CASCADE;

CREATE OR REPLACE FUNCTION odd.v1_create_community_post(
    p_project_id uuid,
    p_post_type text,
    p_title text,
    p_content text,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_link_preview jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT false,
    p_vote_options text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_id uuid;
    v_project_author_id bigint;
    v_post_db_type text;
    v_option_text text;
    v_sort_order integer;
    v_project_title text;
    v_link_url text;
    v_normalized_link_preview jsonb;
    v_link_item jsonb;
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

    SELECT prj.author_id, prj.title INTO v_project_author_id, v_project_title
    FROM odd.projects prj
    WHERE prj.id = p_project_id;

    IF v_project_author_id IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;

    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 공지를 작성할 수 있습니다';
    END IF;

    IF p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;

    IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 3 THEN
        RAISE EXCEPTION '이미지는 최대 3장까지 첨부할 수 있습니다';
    END IF;

    IF p_post_type = 'vote' THEN
        IF p_vote_options IS NULL OR array_length(p_vote_options, 1) < 2 THEN
            RAISE EXCEPTION '투표 옵션은 최소 2개 이상 필요합니다';
        END IF;

        IF array_length(p_vote_options, 1) > 5 THEN
            RAISE EXCEPTION '투표 옵션은 최대 5개까지 가능합니다';
        END IF;
    END IF;

    IF p_link_preview IS NOT NULL THEN
        v_normalized_link_preview := '[]'::jsonb;

        IF jsonb_typeof(p_link_preview) = 'array' THEN
            FOR v_link_item IN
                SELECT value
                FROM jsonb_array_elements(p_link_preview)
            LOOP
                EXIT WHEN jsonb_array_length(v_normalized_link_preview) >= 3;

                IF jsonb_typeof(v_link_item) = 'object' THEN
                    v_link_url := trim(COALESCE(v_link_item->>'url', ''));

                    IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
                        v_normalized_link_preview := v_normalized_link_preview || jsonb_build_array(
                            jsonb_build_object('url', v_link_url)
                        );
                    END IF;
                END IF;
            END LOOP;
        ELSIF jsonb_typeof(p_link_preview) = 'object' THEN
            v_link_url := trim(COALESCE(p_link_preview->>'url', ''));

            IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
                v_normalized_link_preview := jsonb_build_array(
                    jsonb_build_object('url', v_link_url)
                );
            END IF;
        END IF;

        IF jsonb_array_length(v_normalized_link_preview) = 0 THEN
            v_normalized_link_preview := NULL;
        END IF;
    END IF;

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
        v_user_id,
        v_post_db_type,
        p_content,
        COALESCE(p_images, '[]'::jsonb),
        v_normalized_link_preview,
        p_project_id,
        'community',
        p_project_id,
        v_project_title,
        '📢',
        p_is_pinned
    )
    RETURNING id INTO v_post_id;

    INSERT INTO odd.tbl_post_announcements (
        post_id,
        title,
        post_type,
        is_pinned
    ) VALUES (
        v_post_id,
        p_title,
        p_post_type,
        p_is_pinned
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

    RETURN v_post_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_community_post: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 커뮤니티 포스트 수정 함수에 p_link_preview 추가
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_update_community_post(uuid, text, text, jsonb, boolean, text, text[]);
DROP FUNCTION IF EXISTS odd.v1_update_community_post(uuid, text, text, jsonb, jsonb, boolean, text, text[]);

CREATE OR REPLACE FUNCTION odd.v1_update_community_post(
    p_post_id uuid,
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_link_preview jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT NULL,
    p_post_type text DEFAULT NULL,
    p_vote_options text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_author_id bigint;
    v_post_type text;
    v_option_text text;
    v_sort_order integer;
    v_vote_response_count integer := 0;
    v_link_url text;
    v_normalized_link_preview jsonb;
    v_link_item jsonb;
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

    SELECT pst.author_id INTO v_post_author_id
    FROM odd.tbl_posts pst
    WHERE pst.id = p_post_id;

    IF v_post_author_id IS NULL THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;

    IF v_post_author_id != v_user_id THEN
        RAISE EXCEPTION '작성자만 포스트를 수정할 수 있습니다';
    END IF;

    SELECT post_type INTO v_post_type
    FROM odd.tbl_post_announcements
    WHERE post_id = p_post_id;

    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;

    IF v_post_type != 'vote' AND p_post_type = 'vote' AND p_vote_options IS NULL THEN
        RAISE EXCEPTION '투표 타입으로 변경할 때는 투표 옵션이 필요합니다';
    END IF;

    IF p_vote_options IS NOT NULL THEN
        IF array_length(p_vote_options, 1) < 2 THEN
            RAISE EXCEPTION '투표 옵션은 최소 2개 이상 필요합니다';
        END IF;

        IF array_length(p_vote_options, 1) > 5 THEN
            RAISE EXCEPTION '투표 옵션은 최대 5개까지 가능합니다';
        END IF;
    END IF;

    IF p_link_preview IS NOT NULL THEN
        v_normalized_link_preview := '[]'::jsonb;

        IF jsonb_typeof(p_link_preview) = 'array' THEN
            FOR v_link_item IN
                SELECT value
                FROM jsonb_array_elements(p_link_preview)
            LOOP
                EXIT WHEN jsonb_array_length(v_normalized_link_preview) >= 3;

                IF jsonb_typeof(v_link_item) = 'object' THEN
                    v_link_url := trim(COALESCE(v_link_item->>'url', ''));

                    IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
                        v_normalized_link_preview := v_normalized_link_preview || jsonb_build_array(
                            jsonb_build_object('url', v_link_url)
                        );
                    END IF;
                END IF;
            END LOOP;
        ELSIF jsonb_typeof(p_link_preview) = 'object' THEN
            v_link_url := trim(COALESCE(p_link_preview->>'url', ''));

            IF v_link_url != '' AND v_link_url ~* '^https?://' THEN
                v_normalized_link_preview := jsonb_build_array(
                    jsonb_build_object('url', v_link_url)
                );
            END IF;
        END IF;

        IF jsonb_array_length(v_normalized_link_preview) = 0 THEN
            v_normalized_link_preview := NULL;
        END IF;
    END IF;

    IF v_post_type = 'vote' AND (
        (p_post_type IS NOT NULL AND p_post_type != 'vote')
        OR p_vote_options IS NOT NULL
    ) THEN
        SELECT COUNT(*)::integer INTO v_vote_response_count
        FROM odd.tbl_post_vote_responses
        WHERE post_id = p_post_id;

        IF v_vote_response_count > 0 THEN
            IF p_post_type IS NOT NULL AND p_post_type != 'vote' THEN
                RAISE EXCEPTION '응답이 있는 투표는 다른 타입으로 변경할 수 없습니다';
            END IF;

            IF p_vote_options IS NOT NULL THEN
                RAISE EXCEPTION '응답이 있는 투표는 옵션을 수정할 수 없습니다';
            END IF;
        END IF;
    END IF;

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
                ELSE v_normalized_link_preview
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

    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_community_post: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 투표 응답 반환값에 link_preview 추가
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_vote_response(
    p_post_id uuid,
    p_vote_option_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_existing_response uuid;
    v_result jsonb;
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

    SELECT vote_option_id INTO v_existing_response
    FROM odd.tbl_post_vote_responses
    WHERE post_id = p_post_id AND user_id = v_user_id;

    IF v_existing_response IS NOT NULL THEN
        IF v_existing_response = p_vote_option_id THEN
            DELETE FROM odd.tbl_post_vote_responses
            WHERE post_id = p_post_id AND user_id = v_user_id;
        ELSE
            UPDATE odd.tbl_post_vote_responses
            SET vote_option_id = p_vote_option_id
            WHERE post_id = p_post_id AND user_id = v_user_id;
        END IF;
    ELSE
        INSERT INTO odd.tbl_post_vote_responses (
            post_id,
            vote_option_id,
            user_id
        ) VALUES (
            p_post_id,
            p_vote_option_id,
            v_user_id
        );
    END IF;

    SELECT jsonb_build_object(
        'id', p.id,
        'author_id', p.author_id,
        'type', p.type,
        'content', p.content,
        'images', p.images,
        'link_preview', p.link_preview,
        'likes_count', p.likes_count,
        'comments_count', p.comments_count,
        'is_pinned', p.is_pinned,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'author_username', u.username,
        'author_display_name', u.display_name,
        'author_avatar_url', u.avatar_url,
        'is_liked', CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_post_likes pl
                WHERE pl.post_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END,
        'title', pa.title,
        'post_type', pa.post_type,
        'vote_options', CASE
            WHEN pa.post_type = 'vote' THEN
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', pv.id::text,
                            'text', pv.option_text,
                            'votesCount', pv.votes_count,
                            'sortOrder', pv.sort_order
                        ) ORDER BY pv.sort_order
                    ) FILTER (WHERE pv.id IS NOT NULL),
                    '[]'::jsonb
                )
            ELSE NULL::jsonb
        END,
        'voted_option_id', CASE
            WHEN pa.post_type = 'vote' AND v_user_id IS NOT NULL THEN
                (SELECT pvr.vote_option_id
                 FROM odd.tbl_post_vote_responses pvr
                 WHERE pvr.post_id = p.id AND pvr.user_id = v_user_id
                 LIMIT 1)
            ELSE NULL::uuid
        END,
        'total_votes', CASE
            WHEN pa.post_type = 'vote' THEN
                COALESCE(SUM(pv.votes_count), 0)::integer
            ELSE NULL::integer
        END
    ) INTO v_result
    FROM odd.tbl_posts p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    INNER JOIN odd.tbl_post_announcements pa ON p.id = pa.post_id
    LEFT JOIN odd.tbl_post_votes pv ON p.id = pv.post_id AND pa.post_type = 'vote'
    WHERE p.id = p_post_id
    GROUP BY
        p.id, p.author_id, p.type, p.content, p.images, p.link_preview, p.likes_count, p.comments_count,
        p.is_pinned, p.created_at, p.updated_at,
        u.username, u.display_name, u.avatar_url,
        pa.title, pa.post_type, v_user_id;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_vote_response: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 권한 및 코멘트 갱신
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_community_post(uuid, text, text, text, jsonb, jsonb, boolean, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_update_community_post(uuid, text, text, jsonb, jsonb, boolean, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_create_vote_response(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION odd.v1_create_community_post(uuid, text, text, text, jsonb, jsonb, boolean, text[]) IS '커뮤니티 포스트를 생성하는 함수. 관련 링크는 odd.tbl_posts.link_preview에 최대 3개 배열로 저장한다.';
COMMENT ON FUNCTION odd.v1_update_community_post(uuid, text, text, jsonb, jsonb, boolean, text, text[]) IS '커뮤니티 포스트를 수정하는 함수. p_link_preview의 유효한 링크만 최대 3개 저장하며, 유효 링크가 없으면 제거한다.';
COMMENT ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) IS '커뮤니티 포스트 목록을 조회하는 함수. 관련 링크는 link_preview로 반환한다.';

COMMIT;
