-- =====================================================
-- odd.v1_* 블로그 RPC
-- =====================================================
-- 선행: docs/sql/070_create_blog_tables.sql
-- 실행: psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/071_v1_blog_functions.sql
-- =====================================================

CREATE OR REPLACE FUNCTION odd.blog_normalize_slug(p_title text, p_slug text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v text;
BEGIN
  IF p_slug IS NOT NULL AND length(trim(p_slug)) > 0 THEN
    v := lower(trim(p_slug));
  ELSE
    v := lower(regexp_replace(trim(p_title), '[^a-z0-9가-힣]+', '-', 'g'));
  END IF;
  v := regexp_replace(v, '-+', '-', 'g');
  v := trim(both '-' from v);
  IF length(v) < 1 THEN
    v := 'post';
  END IF;
  IF v IN ('write', 'edit', 'new') THEN
    v := v || '-post';
  END IF;
  RETURN v;
END;
$$;

-- ------------------------------------------------------------
-- 목록 (발행된 글만, 최신순)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION odd.v1_list_blog_posts(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_rows jsonb;
BEGIN
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;

    SELECT coalesce(jsonb_agg(x.obj ORDER BY x.published_at DESC NULLS LAST, x.created_at DESC), '[]'::jsonb)
    INTO v_rows
    FROM (
        SELECT
            jsonb_build_object(
                'id', bp.id,
                'slug', bp.slug,
                'title', bp.title,
                'excerpt', bp.excerpt,
                'link_url', bp.link_url,
                'status', bp.status,
                'comments_count', bp.comments_count,
                'created_at', bp.created_at,
                'published_at', bp.published_at,
                'author_username', u.username,
                'author_display_name', u.display_name,
                'author_avatar_url', u.avatar_url
            ) AS obj,
            bp.published_at,
            bp.created_at
        FROM odd.blog_posts bp
        INNER JOIN odd.tbl_users u ON u.id = bp.author_id
        WHERE bp.is_deleted = false
          AND bp.status = 'published'
        ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) x;

    RETURN jsonb_build_object(
        'posts', v_rows,
        'meta', jsonb_build_object(
            'limit', p_limit,
            'offset', p_offset,
            'server_time', now()
        )
    );
END;
$$;

-- ------------------------------------------------------------
-- slug로 단건 조회 (발행은 모두, 초안은 작성자만)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION odd.v1_fetch_blog_post_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_row record;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    END IF;

    SELECT bp.*, u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url
    INTO v_row
    FROM odd.blog_posts bp
    INNER JOIN odd.tbl_users u ON u.id = bp.author_id
    WHERE bp.slug = p_slug AND bp.is_deleted = false;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    IF v_row.status = 'draft' THEN
        IF v_user_id IS NULL OR v_row.author_id <> v_user_id THEN
            RETURN NULL;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'id', v_row.id,
        'slug', v_row.slug,
        'title', v_row.title,
        'excerpt', v_row.excerpt,
        'link_url', v_row.link_url,
        'content_md', v_row.content_md,
        'status', v_row.status,
        'comments_count', v_row.comments_count,
        'author_id', v_row.author_id,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at,
        'published_at', v_row.published_at,
        'author_username', v_row.author_username,
        'author_display_name', v_row.author_display_name,
        'author_avatar_url', v_row.author_avatar_url
    );
END;
$$;

-- ------------------------------------------------------------
-- 생성/수정
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS odd.v1_upsert_blog_post(uuid, text, text, text, text, text);

CREATE OR REPLACE FUNCTION odd.v1_upsert_blog_post(
    p_id uuid DEFAULT NULL,
    p_title text DEFAULT '',
    p_slug text DEFAULT NULL,
    p_excerpt text DEFAULT NULL,
    p_content_md text DEFAULT '',
    p_status text DEFAULT 'draft',
    p_link_url text DEFAULT NULL
)
RETURNS odd.blog_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_slug text;
    v_try text;
    v_n int := 0;
    v_row odd.blog_posts;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    IF p_status IS NOT NULL AND p_status NOT IN ('draft', 'published') THEN
        RAISE EXCEPTION '유효하지 않은 status입니다';
    END IF;

    IF p_id IS NULL THEN
        v_slug := odd.blog_normalize_slug(p_title, p_slug);
        v_try := v_slug;
        WHILE EXISTS (SELECT 1 FROM odd.blog_posts WHERE slug = v_try AND is_deleted = false) LOOP
            v_n := v_n + 1;
            v_try := v_slug || '-' || v_n::text;
        END LOOP;

        INSERT INTO odd.blog_posts (
            author_id, slug, title, excerpt, link_url, content_md, status, published_at
        ) VALUES (
            v_user_id,
            v_try,
            coalesce(nullif(trim(p_title), ''), '제목 없음'),
            p_excerpt,
            nullif(trim(coalesce(p_link_url, '')), ''),
            coalesce(p_content_md, ''),
            coalesce(p_status, 'draft'),
            CASE WHEN coalesce(p_status, 'draft') = 'published' THEN now() ELSE NULL END
        )
        RETURNING * INTO v_row;
        RETURN v_row;
    ELSE
        SELECT * INTO v_row FROM odd.blog_posts WHERE id = p_id AND is_deleted = false;
        IF NOT FOUND THEN
            RAISE EXCEPTION '글을 찾을 수 없습니다';
        END IF;
        IF v_row.author_id <> v_user_id THEN
            RAISE EXCEPTION '수정 권한이 없습니다';
        END IF;

        v_slug := odd.blog_normalize_slug(coalesce(nullif(trim(p_title), ''), v_row.title), coalesce(p_slug, v_row.slug));

        IF v_slug <> v_row.slug THEN
            v_try := v_slug;
            v_n := 0;
            WHILE EXISTS (SELECT 1 FROM odd.blog_posts WHERE slug = v_try AND id <> p_id AND is_deleted = false) LOOP
                v_n := v_n + 1;
                v_try := v_slug || '-' || v_n::text;
            END LOOP;
            v_slug := v_try;
        ELSE
            v_slug := v_row.slug;
        END IF;

        UPDATE odd.blog_posts SET
            title = coalesce(nullif(trim(p_title), ''), title),
            slug = v_slug,
            excerpt = p_excerpt,
            link_url = nullif(trim(coalesce(p_link_url, '')), ''),
            content_md = coalesce(p_content_md, content_md),
            status = coalesce(p_status, status),
            published_at = CASE
                WHEN coalesce(p_status, status) = 'published' AND published_at IS NULL THEN now()
                WHEN coalesce(p_status, status) = 'draft' THEN NULL
                ELSE published_at
            END
        WHERE id = p_id
        RETURNING * INTO v_row;
        RETURN v_row;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION odd.v1_delete_blog_post(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    UPDATE odd.blog_posts
    SET is_deleted = true, updated_at = now()
    WHERE id = p_id AND author_id = v_user_id AND is_deleted = false;
    IF NOT FOUND THEN
        RAISE EXCEPTION '삭제할 수 없습니다';
    END IF;
    RETURN true;
END;
$$;

-- ------------------------------------------------------------
-- 댓글 조회 (피드 v1_fetch_comments와 동일 JSON 형태)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION odd.v1_fetch_blog_comments(
    p_blog_post_id uuid,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_total_count integer;
    v_deleted_total_count integer;
    v_top_level_count integer;
    v_comments jsonb;
    v_server_time timestamptz;
BEGIN
    v_server_time := now();
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    END IF;

    IF p_limit > 200 OR p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 1~200 사이여야 합니다';
    END IF;
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;

    SELECT COUNT(*) INTO v_total_count FROM odd.blog_comments c WHERE c.blog_post_id = p_blog_post_id;
    SELECT COUNT(*) INTO v_deleted_total_count FROM odd.blog_comments c WHERE c.blog_post_id = p_blog_post_id AND c.is_deleted = true;
    SELECT COUNT(*) INTO v_top_level_count FROM odd.blog_comments c WHERE c.blog_post_id = p_blog_post_id AND c.depth = 0;

    WITH top_level_comments AS (
        SELECT c.id
        FROM odd.blog_comments c
        WHERE c.blog_post_id = p_blog_post_id AND c.depth = 0
        ORDER BY c.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    all_comments AS (
        SELECT
            c.id,
            c.blog_post_id AS post_id,
            c.parent_id,
            c.author_id,
            c.content,
            c.images,
            c.depth,
            c.likes_count,
            c.is_deleted,
            c.created_at,
            c.updated_at,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            CASE WHEN v_user_id IS NOT NULL THEN
                EXISTS (SELECT 1 FROM odd.blog_comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = v_user_id)
            ELSE false END AS is_liked
        FROM odd.blog_comments c
        INNER JOIN odd.tbl_users u ON c.author_id = u.id
        WHERE c.blog_post_id = p_blog_post_id
        AND (
            c.id IN (SELECT id FROM top_level_comments)
            OR c.parent_id IN (SELECT id FROM top_level_comments)
            OR EXISTS (
                SELECT 1 FROM odd.blog_comments c2
                WHERE c2.id = c.parent_id AND c2.parent_id IN (SELECT id FROM top_level_comments)
            )
        )
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ac.id,
            'post_id', ac.post_id,
            'parent_id', ac.parent_id,
            'author_id', ac.author_id,
            'content', ac.content,
            'images', ac.images,
            'depth', ac.depth,
            'likes_count', ac.likes_count,
            'is_deleted', ac.is_deleted,
            'created_at', ac.created_at,
            'updated_at', ac.updated_at,
            'author_username', ac.author_username,
            'author_display_name', ac.author_display_name,
            'author_avatar_url', ac.author_avatar_url,
            'is_liked', ac.is_liked
        )
        ORDER BY
            ac.depth ASC,
            CASE WHEN ac.depth = 0 THEN ac.created_at END DESC NULLS LAST,
            CASE WHEN ac.depth > 0 THEN ac.created_at END ASC NULLS LAST,
            ac.created_at ASC
    ) INTO v_comments
    FROM all_comments ac;

    IF v_comments IS NULL THEN
        v_comments := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object(
        'meta', jsonb_build_object(
            'post_id', p_blog_post_id,
            'limit', p_limit,
            'offset', p_offset,
            'server_time', v_server_time
        ),
        'pagination', jsonb_build_object(
            'total_count', v_total_count,
            'deleted_total_count', v_deleted_total_count,
            'top_level_count', v_top_level_count,
            'size', p_limit,
            'offset', p_offset,
            'has_more', (p_offset + p_limit) < v_top_level_count
        ),
        'comments', v_comments
    );
END;
$$;

CREATE OR REPLACE FUNCTION odd.v1_create_blog_comment(
    p_blog_post_id uuid,
    p_content text,
    p_parent_id uuid DEFAULT NULL,
    p_images jsonb DEFAULT '[]'::jsonb
)
RETURNS odd.blog_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post odd.blog_posts;
    v_comment odd.blog_comments;
    v_depth smallint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    SELECT * INTO v_post FROM odd.blog_posts WHERE id = p_blog_post_id AND is_deleted = false;
    IF NOT FOUND THEN
        RAISE EXCEPTION '글을 찾을 수 없습니다';
    END IF;
    IF v_post.status <> 'published' THEN
        RAISE EXCEPTION '댓글을 작성할 수 없는 글입니다';
    END IF;

    IF jsonb_array_length(coalesce(p_images, '[]'::jsonb)) > 0 THEN
        RAISE EXCEPTION '블로그 댓글에는 이미지를 첨부할 수 없습니다';
    END IF;

    IF p_parent_id IS NOT NULL THEN
        SELECT depth INTO v_depth FROM odd.blog_comments WHERE id = p_parent_id AND blog_post_id = p_blog_post_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION '부모 댓글을 찾을 수 없습니다';
        END IF;
        IF v_depth >= 2 THEN
            RAISE EXCEPTION '최대 댓글 깊이를 초과했습니다';
        END IF;
    END IF;

    INSERT INTO odd.blog_comments (blog_post_id, parent_id, author_id, content, images)
    VALUES (p_blog_post_id, p_parent_id, v_user_id, trim(p_content), '[]'::jsonb)
    RETURNING * INTO v_comment;
    RETURN v_comment;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_blog_comment: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION odd.v1_update_blog_comment(
    p_comment_id uuid,
    p_content text,
    p_images jsonb DEFAULT NULL
)
RETURNS odd.blog_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_row odd.blog_comments;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    IF coalesce(jsonb_array_length(p_images), 0) > 0 THEN
        RAISE EXCEPTION '블로그 댓글에는 이미지를 첨부할 수 없습니다';
    END IF;

    UPDATE odd.blog_comments
    SET content = trim(p_content), images = '[]'::jsonb, updated_at = now()
    WHERE id = p_comment_id AND author_id = v_user_id AND is_deleted = false
    RETURNING * INTO v_row;
    IF NOT FOUND THEN
        RAISE EXCEPTION '댓글을 수정할 수 없습니다';
    END IF;
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION odd.v1_delete_blog_comment(p_comment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    UPDATE odd.blog_comments
    SET is_deleted = true, updated_at = now()
    WHERE id = p_comment_id AND author_id = v_user_id AND is_deleted = false;
    IF NOT FOUND THEN
        RAISE EXCEPTION '댓글을 삭제할 수 없습니다';
    END IF;
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION odd.v1_toggle_blog_comment_like(p_comment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_liked boolean;
    v_likes_count integer;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM odd.blog_comments WHERE id = p_comment_id AND is_deleted = false) THEN
        RAISE EXCEPTION '댓글을 찾을 수 없습니다';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM odd.blog_comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id
    ) INTO v_is_liked;

    IF v_is_liked THEN
        DELETE FROM odd.blog_comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id;
    ELSE
        INSERT INTO odd.blog_comment_likes (comment_id, user_id) VALUES (p_comment_id, v_user_id)
        ON CONFLICT DO NOTHING;
    END IF;

    SELECT likes_count INTO v_likes_count FROM odd.blog_comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('is_liked', NOT v_is_liked, 'likes_count', v_likes_count);
END;
$$;

GRANT EXECUTE ON FUNCTION odd.v1_list_blog_posts(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_blog_post_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_upsert_blog_post(uuid, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_delete_blog_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_blog_comments(uuid, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_create_blog_comment(uuid, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_update_blog_comment(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_delete_blog_comment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_toggle_blog_comment_like(uuid) TO authenticated;
