-- =====================================================
-- 프로젝트 목록 조회 함수 수정: 실제 댓글 카운트 계산
-- =====================================================
-- 
-- 프로젝트 목록 조회 시 실제 댓글 개수를 계산하도록 수정합니다.
-- tbl_comments 테이블에서 프로젝트 ID로 댓글을 카운트합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/043_update_projects_comments_count.sql
-- 
-- =====================================================응
-- 1. v1_fetch_projects 함수 수정
-- =====================================================

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
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원하며 작성자 정보도 함께 반환합니다.
 *           실제 댓글 개수를 계산하여 반환합니다.
 *           현재 사용자의 좋아요 상태도 함께 반환합니다.
 * 
 * 매개변수:
 *   - p_featured: 주목할 프로젝트만 조회 (NULL이면 모든 프로젝트)
 *   - p_category: 카테고리 필터 (NULL이면 모든 카테고리)
 *                 'game', 'web', 'mobile', 'tool', 'opensource', 'ai' 중 하나
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 *   - p_order_by: 정렬 기준 (기본값: 'created_at')
 *                 'created_at', 'likes_count', 'comments_count' 중 하나
 *   - p_order_direction: 정렬 방향 (기본값: 'desc')
 *                        'asc', 'desc' 중 하나
 * 
 * 반환값:
 *   - 프로젝트 목록 (작성자 정보 포함, 실제 댓글 개수 포함, 좋아요 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 *   - 인증된 사용자의 경우 좋아요 상태를 반환하고, 비인증 사용자는 false 반환
 */
DECLARE
    v_query text;
    v_order_by text;
    v_order_direction text;
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    -- 정렬 기준 유효성 검사
    IF p_order_by NOT IN ('created_at', 'likes_count', 'comments_count') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 기준입니다: %', p_order_by;
    END IF;
    
    -- 정렬 방향 유효성 검사
    IF p_order_direction NOT IN ('asc', 'desc') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 방향입니다: %', p_order_direction;
    END IF;
    
    -- 카테고리 유효성 검사
    IF p_category IS NOT NULL AND p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RAISE EXCEPTION '유효하지 않은 카테고리입니다: %', p_category;
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 정렬 기준 설정 (SQL injection 방지를 위해 CASE 사용)
    v_order_by := CASE p_order_by
        WHEN 'created_at' THEN 'p.created_at'
        WHEN 'likes_count' THEN 'p.likes_count'
        WHEN 'comments_count' THEN 'actual_comments_count'
        ELSE 'p.created_at'
    END;
    
    -- 정렬 방향 설정
    v_order_direction := CASE p_order_direction
        WHEN 'asc' THEN 'ASC'
        WHEN 'desc' THEN 'DESC'
        ELSE 'DESC'
    END;
    
    -- 동적 쿼리 생성 (보안을 위해 CASE 문 사용)
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        -- 실제 댓글 개수 계산 (is_deleted = false인 댓글만 카운트)
        COALESCE(actual_comments_count, 0)::integer AS comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 좋아요 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_project_likes pl
                WHERE pl.project_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
        AND c.is_deleted = false
    ) comment_counts ON true
    WHERE 
        -- featured 필터
        (p_featured IS NULL OR p.featured = p_featured)
        -- category 필터
        AND (p_category IS NULL OR p.category = p_category)
    ORDER BY 
        -- 정렬 기준과 방향에 따라 동적으로 정렬
        CASE 
            WHEN v_order_by = 'p.created_at' AND v_order_direction = 'DESC' THEN p.created_at
        END DESC NULLS LAST,
        CASE 
            WHEN v_order_by = 'p.created_at' AND v_order_direction = 'ASC' THEN p.created_at
        END ASC NULLS LAST,
        CASE 
            WHEN v_order_by = 'p.likes_count' AND v_order_direction = 'DESC' THEN p.likes_count
        END DESC NULLS LAST,
        CASE 
            WHEN v_order_by = 'p.likes_count' AND v_order_direction = 'ASC' THEN p.likes_count
        END ASC NULLS LAST,
        CASE 
            WHEN v_order_by = 'actual_comments_count' AND v_order_direction = 'DESC' THEN actual_comments_count
        END DESC NULLS LAST,
        CASE 
            WHEN v_order_by = 'actual_comments_count' AND v_order_direction = 'ASC' THEN actual_comments_count
        END ASC NULLS LAST,
        -- 기본 정렬 (created_at DESC)
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. v1_fetch_saved_projects 함수 수정
-- =====================================================

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
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 저장 일시
    saved_at timestamptz,
    -- 내가 생성한 프로젝트 여부
    is_my_project boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 현재 사용자가 저장한 프로젝트 목록을 조회합니다.
 *           내가 생성한 프로젝트와 저장한 프로젝트를 구분하여 반환합니다.
 *           실제 댓글 개수를 계산하여 반환합니다.
 *           - 내가 생성한 프로젝트: 생성일 최신순으로 정렬
 *           - 내가 저장한 프로젝트: 저장일 순으로 정렬 (내가 생성한 프로젝트 제외)
 * 
 * 매개변수:
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 저장한 프로젝트 목록 (작성자 정보, 저장 일시, 내가 생성한 프로젝트 여부, 실제 댓글 개수 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 인증된 사용자만 접근 가능
 *   - 현재 로그인한 사용자의 저장 목록만 반환
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 저장한 프로젝트 목록 조회
    -- 내가 생성한 프로젝트는 생성일 최신순으로, 저장한 프로젝트는 저장일 순으로 정렬
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        -- 실제 댓글 개수 계산 (is_deleted = false인 댓글만 카운트)
        COALESCE(actual_comments_count, 0)::integer AS comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        pb.created_at AS saved_at,
        -- 내가 생성한 프로젝트 여부
        (p.author_id = v_user_id) AS is_my_project
    FROM odd.tbl_project_bookmarks pb
    INNER JOIN odd.projects p ON pb.project_id = p.id
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
        AND c.is_deleted = false
    ) comment_counts ON true
    WHERE pb.user_id = v_user_id
    ORDER BY 
        -- 내가 생성한 프로젝트를 먼저 표시 (생성일 최신순)
        CASE WHEN p.author_id = v_user_id THEN 0 ELSE 1 END,
        -- 내가 생성한 프로젝트는 생성일 최신순
        CASE WHEN p.author_id = v_user_id THEN p.created_at END DESC,
        -- 저장한 프로젝트는 저장일 순
        CASE WHEN p.author_id != v_user_id THEN pb.created_at END DESC
    LIMIT p_limit
    OFFSET p_offset;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_saved_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 권한 부여
-- =====================================================

-- v1_fetch_projects 권한 (이미 부여되어 있을 수 있음)
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO anon;

-- v1_fetch_saved_projects 권한 (이미 부여되어 있을 수 있음)
GRANT EXECUTE ON FUNCTION odd.v1_fetch_saved_projects TO authenticated;

-- =====================================================
-- 4. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_projects IS '프로젝트 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원하며 작성자 정보도 함께 반환합니다. 실제 댓글 개수를 계산하여 반환합니다. 현재 사용자의 좋아요 상태도 함께 반환합니다.';

COMMENT ON FUNCTION odd.v1_fetch_saved_projects IS '현재 사용자가 저장한 프로젝트 목록을 조회하는 함수. 내가 생성한 프로젝트와 저장한 프로젝트를 구분하여 반환합니다. 실제 댓글 개수를 계산하여 반환합니다.';

-- =====================================================
-- 5. v1_fetch_project_detail 함수 수정
-- =====================================================

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
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트 상세 정보를 조회합니다.
 *           작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.
 *           실제 댓글 개수를 계산하여 반환합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - 프로젝트 상세 정보 (작성자 정보 포함, 실제 댓글 개수 포함, 좋아요 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 *   - 인증된 사용자의 경우 좋아요 상태를 반환하고, 비인증 사용자는 false 반환
 */
DECLARE
    v_project_id uuid;
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 프로젝트 ID 유효성 검사
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 ID는 필수입니다';
    END IF;
    
    v_project_id := p_project_id;
    
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- 프로젝트 상세 조회
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        -- 실제 댓글 개수 계산 (is_deleted = false인 댓글만 카운트)
        COALESCE(actual_comments_count, 0)::integer AS comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 좋아요 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_project_likes pl
                WHERE pl.project_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS actual_comments_count
        FROM odd.tbl_comments c
        WHERE c.post_id = p.id
        AND c.is_deleted = false
    ) comment_counts ON true
    WHERE p.id = v_project_id
    LIMIT 1;

    -- 프로젝트가 없는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다: %', v_project_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_project_detail: %', SQLERRM;
END;
$$;

-- v1_fetch_project_detail 권한 (이미 부여되어 있을 수 있음)
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO anon;

COMMENT ON FUNCTION odd.v1_fetch_project_detail IS '프로젝트 상세 정보를 조회하는 함수. 작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다. 실제 댓글 개수를 계산하여 반환합니다.';

