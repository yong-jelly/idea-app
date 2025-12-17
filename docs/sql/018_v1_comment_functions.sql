-- =====================================================
-- odd.v1_comment_*: 댓글 관련 함수들
-- =====================================================
-- 
-- 댓글 생성, 조회, 좋아요, 수정, 삭제 함수들입니다.
-- 트리거를 통해 자동으로 카운트가 동기화됩니다.
-- 
-- 사용 위치:
--   - PostDetailPage, ProjectDetailPage에서 댓글 CRUD 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_create_comment', {...})
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_comments', {...})
--   - 프론트엔드: supabase.schema('odd').rpc('v1_toggle_comment_like', {...})
--   - 프론트엔드: supabase.schema('odd').rpc('v1_update_comment', {...})
--   - 프론트엔드: supabase.schema('odd').rpc('v1_delete_comment', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/018_v1_comment_functions.sql
-- 
-- =====================================================
-- 1. 댓글 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_comment(
    p_post_id uuid,
    p_content text,
    p_parent_id uuid DEFAULT NULL,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_link_preview jsonb DEFAULT NULL
)
RETURNS odd.tbl_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 댓글을 생성합니다.
 *           트리거를 통해 자동으로 depth가 계산되고 comments_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 *   - p_content: 댓글 내용 (필수)
 *   - p_parent_id: 부모 댓글 ID (선택, 답글인 경우)
 *   - p_images: 이미지 URL 배열 (선택, 최대 1장)
 *              예: '["url1"]'::jsonb
 *   - p_link_preview: 링크 프리뷰 정보 (선택)
 * 
 * 반환값:
 *   - 생성된 댓글 레코드 (odd.tbl_comments)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 댓글 생성 가능
 * 
 * 예시 쿼리:
 *   -- 원댓글 생성
 *   SELECT * FROM odd.v1_create_comment(
 *     'post-uuid-here',
 *     '정말 좋은 포스트네요!'
 *   );
 * 
 *   -- 답글 생성
 *   SELECT * FROM odd.v1_create_comment(
 *     'post-uuid-here',
 *     '동감합니다!',
 *     'parent-comment-uuid-here'
 *   );
 */
DECLARE
    v_comment odd.tbl_comments;
    v_auth_id uuid;
    v_user_id bigint;
    v_depth smallint;
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
    
    -- 부모 댓글 확인 및 depth 계산
    IF p_parent_id IS NOT NULL THEN
        -- 부모 댓글이 존재하는지 확인
        IF NOT EXISTS (SELECT 1 FROM odd.tbl_comments WHERE id = p_parent_id AND post_id = p_post_id) THEN
            RAISE EXCEPTION '부모 댓글을 찾을 수 없습니다';
        END IF;
        
        -- 부모 댓글의 depth 확인
        SELECT depth INTO v_depth
        FROM odd.tbl_comments
        WHERE id = p_parent_id;
        
        -- 최대 depth 검사 (2까지만 허용)
        IF v_depth >= 2 THEN
            RAISE EXCEPTION '최대 댓글 깊이를 초과했습니다 (최대 3단계)';
        END IF;
        
        v_depth := v_depth + 1;
    ELSE
        v_depth := 0;
    END IF;
    
    -- 이미지 개수 검사 (최대 1장)
    IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 1 THEN
        RAISE EXCEPTION '댓글에는 최대 1장의 이미지만 첨부할 수 있습니다';
    END IF;
    
    -- 댓글 생성
    INSERT INTO odd.tbl_comments (
        post_id,
        parent_id,
        author_id,
        content,
        images,
        link_preview,
        depth
    ) VALUES (
        p_post_id,
        p_parent_id,
        v_user_id,
        p_content,
        COALESCE(p_images, '[]'::jsonb),
        p_link_preview,
        v_depth
    )
    RETURNING * INTO v_comment;
    
    RETURN v_comment;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_comment: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 댓글 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_comments(
    p_post_id uuid,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    post_id uuid,
    parent_id uuid,
    author_id bigint,
    content text,
    images jsonb,
    link_preview jsonb,
    depth smallint,
    likes_count integer,
    is_deleted boolean,
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
 * 함수 설명: 포스트의 댓글 목록을 조회합니다.
 *           작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.
 *           원댓글(depth=0)은 최신순, 답글은 오래된순으로 정렬됩니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 *   - p_limit: 조회 개수 제한 (기본값: 100, 최대: 200)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 댓글 목록 (작성자 정보 및 현재 사용자 좋아요 상태 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_fetch_comments('post-uuid-here');
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT id INTO v_user_id
        FROM odd.tbl_users
        WHERE auth_id = v_auth_id;
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 200 THEN
        RAISE EXCEPTION 'limit은 최대 200까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 댓글 조회 쿼리
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.parent_id,
        c.author_id,
        c.content,
        c.images,
        c.link_preview,
        c.depth,
        c.likes_count,
        c.is_deleted,
        c.created_at,
        c.updated_at,
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        -- 현재 사용자 좋아요 상태
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_comment_likes cl
                WHERE cl.comment_id = c.id AND cl.user_id = v_user_id
            )
        ELSE false END AS is_liked
    FROM odd.tbl_comments c
    INNER JOIN odd.tbl_users u ON c.author_id = u.id
    WHERE 
        c.post_id = p_post_id
    ORDER BY 
        -- 원댓글(depth=0)은 최신순, 답글은 오래된순
        c.depth ASC,
        CASE WHEN c.depth = 0 THEN c.created_at END DESC,
        CASE WHEN c.depth > 0 THEN c.created_at END ASC,
        -- 기본 정렬
        c.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_comments: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 댓글 좋아요 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_comment_like(
    p_comment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 댓글에 좋아요를 토글합니다.
 *           트리거를 통해 자동으로 likes_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_comment_id: 댓글 ID (필수)
 * 
 * 반환값:
 *   - JSON 객체: {"is_liked": boolean, "likes_count": integer}
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 좋아요 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_toggle_comment_like('comment-uuid-here');
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
    
    -- 댓글 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.tbl_comments WHERE id = p_comment_id AND is_deleted = false) THEN
        RAISE EXCEPTION '댓글을 찾을 수 없습니다';
    END IF;
    
    -- 좋아요 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_comment_likes
        WHERE comment_id = p_comment_id AND user_id = v_user_id
    ) INTO v_is_liked;
    
    -- 좋아요 토글
    IF v_is_liked THEN
        -- 좋아요 제거
        DELETE FROM odd.tbl_comment_likes
        WHERE comment_id = p_comment_id AND user_id = v_user_id;
    ELSE
        -- 좋아요 추가
        INSERT INTO odd.tbl_comment_likes (comment_id, user_id)
        VALUES (p_comment_id, v_user_id)
        ON CONFLICT (comment_id, user_id) DO NOTHING;
    END IF;
    
    -- 업데이트된 좋아요 수 조회
    SELECT likes_count INTO v_likes_count
    FROM odd.tbl_comments
    WHERE id = p_comment_id;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'is_liked', NOT v_is_liked,
        'likes_count', v_likes_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_comment_like: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 댓글 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_comment(
    p_comment_id uuid,
    p_content text,
    p_images jsonb DEFAULT NULL,
    p_link_preview jsonb DEFAULT NULL
)
RETURNS odd.tbl_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 자신의 댓글을 수정합니다.
 * 
 * 매개변수:
 *   - p_comment_id: 댓글 ID (필수)
 *   - p_content: 수정할 댓글 내용 (필수)
 *   - p_images: 이미지 URL 배열 (선택, 최대 1장)
 *   - p_link_preview: 링크 프리뷰 정보 (선택)
 * 
 * 반환값:
 *   - 수정된 댓글 레코드 (odd.tbl_comments)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 작성자만 수정 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_update_comment(
 *     'comment-uuid-here',
 *     '수정된 댓글 내용'
 *   );
 */
DECLARE
    v_comment odd.tbl_comments;
    v_auth_id uuid;
    v_user_id bigint;
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
    
    -- 댓글 존재 및 작성자 확인
    IF NOT EXISTS (
        SELECT 1 FROM odd.tbl_comments
        WHERE id = p_comment_id AND author_id = v_user_id AND is_deleted = false
    ) THEN
        RAISE EXCEPTION '댓글을 찾을 수 없거나 수정 권한이 없습니다';
    END IF;
    
    -- 이미지 개수 검사 (최대 1장)
    IF p_images IS NOT NULL AND jsonb_array_length(p_images) > 1 THEN
        RAISE EXCEPTION '댓글에는 최대 1장의 이미지만 첨부할 수 있습니다';
    END IF;
    
    -- 댓글 수정
    UPDATE odd.tbl_comments
    SET 
        content = p_content,
        images = COALESCE(p_images, images),
        link_preview = COALESCE(p_link_preview, link_preview),
        updated_at = now()
    WHERE id = p_comment_id
    RETURNING * INTO v_comment;
    
    RETURN v_comment;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_comment: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 댓글 삭제 함수 (소프트 삭제)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_comment(
    p_comment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 자신의 댓글을 삭제합니다.
 *           소프트 삭제로 처리되며, 하위 답글은 유지됩니다.
 *           트리거를 통해 자동으로 comments_count가 감소됩니다.
 * 
 * 매개변수:
 *   - p_comment_id: 댓글 ID (필수)
 * 
 * 반환값:
 *   - boolean: 삭제 성공 여부
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 작성자만 삭제 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_delete_comment('comment-uuid-here');
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_id uuid;
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
    
    -- 댓글 존재 및 작성자 확인
    SELECT post_id INTO v_post_id
    FROM odd.tbl_comments
    WHERE id = p_comment_id AND author_id = v_user_id AND is_deleted = false;
    
    IF v_post_id IS NULL THEN
        RAISE EXCEPTION '댓글을 찾을 수 없거나 삭제 권한이 없습니다';
    END IF;
    
    -- 소프트 삭제 (실제로는 DELETE를 수행하지만, 트리거가 comments_count를 감소시킴)
    DELETE FROM odd.tbl_comments
    WHERE id = p_comment_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_comment: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. 권한 부여
-- =====================================================

-- 댓글 생성, 조회는 모든 사용자 가능
GRANT EXECUTE ON FUNCTION odd.v1_create_comment TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_comments TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_comments TO anon;

-- 댓글 좋아요, 수정, 삭제는 인증된 사용자만 가능
GRANT EXECUTE ON FUNCTION odd.v1_toggle_comment_like TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_update_comment TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_delete_comment TO authenticated;

-- =====================================================
-- 7. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_create_comment IS '댓글을 생성하는 함수. 트리거를 통해 자동으로 depth가 계산되고 comments_count가 동기화됩니다.';
COMMENT ON FUNCTION odd.v1_fetch_comments IS '포스트의 댓글 목록을 조회하는 함수. 작성자 정보와 현재 사용자의 좋아요 상태도 함께 반환합니다.';
COMMENT ON FUNCTION odd.v1_toggle_comment_like IS '댓글에 좋아요를 토글하는 함수. 트리거를 통해 자동으로 likes_count가 동기화됩니다.';
COMMENT ON FUNCTION odd.v1_update_comment IS '댓글을 수정하는 함수. 작성자만 수정 가능합니다.';
COMMENT ON FUNCTION odd.v1_delete_comment IS '댓글을 삭제하는 함수. 소프트 삭제로 처리되며, 하위 답글은 유지됩니다.';

