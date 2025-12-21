-- =====================================================
-- odd.v1_fetch_projects: 프로젝트 목록 조회 함수
-- =====================================================
-- 
-- 프로젝트 목록을 조회하는 함수입니다.
-- 필터링, 정렬, 페이지네이션을 지원합니다.
-- 작성자 정보도 함께 반환합니다.
-- 
-- 사용 위치:
--   - ExplorePage에서 프로젝트 목록 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_projects', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/010_v1_fetch_projects.sql
-- 
-- =====================================================
-- 1. 프로젝트 목록 조회 함수
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
 *           필터링, 정렬, 페이지네이션을 지원합니다.
 *           작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.
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
 *   - 프로젝트 목록 (작성자 정보, 좋아요 상태 포함)
 *   - category_id: 원본 카테고리 ID (예: devtool, utility, productivity 등)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 *   - 인증된 사용자의 경우 좋아요 상태를 반환하고, 비인증 사용자는 false 반환
 * 
 * 예시 쿼리:
 *   -- 주목할 프로젝트 조회
 *   SELECT * FROM odd.v1_fetch_projects(
 *     p_featured => true,
 *     p_limit => 10,
 *     p_order_by => 'created_at',
 *     p_order_direction => 'desc'
 *   );
 * 
 *   -- 카테고리별 조회
 *   SELECT * FROM odd.v1_fetch_projects(
 *     p_category => 'ai',
 *     p_limit => 20,
 *     p_order_by => 'likes_count',
 *     p_order_direction => 'desc'
 *   );
 * 
 *   -- 페이지네이션 (두 번째 페이지)
 *   SELECT * FROM odd.v1_fetch_projects(
 *     p_limit => 20,
 *     p_offset => 20,
 *     p_order_by => 'created_at',
 *     p_order_direction => 'desc'
 *   );
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
        WHEN 'comments_count' THEN 'p.comments_count'
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
        p.category_id,
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
        p.comments_count,
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
            WHEN v_order_by = 'p.comments_count' AND v_order_direction = 'DESC' THEN p.comments_count
        END DESC NULLS LAST,
        CASE 
            WHEN v_order_by = 'p.comments_count' AND v_order_direction = 'ASC' THEN p.comments_count
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
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_projects IS '프로젝트 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원하며 작성자 정보도 함께 반환합니다.';

-- =====================================================
-- 4. 테스트 쿼리
-- =====================================================

/*
 * 테스트 쿼리:
 * 
 * -- 주목할 프로젝트 조회
 * SELECT * FROM odd.v1_fetch_projects(
 *     p_featured => true,
 *     p_limit => 10
 * );
 * 
 * -- 카테고리별 조회
 * SELECT * FROM odd.v1_fetch_projects(
 *     p_category => 'ai',
 *     p_limit => 20,
 *     p_order_by => 'likes_count',
 *     p_order_direction => 'desc'
 * );
 * 
 * -- 최신 프로젝트 조회
 * SELECT * FROM odd.v1_fetch_projects(
 *     p_limit => 20,
 *     p_order_by => 'created_at',
 *     p_order_direction => 'desc'
 * );
 * 
 * -- 인기 프로젝트 조회
 * SELECT * FROM odd.v1_fetch_projects(
 *     p_limit => 20,
 *     p_order_by => 'likes_count',
 *     p_order_direction => 'desc'
 * );
 */

