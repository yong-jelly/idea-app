-- =====================================================
-- 프로젝트 조회 함수 수정: 실제 의견(대댓글 제외) 개수 계산
-- =====================================================
-- 
-- 프로젝트 목록 및 상세 조회 시 실제 의견 개수를 계산하도록 수정합니다.
-- "의견"은 대댓글을 제외한 최상위 댓글(depth = 0 또는 parent_id IS NULL)만 카운트합니다.
-- 
-- 수정 대상 함수:
--   1. odd.v1_fetch_projects
--   2. odd.v1_fetch_project_detail
--   3. odd.v1_fetch_saved_projects
--   4. odd.v1_fetch_user_projects
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/061_update_project_comment_counts.sql
-- 
-- =====================================================

-- 1. v1_fetch_projects 함수 업데이트
DROP FUNCTION IF EXISTS odd.v1_fetch_projects(boolean, text, integer, integer, text, text);
CREATE OR REPLACE FUNCTION odd.v1_fetch_projects(
    p_featured boolean DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_order_by text DEFAULT 'created_at',
    p_order_direction text DEFAULT 'desc'
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    category_id text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    is_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_order_by text;
    v_order_direction text;
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    END IF;

    IF p_order_by NOT IN ('created_at', 'likes_count', 'comments_count') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 기준입니다: %', p_order_by;
    END IF;
    IF p_order_direction NOT IN ('asc', 'desc') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 방향입니다: %', p_order_direction;
    END IF;
    IF p_category IS NOT NULL AND p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RAISE EXCEPTION '유효하지 않은 카테고리입니다: %', p_category;
    END IF;
    IF p_limit > 100 THEN RAISE EXCEPTION 'limit은 최대 100까지 가능합니다'; END IF;
    IF p_limit < 1 THEN RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다'; END IF;
    IF p_offset < 0 THEN RAISE EXCEPTION 'offset은 0 이상이어야 합니다'; END IF;

    v_order_by := CASE p_order_by
        WHEN 'created_at' THEN 'p.created_at'
        WHEN 'likes_count' THEN 'p.likes_count'
        WHEN 'comments_count' THEN 'actual_comments_count'
        ELSE 'p.created_at'
    END;
    
    v_order_direction := CASE p_order_direction
        WHEN 'asc' THEN 'ASC'
        WHEN 'desc' THEN 'DESC'
        ELSE 'DESC'
    END;

    RETURN QUERY
    SELECT 
        p.id, p.title, p.short_description, p.full_description, p.category, p.category_id, p.tech_stack,
        p.thumbnail, p.gallery_images, p.repository_url, p.demo_url, p.android_store_url, p.ios_store_url, p.mac_store_url,
        p.author_id, p.likes_count,
        COALESCE(comment_counts.actual_comments_count, 0)::integer AS comments_count,
        p.backers_count, p.current_funding, p.target_funding, p.days_left, p.status, p.featured,
        p.created_at, p.updated_at,
        u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM odd.tbl_project_likes pl WHERE pl.project_id = p.id AND pl.user_id = v_user_id)
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
          AND c.parent_id IS NULL  -- 대댓글 제외
          AND c.is_deleted = false
    ) comment_counts ON true
    WHERE p.deleted_at IS NULL
      AND (p_featured IS NULL OR p.featured = p_featured)
      AND (p_category IS NULL OR p.category = p_category)
    ORDER BY 
        CASE WHEN v_order_by = 'p.created_at' AND v_order_direction = 'DESC' THEN p.created_at END DESC NULLS LAST,
        CASE WHEN v_order_by = 'p.created_at' AND v_order_direction = 'ASC' THEN p.created_at END ASC NULLS LAST,
        CASE WHEN v_order_by = 'p.likes_count' AND v_order_direction = 'DESC' THEN p.likes_count END DESC NULLS LAST,
        CASE WHEN v_order_by = 'p.likes_count' AND v_order_direction = 'ASC' THEN p.likes_count END ASC NULLS LAST,
        CASE WHEN v_order_by = 'actual_comments_count' AND v_order_direction = 'DESC' THEN actual_comments_count END DESC NULLS LAST,
        CASE WHEN v_order_by = 'actual_comments_count' AND v_order_direction = 'ASC' THEN actual_comments_count END ASC NULLS LAST,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. v1_fetch_project_detail 함수 업데이트
DROP FUNCTION IF EXISTS odd.v1_fetch_project_detail(uuid);
CREATE OR REPLACE FUNCTION odd.v1_fetch_project_detail(
    p_project_id uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    is_liked boolean
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
    IF p_project_id IS NULL THEN RAISE EXCEPTION '프로젝트 ID는 필수입니다'; END IF;
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id, p.title, p.short_description, p.full_description, p.category, p.tech_stack,
        p.thumbnail, p.gallery_images, p.repository_url, p.demo_url, p.android_store_url, p.ios_store_url, p.mac_store_url,
        p.author_id, p.likes_count,
        COALESCE(comment_counts.actual_comments_count, 0)::integer AS comments_count,
        p.backers_count, p.current_funding, p.target_funding, p.days_left, p.status, p.featured,
        p.created_at, p.updated_at,
        u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM odd.tbl_project_likes pl WHERE pl.project_id = p.id AND pl.user_id = v_user_id)
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
          AND c.parent_id IS NULL  -- 대댓글 제외
          AND c.is_deleted = false
    ) comment_counts ON true
    WHERE p.id = p_project_id
      AND p.deleted_at IS NULL
    LIMIT 1;
END;
$$;

-- 3. v1_fetch_saved_projects 함수 업데이트
DROP FUNCTION IF EXISTS odd.v1_fetch_saved_projects(integer, integer);
CREATE OR REPLACE FUNCTION odd.v1_fetch_saved_projects(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    category_id text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    saved_at timestamptz,
    is_my_project boolean,
    is_liked boolean  -- 추가 (일관성을 위해)
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
    IF v_auth_id IS NULL THEN RAISE EXCEPTION '로그인이 필요합니다'; END IF;
    SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    IF v_user_id IS NULL THEN RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다'; END IF;
    
    RETURN QUERY
    SELECT 
        p.id, p.title, p.short_description, p.full_description, p.category, p.category_id, p.tech_stack,
        p.thumbnail, p.gallery_images, p.repository_url, p.demo_url, p.android_store_url, p.ios_store_url, p.mac_store_url,
        p.author_id, p.likes_count,
        COALESCE(comment_counts.actual_comments_count, 0)::integer AS comments_count,
        p.backers_count, p.current_funding, p.target_funding, p.days_left, p.status, p.featured,
        p.created_at, p.updated_at,
        u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        pb.created_at AS saved_at,
        (p.author_id = v_user_id) AS is_my_project,
        EXISTS (SELECT 1 FROM odd.tbl_project_likes pl WHERE pl.project_id = p.id AND pl.user_id = v_user_id) AS is_liked
    FROM odd.tbl_project_bookmarks pb
    INNER JOIN odd.projects p ON pb.project_id = p.id
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
          AND c.parent_id IS NULL
          AND c.is_deleted = false
    ) comment_counts ON true
    WHERE pb.user_id = v_user_id
      AND p.deleted_at IS NULL
    ORDER BY 
        CASE WHEN p.author_id = v_user_id THEN 0 ELSE 1 END,
        CASE WHEN p.author_id = v_user_id THEN p.created_at END DESC,
        pb.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 4. v1_fetch_user_projects 함수 업데이트
DROP FUNCTION IF EXISTS odd.v1_fetch_user_projects(text, integer, integer);
CREATE OR REPLACE FUNCTION odd.v1_fetch_user_projects(
    p_username text,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    is_liked boolean,
    is_bookmarked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_target_user_id bigint;
BEGIN
    v_auth_id := auth.uid();
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    END IF;

    SELECT u.id INTO v_target_user_id FROM odd.tbl_users u WHERE u.username = p_username AND u.is_active = true;
    IF v_target_user_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT 
        p.id, p.title, p.short_description, p.full_description, p.category, p.tech_stack,
        p.thumbnail, p.gallery_images, p.repository_url, p.demo_url, p.android_store_url, p.ios_store_url, p.mac_store_url,
        p.author_id, p.likes_count,
        COALESCE(comment_counts.actual_comments_count, 0)::integer AS comments_count,
        p.backers_count, p.current_funding, p.target_funding, p.days_left, p.status, p.featured,
        p.created_at, p.updated_at,
        u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM odd.tbl_project_likes pl WHERE pl.project_id = p.id AND pl.user_id = v_user_id)
        ELSE false END AS is_liked,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (SELECT 1 FROM odd.tbl_project_bookmarks pb WHERE pb.project_id = p.id AND pb.user_id = v_user_id)
        ELSE false END AS is_bookmarked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
          AND c.parent_id IS NULL
          AND c.is_deleted = false
    ) comment_counts ON true
    WHERE p.author_id = v_target_user_id
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 5. v1_fetch_my_projects 함수 추가 (내 프로젝트 목록 조회)
DROP FUNCTION IF EXISTS odd.v1_fetch_my_projects(integer, integer);
CREATE OR REPLACE FUNCTION odd.v1_fetch_my_projects(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    category_id text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    author_username text,
    author_display_name text,
    author_avatar_url text,
    is_liked boolean,
    is_bookmarked boolean
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
    IF v_auth_id IS NULL THEN RAISE EXCEPTION '로그인이 필요합니다'; END IF;
    SELECT u.id INTO v_user_id FROM odd.tbl_users u WHERE u.auth_id = v_auth_id;
    IF v_user_id IS NULL THEN RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다'; END IF;

    RETURN QUERY
    SELECT 
        p.id, p.title, p.short_description, p.full_description, p.category, p.category_id, p.tech_stack,
        p.thumbnail, p.gallery_images, p.repository_url, p.demo_url, p.android_store_url, p.ios_store_url, p.mac_store_url,
        p.author_id, p.likes_count,
        COALESCE(comment_counts.actual_comments_count, 0)::integer AS comments_count,
        p.backers_count, p.current_funding, p.target_funding, p.days_left, p.status, p.featured,
        p.created_at, p.updated_at,
        u.username AS author_username, u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        EXISTS (SELECT 1 FROM odd.tbl_project_likes pl WHERE pl.project_id = p.id AND pl.user_id = v_user_id) AS is_liked,
        EXISTS (SELECT 1 FROM odd.tbl_project_bookmarks pb WHERE pb.project_id = p.id AND pb.user_id = v_user_id) AS is_bookmarked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
          AND c.parent_id IS NULL
          AND c.is_deleted = false
    ) comment_counts ON true
    WHERE p.author_id = v_user_id
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 권한 다시 부여
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO authenticated, anon;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail TO authenticated, anon;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_saved_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_projects TO authenticated, anon;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_my_projects TO authenticated;
