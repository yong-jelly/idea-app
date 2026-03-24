-- =====================================================
-- 보강: odd.blog_posts.view_count + 조회 증가 RPC + 목록/상세 반영
-- =====================================================
-- 선행: docs/sql/070, 071 적용 후 실행.
-- 목록·상세 JSON의 view_count는 로그인 사용자가 해당 글 작성자일 때만 채움(그 외 null).
-- 실행: psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/073_add_blog_posts_view_count.sql
-- =====================================================

ALTER TABLE odd.blog_posts
    ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN odd.blog_posts.view_count IS '발행 글 상세 조회 시 증가. 목록/상세 JSON은 작성자에게만 노출';

-- ------------------------------------------------------------
-- 목록: 작성자에게만 view_count 포함
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
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT id INTO v_user_id FROM odd.tbl_users WHERE auth_id = v_auth_id;
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
                'author_id', bp.author_id,
                'author_username', u.username,
                'author_display_name', u.display_name,
                'author_avatar_url', u.avatar_url,
                'view_count', CASE WHEN v_user_id IS NOT NULL AND v_user_id = bp.author_id THEN bp.view_count ELSE NULL END
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
-- 상세: 작성자에게만 view_count 포함
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
        'view_count', CASE WHEN v_user_id IS NOT NULL AND v_user_id = v_row.author_id THEN v_row.view_count ELSE NULL END,
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
-- 발행 글 상세 1회 조회 시 호출(비로그인 포함). 초안·삭제 글은 반영 없음.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION odd.v1_increment_blog_post_view(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
BEGIN
    IF p_slug IS NULL OR length(trim(p_slug)) < 1 THEN
        RETURN;
    END IF;
    UPDATE odd.blog_posts
    SET view_count = view_count + 1
    WHERE slug = trim(p_slug)
      AND is_deleted = false
      AND status = 'published';
END;
$$;

GRANT EXECUTE ON FUNCTION odd.v1_increment_blog_post_view(text) TO anon, authenticated;
