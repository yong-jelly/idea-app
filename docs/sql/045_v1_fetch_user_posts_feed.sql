-- =====================================================
-- odd.v1_fetch_user_posts_feed: 사용자가 작성한 포스트 피드 조회 함수
-- =====================================================
-- 
-- 특정 사용자가 작성한 포스트의 피드를 조회합니다.
-- 일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 포함하며
-- 모든 피드를 시간순으로 정렬하여 반환합니다.
-- 
-- 사용 위치:
--   - ProfilePage의 포스트 탭에서 사용자가 작성한 포스트 피드 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_user_posts_feed', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/045_v1_fetch_user_posts_feed.sql
-- 
-- =====================================================
-- 1. 사용자가 작성한 포스트 피드 조회 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_user_posts_feed(text, integer, integer);

CREATE OR REPLACE FUNCTION odd.v1_fetch_user_posts_feed(
    p_username text,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    -- 포스트 기본 정보
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
    project_thumbnail text,
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
    author_user_type text,  -- 'user' | 'bot'
    -- 현재 사용자 인터랙션 상태
    is_liked boolean,
    is_bookmarked boolean,
    -- 추가 정보 (피드 타입별)
    title text,  -- 공지/피드백/프로젝트 생성 피드의 제목
    post_type text,  -- 공지 타입 (announcement, update, vote)
    feedback_type text,  -- 피드백 타입 (bug, feature, improvement, question)
    feedback_status text,  -- 피드백 상태
    feedback_votes_count integer,  -- 피드백 투표 수
    is_feedback_voted boolean,  -- 피드백 투표 여부
    vote_options jsonb,  -- 투표 옵션 (투표 타입일 때만)
    voted_option_id uuid  -- 현재 사용자가 투표한 옵션 ID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 특정 사용자가 작성한 포스트의 피드를 조회합니다.
 *           일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 포함하며
 *           모든 피드를 시간순으로 정렬하여 반환합니다.
 * 
 * 매개변수:
 *   - p_username: 조회할 사용자의 username
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 사용자가 작성한 포스트의 피드 목록 (작성자 정보, 인터랙션 상태, 피드 타입별 추가 정보 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능
 *   - 현재 사용자 정보는 auth.uid()로 조회 (인증되지 않은 경우 NULL)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_target_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인 (인증되지 않은 경우 NULL)
    v_auth_id := auth.uid();
    
    -- auth_id로 사용자 ID 조회 (인증되지 않은 경우 NULL)
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- username으로 대상 사용자 ID 조회
    SELECT u.id INTO v_target_user_id
    FROM odd.tbl_users u
    WHERE u.username = p_username
      AND u.is_active = true;
    
    IF v_target_user_id IS NULL THEN
        RETURN;  -- 사용자를 찾을 수 없으면 빈 결과 반환
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
    
    -- 사용자가 작성한 포스트 피드 조회 쿼리 (UNION ALL 사용)
    RETURN QUERY
    WITH unified_posts AS (
        -- 1. 일반 포스트 (text, project_update, milestone, feature_accepted)
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
            prj.thumbnail AS project_thumbnail,
            p.likes_count,
            p.comments_count,
            p.bookmarks_count,
            p.is_pinned,
            p.created_at,
            p.updated_at,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            u.user_type AS author_user_type,
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
            ELSE false END AS is_bookmarked,
            NULL::text AS title,
            NULL::text AS post_type,
            NULL::text AS feedback_type,
            NULL::text AS feedback_status,
            NULL::integer AS feedback_votes_count,
            false AS is_feedback_voted,
            NULL::jsonb AS vote_options,
            NULL::uuid AS voted_option_id
        FROM odd.tbl_posts p
        INNER JOIN odd.tbl_users u ON p.author_id = u.id
        LEFT JOIN odd.projects prj ON p.project_id = prj.id
        WHERE 
            p.is_deleted = false
            AND p.author_id = v_target_user_id
            AND p.type IN ('text', 'project_update', 'milestone', 'feature_accepted', 'project_created')
            -- 공지/피드백이 아닌 포스트만 (공지/피드백은 별도로 조회)
            AND NOT EXISTS (
                SELECT 1 FROM odd.tbl_post_announcements pa WHERE pa.post_id = p.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM odd.tbl_feedbacks f WHERE f.post_id = p.id
            )
        
        UNION ALL
        
        -- 2. 커뮤니티 공지 (announcement, update, vote)
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
            prj.thumbnail AS project_thumbnail,
            p.likes_count,
            p.comments_count,
            p.bookmarks_count,
            p.is_pinned,
            p.created_at,
            p.updated_at,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            u.user_type AS author_user_type,
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
            ELSE false END AS is_bookmarked,
            pa.title,
            pa.post_type,
            NULL::text AS feedback_type,
            NULL::text AS feedback_status,
            NULL::integer AS feedback_votes_count,
            false AS is_feedback_voted,
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
            END AS voted_option_id
        FROM odd.tbl_posts p
        INNER JOIN odd.tbl_users u ON p.author_id = u.id
        INNER JOIN odd.tbl_post_announcements pa ON p.id = pa.post_id
        LEFT JOIN odd.tbl_post_votes pv ON p.id = pv.post_id AND pa.post_type = 'vote'
        LEFT JOIN odd.projects prj ON p.project_id = prj.id
        WHERE 
            p.is_deleted = false
            AND p.author_id = v_target_user_id
            AND p.source_type = 'community'
        GROUP BY 
            p.id, p.author_id, p.type, p.content, p.images, p.link_preview, p.project_id,
            p.milestone_title, p.feature_title, p.source_type, p.source_id, p.source_name,
            p.source_emoji, prj.thumbnail, p.likes_count, p.comments_count, p.bookmarks_count, p.is_pinned,
            p.created_at, p.updated_at, u.username, u.display_name, u.avatar_url, u.user_type,
            pa.title, pa.post_type, v_user_id
        
        UNION ALL
        
        -- 3. 피드백 (bug, feature, improvement, question)
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
            prj.thumbnail AS project_thumbnail,
            p.likes_count,
            p.comments_count,
            p.bookmarks_count,
            p.is_pinned,
            p.created_at,
            p.updated_at,
            u.username AS author_username,
            u.display_name AS author_display_name,
            u.avatar_url AS author_avatar_url,
            u.user_type AS author_user_type,
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
            ELSE false END AS is_bookmarked,
            f.title,
            NULL::text AS post_type,
            f.feedback_type,
            f.status AS feedback_status,
            f.votes_count AS feedback_votes_count,
            CASE WHEN v_user_id IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM odd.tbl_feedback_votes fv
                    WHERE fv.feedback_id = f.id AND fv.user_id = v_user_id
                )
            ELSE false END AS is_feedback_voted,
            NULL::jsonb AS vote_options,
            NULL::uuid AS voted_option_id
        FROM odd.tbl_posts p
        INNER JOIN odd.tbl_users u ON p.author_id = u.id
        INNER JOIN odd.tbl_feedbacks f ON p.id = f.post_id
        LEFT JOIN odd.projects prj ON p.project_id = prj.id
        WHERE 
            p.is_deleted = false
            AND p.author_id = v_target_user_id
            AND p.source_type = 'community'
    )
    SELECT * FROM unified_posts
    ORDER BY 
        created_at DESC  -- 시간순 정렬
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_user_posts_feed: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_posts_feed TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_user_posts_feed TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_user_posts_feed IS '특정 사용자가 작성한 포스트의 피드를 조회하는 함수. 일반 포스트, 커뮤니티 공지, 피드백, 프로젝트 생성 정보를 시간순으로 정렬하여 반환합니다.';

