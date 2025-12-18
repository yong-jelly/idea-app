-- =====================================================
-- odd.v1_post_interactions: 포스트 인터랙션 함수들
-- =====================================================
-- 
-- 포스트에 대한 좋아요/북마크 토글 함수들입니다.
-- 트리거를 통해 자동으로 카운트가 동기화됩니다.
-- 
-- 사용 위치:
--   - FeedPage, PostDetailPage에서 좋아요/북마크 토글 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_toggle_post_like', {...})
--   - 프론트엔드: supabase.schema('odd').rpc('v1_toggle_post_bookmark', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/017_v1_post_interactions.sql
-- 
-- =====================================================
-- 1. 포스트 좋아요 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_post_like(
    p_post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 포스트에 좋아요를 토글합니다.
 *           좋아요가 없으면 추가하고, 있으면 제거합니다.
 *           트리거를 통해 자동으로 likes_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 * 
 * 반환값:
 *   - JSON 객체: {"is_liked": boolean, "likes_count": integer}
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 좋아요 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_toggle_post_like('post-uuid-here');
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_liked boolean;
    v_likes_count integer;
BEGIN
    -- 현재 로그인한 사용자 auth_id 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT id INTO v_user_id
    FROM odd.tbl_users
    WHERE auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 포스트 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.tbl_posts WHERE id = p_post_id AND is_deleted = false) THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;
    
    -- 좋아요 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_post_likes
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_liked;
    
    -- 좋아요 토글
    IF v_is_liked THEN
        -- 좋아요 제거
        DELETE FROM odd.tbl_post_likes
        WHERE post_id = p_post_id AND user_id = v_user_id;
    ELSE
        -- 좋아요 추가
        INSERT INTO odd.tbl_post_likes (post_id, user_id)
        VALUES (p_post_id, v_user_id)
        ON CONFLICT (post_id, user_id) DO NOTHING;
    END IF;
    
    -- 업데이트된 좋아요 수 조회
    SELECT likes_count INTO v_likes_count
    FROM odd.tbl_posts
    WHERE id = p_post_id;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'is_liked', NOT v_is_liked,
        'likes_count', v_likes_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_post_like: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 포스트 북마크 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_post_bookmark(
    p_post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 포스트에 북마크를 토글합니다.
 *           북마크가 없으면 추가하고, 있으면 제거합니다.
 *           트리거를 통해 자동으로 bookmarks_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 * 
 * 반환값:
 *   - JSON 객체: {"is_bookmarked": boolean, "bookmarks_count": integer}
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 북마크 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_toggle_post_bookmark('post-uuid-here');
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_bookmarked boolean;
    v_bookmarks_count integer;
BEGIN
    -- 현재 로그인한 사용자 auth_id 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT id INTO v_user_id
    FROM odd.tbl_users
    WHERE auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 포스트 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.tbl_posts WHERE id = p_post_id AND is_deleted = false) THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;
    
    -- 북마크 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_post_bookmarks
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_bookmarked;
    
    -- 북마크 토글
    IF v_is_bookmarked THEN
        -- 북마크 제거
        DELETE FROM odd.tbl_post_bookmarks
        WHERE post_id = p_post_id AND user_id = v_user_id;
    ELSE
        -- 북마크 추가
        INSERT INTO odd.tbl_post_bookmarks (post_id, user_id)
        VALUES (p_post_id, v_user_id)
        ON CONFLICT (post_id, user_id) DO NOTHING;
    END IF;
    
    -- 업데이트된 북마크 수 조회
    SELECT bookmarks_count INTO v_bookmarks_count
    FROM odd.tbl_posts
    WHERE id = p_post_id;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'is_bookmarked', NOT v_is_bookmarked,
        'bookmarks_count', v_bookmarks_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_post_bookmark: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_toggle_post_like TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_toggle_post_bookmark TO authenticated;

-- =====================================================
-- 4. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_toggle_post_like IS '포스트에 좋아요를 토글하는 함수. 트리거를 통해 자동으로 likes_count가 동기화됩니다.';
COMMENT ON FUNCTION odd.v1_toggle_post_bookmark IS '포스트에 북마크를 토글하는 함수. 트리거를 통해 자동으로 bookmarks_count가 동기화됩니다.';



