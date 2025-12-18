-- =====================================================
-- odd.v1_fetch_feed: 피드 조회 함수
-- =====================================================
-- 
-- 피드 포스트 목록을 조회하는 함수입니다.
-- 필터링, 정렬, 페이지네이션을 지원합니다.
-- 작성자 정보와 현재 사용자의 인터랙션 상태도 함께 반환합니다.
-- 
-- 사용 위치:
--   - FeedPage에서 피드 목록 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_feed', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/016_v1_fetch_feed.sql
-- 
-- =====================================================
-- 1. 피드 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_feed(
    p_type text DEFAULT NULL,
    p_source_type text DEFAULT NULL,
    p_project_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_order_by text DEFAULT 'created_at',
    p_order_direction text DEFAULT 'desc'
)
RETURNS TABLE (
    id uuid,
    author_id bigint,
    type text,
    content text,
    images jsonb,
    link_preview jsonb,
    project_id uuid,
    milestone_title text,
    feature_title text,
    source_type text,
    source_id uuid,
    source_name text,
    source_emoji text,
    likes_count integer,
    comments_count integer,
    bookmarks_count integer,
    is_pinned boolean,
    created_at timestamptz,
    updated_at timestamptz,
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean,
    is_bookmarked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 피드 포스트 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원하며 작성자 정보와 현재 사용자의 인터랙션 상태도 함께 반환합니다.
 * 
 * 매개변수:
 *   - p_type: 포스트 타입 필터 (NULL이면 모든 타입)
 *             'text', 'project_update', 'milestone', 'feature_accepted' 중 하나
 *   - p_source_type: 출처 타입 필터 (NULL이면 모든 출처)
 *                    'direct', 'project', 'community' 중 하나
 *   - p_project_id: 프로젝트 ID 필터 (NULL이면 모든 프로젝트)
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 *   - p_order_by: 정렬 기준 (기본값: 'created_at')
 *                 'created_at', 'likes_count', 'comments_count' 중 하나
 *   - p_order_direction: 정렬 방향 (기본값: 'desc')
 *                        'asc', 'desc' 중 하나
 * 
 * 반환값:
 *   - 포스트 목록 (작성자 정보 및 현재 사용자 인터랙션 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 삭제되지 않은 포스트를 읽을 수 있음
 *   - 현재 사용자 정보는 auth.uid()로 조회 (인증되지 않은 경우 NULL)
 * 
 * 예시 쿼리:
 *   -- 최신 피드 조회
 *   SELECT * FROM odd.v1_fetch_feed(
 *     p_limit => 20,
 *     p_order_by => 'created_at',
 *     p_order_direction => 'desc'
 *   );
 * 
 *   -- 프로젝트별 포스트 조회
 *   SELECT * FROM odd.v1_fetch_feed(
 *     p_project_id => 'project-uuid-here',
 *     p_limit => 20
 *   );
 * 
 *   -- 타입별 필터링
 *   SELECT * FROM odd.v1_fetch_feed(
 *     p_type => 'milestone',
 *     p_limit => 20
 *   );
 * 
 *   -- 인기 포스트 조회
 *   SELECT * FROM odd.v1_fetch_feed(
 *     p_limit => 20,
 *     p_order_by => 'likes_count',
 *     p_order_direction => 'desc'
 *   );
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_order_by text;
    v_order_direction text;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT id INTO v_user_id
        FROM odd.tbl_users
        WHERE auth_id = v_auth_id;
    END IF;
    
    -- 포스트 타입 유효성 검사
    IF p_type IS NOT NULL AND p_type NOT IN ('text', 'project_update', 'milestone', 'feature_accepted') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_type;
    END IF;
    
    -- 출처 타입 유효성 검사
    IF p_source_type IS NOT NULL AND p_source_type NOT IN ('direct', 'project', 'community') THEN
        RAISE EXCEPTION '유효하지 않은 출처 타입입니다: %', p_source_type;
    END IF;
    
    -- 정렬 기준 유효성 검사
    IF p_order_by NOT IN ('created_at', 'likes_count', 'comments_count') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 기준입니다: %', p_order_by;
    END IF;
    
    -- 정렬 방향 유효성 검사
    IF p_order_direction NOT IN ('asc', 'desc') THEN
        RAISE EXCEPTION '유효하지 않은 정렬 방향입니다: %', p_order_direction;
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
    
    -- 피드 조회 쿼리
    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        p.type,
        p.content,
        p.images,
        p.link_preview,
        p.project_id,
        p.milestone_title,
        p.feature_title,
        p.source_type,
        p.source_id,
        p.source_name,
        p.source_emoji,
        p.likes_count,
        p.comments_count,
        p.bookmarks_count,
        p.is_pinned,
        p.created_at,
        p.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 인터랙션 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_post_likes pl
                WHERE pl.post_id = p.id AND pl.user_id = v_user_id
            )
        ELSE false END AS is_liked,
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_post_bookmarks pb
                WHERE pb.post_id = p.id AND pb.user_id = v_user_id
            )
        ELSE false END AS is_bookmarked
    FROM odd.tbl_posts p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE 
        -- 삭제되지 않은 포스트만 조회
        p.is_deleted = false
        -- 포스트 타입 필터
        AND (p_type IS NULL OR p.type = p_type)
        -- 출처 타입 필터
        AND (p_source_type IS NULL OR p.source_type = p_source_type)
        -- 프로젝트 ID 필터
        AND (p_project_id IS NULL OR p.project_id = p_project_id)
    ORDER BY 
        -- 고정된 포스트를 먼저 표시
        p.is_pinned DESC,
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
        RAISE EXCEPTION 'Error in v1_fetch_feed: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_feed TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_feed TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_feed IS '피드 포스트 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원하며 작성자 정보와 현재 사용자의 인터랙션 상태도 함께 반환합니다.';


