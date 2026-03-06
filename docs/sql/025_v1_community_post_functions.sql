-- =====================================================
-- 커뮤니티 포스트 관련 함수들
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 공지사항, 업데이트, 투표 포스트를 관리하는 함수들입니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/025_v1_community_post_functions.sql
-- 
-- =====================================================
-- 1. 커뮤니티 포스트 조회 함수
-- =====================================================
DROP FUNCTION IF EXISTS odd.v1_update_community_post(uuid, text, text, jsonb, boolean, text[]) CASCADE;
CREATE OR REPLACE FUNCTION odd.v1_fetch_community_posts(
    p_project_id uuid,
    p_post_type text DEFAULT NULL,
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    -- 포스트 기본 정보
    id uuid,
    author_id bigint,
    type text,
    content text,
    images jsonb,
    likes_count integer,
    comments_count integer,
    is_pinned boolean,
    created_at timestamptz,
    updated_at timestamptz,
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 현재 사용자 인터랙션 상태
    is_liked boolean,
    -- 공지사항 정보
    title text,
    post_type text,
    -- 투표 정보 (투표 타입일 때만)
    vote_options jsonb,
    voted_option_id uuid,
    total_votes integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 커뮤니티 포스트 목록을 조회합니다.
 *           공지사항, 업데이트, 투표 포스트를 포함하며 투표 정보도 함께 반환합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_post_type: 포스트 타입 필터 (NULL이면 모든 타입)
 *                   'announcement', 'update', 'vote' 중 하나
 *   - p_limit: 조회 개수 제한 (기본값: 30, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 포스트 목록 (작성자 정보, 투표 정보 포함)
 */
DECLARE
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
    
    -- 포스트 타입 유효성 검사
    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
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
    
    -- 커뮤니티 포스트 조회 쿼리
    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        p.type,
        p.content,
        p.images,
        p.likes_count,
        p.comments_count,
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
        -- 공지사항 정보
        pa.title,
        pa.post_type,
        -- 투표 정보 (투표 타입일 때만)
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
        -- 현재 사용자가 투표한 옵션 ID
        CASE 
            WHEN pa.post_type = 'vote' AND v_user_id IS NOT NULL THEN
                (SELECT pvr.vote_option_id 
                 FROM odd.tbl_post_vote_responses pvr
                 WHERE pvr.post_id = p.id AND pvr.user_id = v_user_id
                 LIMIT 1)
            ELSE NULL::uuid
        END AS voted_option_id,
        -- 총 투표 수
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
        -- 삭제되지 않은 포스트만 조회
        p.is_deleted = false
        -- 프로젝트 ID 필터
        AND p.project_id = p_project_id
        -- 출처 타입 필터 (community)
        AND p.source_type = 'community'
        -- 포스트 타입 필터
        AND (p_post_type IS NULL OR pa.post_type = p_post_type)
    GROUP BY 
        p.id, p.author_id, p.type, p.content, p.images, p.likes_count, p.comments_count,
        p.is_pinned, p.created_at, p.updated_at,
        u.username, u.display_name, u.avatar_url,
        pa.title, pa.post_type, v_user_id
    ORDER BY 
        -- 고정된 포스트를 먼저 표시
        p.is_pinned DESC,
        -- 최신순 정렬
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_community_posts: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 커뮤니티 포스트 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_community_post(
    p_project_id uuid,
    p_post_type text,  -- 'announcement' | 'update' | 'vote'
    p_title text,
    p_content text,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_is_pinned boolean DEFAULT false,
    p_vote_options text[] DEFAULT NULL  -- 투표 타입일 때만 사용 (최소 2개, 최대 5개)
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 커뮤니티 포스트를 생성합니다.
 *           공지/업데이트: post + post_announcements 생성
 *           투표: post + post_announcements + post_votes 생성
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_post_type: 포스트 타입 (필수)
 *                   'announcement', 'update', 'vote' 중 하나
 *   - p_title: 제목 (필수)
 *   - p_content: 내용 (필수)
 *   - p_images: 이미지 URL 배열 (선택, 최대 3개)
 *   - p_is_pinned: 상단 고정 여부 (기본값: false)
 *   - p_vote_options: 투표 옵션 배열 (투표 타입일 때만, 최소 2개, 최대 5개)
 * 
 * 반환값:
 *   - 생성된 포스트 ID (UUID)
 * 
 * 보안:
 *   - 프로젝트 생성자만 포스트 생성 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_id uuid;
    v_project_author_id bigint;
    v_post_db_type text;
    v_option_text text;
    v_sort_order integer;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = p_project_id;
    
    IF v_project_author_id IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 공지를 작성할 수 있습니다';
    END IF;
    
    -- 포스트 타입 유효성 검사
    IF p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;
    
    -- 이미지 개수 검사 (최대 3개)
    IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 3 THEN
        RAISE EXCEPTION '이미지는 최대 3장까지 첨부할 수 있습니다';
    END IF;
    
    -- 투표 타입일 때 옵션 검사
    IF p_post_type = 'vote' THEN
        IF p_vote_options IS NULL OR array_length(p_vote_options, 1) < 2 THEN
            RAISE EXCEPTION '투표 옵션은 최소 2개 이상 필요합니다';
        END IF;
        
        IF array_length(p_vote_options, 1) > 5 THEN
            RAISE EXCEPTION '투표 옵션은 최대 5개까지 가능합니다';
        END IF;
    END IF;
    
    -- DB 포스트 타입 매핑
    v_post_db_type := CASE p_post_type
        WHEN 'announcement' THEN 'text'
        WHEN 'update' THEN 'project_update'
        WHEN 'vote' THEN 'text'
    END;
    
    -- 프로젝트 정보 조회 (source_name, source_emoji용)
    DECLARE
        v_project_title text;
    BEGIN
        SELECT title INTO v_project_title
        FROM odd.projects
        WHERE id = p_project_id;
        
        -- 포스트 생성
        INSERT INTO odd.tbl_posts (
            author_id,
            type,
            content,
            images,
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
            p_project_id,
            'community',
            p_project_id,
            v_project_title,
            '📢',
            p_is_pinned
        )
        RETURNING id INTO v_post_id;
        
        -- 공지사항 정보 생성
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
        
        -- 투표 타입일 때 투표 옵션 생성
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
    END;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_community_post: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 커뮤니티 포스트 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_community_post(
    p_post_id uuid,
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT NULL,
    p_post_type text DEFAULT NULL,  -- 'announcement' | 'update' | 'vote' (선택, NULL이면 변경하지 않음)
    p_vote_options text[] DEFAULT NULL  -- 투표 타입일 때만 사용
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 커뮤니티 포스트를 수정합니다.
 *           작성자만 수정 가능합니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 *   - p_title: 제목 (선택, NULL이면 변경하지 않음)
 *   - p_content: 내용 (선택, NULL이면 변경하지 않음)
 *   - p_images: 이미지 URL 배열 (선택, NULL이면 변경하지 않음)
 *   - p_is_pinned: 상단 고정 여부 (선택, NULL이면 변경하지 않음)
 *   - p_post_type: 포스트 타입 (선택, NULL이면 변경하지 않음)
 *   - p_vote_options: 투표 옵션 배열 (투표 타입일 때만, NULL이면 변경하지 않음)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_author_id bigint;
    v_post_type text;
    v_option_text text;
    v_sort_order integer;
    v_vote_response_count integer := 0;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 포스트 작성자 확인
    SELECT pst.author_id INTO v_post_author_id
    FROM odd.tbl_posts pst
    WHERE pst.id = p_post_id;
    
    IF v_post_author_id IS NULL THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;
    
    IF v_post_author_id != v_user_id THEN
        RAISE EXCEPTION '작성자만 포스트를 수정할 수 있습니다';
    END IF;
    
    -- 포스트 타입 확인
    SELECT post_type INTO v_post_type
    FROM odd.tbl_post_announcements
    WHERE post_id = p_post_id;
    
    -- 포스트 타입 유효성 검사 (제공된 경우)
    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;

    -- 투표 타입으로 변경할 때는 옵션이 함께 제공되어야 함
    IF v_post_type != 'vote' AND p_post_type = 'vote' AND p_vote_options IS NULL THEN
        RAISE EXCEPTION '투표 타입으로 변경할 때는 투표 옵션이 필요합니다';
    END IF;

    -- 투표 옵션이 제공된 경우 개수 검사
    IF p_vote_options IS NOT NULL THEN
        IF array_length(p_vote_options, 1) < 2 THEN
            RAISE EXCEPTION '투표 옵션은 최소 2개 이상 필요합니다';
        END IF;

        IF array_length(p_vote_options, 1) > 5 THEN
            RAISE EXCEPTION '투표 옵션은 최대 5개까지 가능합니다';
        END IF;
    END IF;

    -- 이미 응답이 있는 투표는 옵션/타입 변경을 허용하지 않음
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
    
    -- 포스트 타입 변경 시 투표 타입에서 다른 타입으로 변경하면 투표 옵션 삭제
    IF p_post_type IS NOT NULL AND v_post_type = 'vote' AND p_post_type != 'vote' THEN
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;
    END IF;
    
    -- 포스트 수정
    -- p_images: NULL 또는 빈 배열 '[]' 둘 다 "모든 이미지 제거"를 의미
    IF p_content IS NOT NULL OR p_images IS NOT NULL OR p_is_pinned IS NOT NULL THEN
        UPDATE odd.tbl_posts
        SET 
            content = COALESCE(p_content, content),
            -- p_images가 NULL이면 빈 배열로, 아니면 p_images 사용 (빈 배열도 포함)
            images = CASE 
                WHEN p_images IS NULL THEN '[]'::jsonb
                ELSE p_images
            END,
            is_pinned = COALESCE(p_is_pinned, is_pinned)
        WHERE id = p_post_id;
    END IF;
    
    -- 공지사항 정보 수정
    IF p_title IS NOT NULL OR p_is_pinned IS NOT NULL OR p_post_type IS NOT NULL THEN
        UPDATE odd.tbl_post_announcements
        SET 
            title = COALESCE(p_title, title),
            is_pinned = COALESCE(p_is_pinned, is_pinned),
            post_type = COALESCE(p_post_type, post_type)
        WHERE post_id = p_post_id;
    END IF;
    
    -- 포스트 타입이 변경된 경우 v_post_type 업데이트
    IF p_post_type IS NOT NULL THEN
        v_post_type := p_post_type;
    END IF;
    
    -- 투표 타입일 때 투표 옵션 수정
    IF v_post_type = 'vote' AND p_vote_options IS NOT NULL THEN
        -- 기존 옵션 삭제
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;
        
        -- 새 옵션 추가
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
-- 4. 투표 응답 생성/취소 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_create_vote_response(uuid, uuid);

CREATE OR REPLACE FUNCTION odd.v1_create_vote_response(
    p_post_id uuid,
    p_vote_option_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 투표 응답을 생성하거나 취소하고, 업데이트된 포스트 정보를 반환합니다.
 *           이미 투표한 경우 취소하고, 다른 옵션에 투표한 경우 변경합니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 *   - p_vote_option_id: 투표 옵션 ID (필수)
 * 
 * 반환값:
 *   - 업데이트된 포스트 정보 (jsonb)
 *     v1_fetch_community_posts와 동일한 구조
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_existing_response uuid;
    v_result jsonb;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 기존 투표 응답 확인
    SELECT vote_option_id INTO v_existing_response
    FROM odd.tbl_post_vote_responses
    WHERE post_id = p_post_id AND user_id = v_user_id;
    
    IF v_existing_response IS NOT NULL THEN
        -- 같은 옵션에 투표한 경우 취소
        IF v_existing_response = p_vote_option_id THEN
            DELETE FROM odd.tbl_post_vote_responses
            WHERE post_id = p_post_id AND user_id = v_user_id;
        ELSE
            -- 다른 옵션에 투표한 경우 변경
            UPDATE odd.tbl_post_vote_responses
            SET vote_option_id = p_vote_option_id
            WHERE post_id = p_post_id AND user_id = v_user_id;
        END IF;
    ELSE
        -- 새로 투표
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
    
    -- 업데이트된 포스트 정보 조회 (v1_fetch_community_posts와 동일한 구조)
    SELECT jsonb_build_object(
        'id', p.id,
        'author_id', p.author_id,
        'type', p.type,
        'content', p.content,
        'images', p.images,
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
        p.id, p.author_id, p.type, p.content, p.images, p.likes_count, p.comments_count,
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
-- 5. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_community_post(uuid, text, text, text, jsonb, boolean, text[]) TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_update_community_post(uuid, text, text, jsonb, boolean, text, text[]) TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_create_vote_response(uuid, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_delete_community_post(uuid) TO authenticated;

-- =====================================================
-- 5. 커뮤니티 포스트 삭제 함수 (소프트 삭제)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_community_post(
    p_post_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 커뮤니티 포스트를 소프트 삭제합니다.
 *           작성자 또는 프로젝트 작성자만 삭제 가능합니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 * 
 * 보안:
 *   - 작성자 또는 프로젝트 작성자만 삭제 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_author_id bigint;
    v_project_author_id bigint;
    v_project_id uuid;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 포스트 정보 조회
    SELECT pst.author_id, pst.project_id INTO v_post_author_id, v_project_id
    FROM odd.tbl_posts pst
    WHERE pst.id = p_post_id AND pst.is_deleted = false;
    
    IF v_post_author_id IS NULL THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인
    IF v_project_id IS NOT NULL THEN
        SELECT prj.author_id INTO v_project_author_id
        FROM odd.projects prj
        WHERE prj.id = v_project_id;
    END IF;
    
    -- 권한 확인: 작성자이거나 프로젝트 작성자여야 함
    IF v_post_author_id != v_user_id AND v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '작성자 또는 프로젝트 작성자만 포스트를 삭제할 수 있습니다';
    END IF;
    
    -- 소프트 삭제 (is_deleted = true)
    UPDATE odd.tbl_posts
    SET is_deleted = true
    WHERE id = p_post_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_community_post: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION odd.v1_delete_community_post(uuid) TO authenticated;

-- =====================================================
-- 6. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_community_posts(uuid, text, integer, integer) IS '커뮤니티 포스트 목록을 조회하는 함수. 공지사항, 업데이트, 투표 포스트를 포함하며 투표 정보도 함께 반환합니다.';
COMMENT ON FUNCTION odd.v1_create_community_post(uuid, text, text, text, jsonb, boolean, text[]) IS '커뮤니티 포스트를 생성하는 함수. 프로젝트 생성자만 포스트 생성 가능.';
COMMENT ON FUNCTION odd.v1_update_community_post(uuid, text, text, jsonb, boolean, text, text[]) IS '커뮤니티 포스트를 수정하는 함수. 작성자만 수정 가능.';
COMMENT ON FUNCTION odd.v1_delete_community_post(uuid) IS '커뮤니티 포스트를 소프트 삭제하는 함수. 작성자 또는 프로젝트 작성자만 삭제 가능.';
COMMENT ON FUNCTION odd.v1_create_vote_response(uuid, uuid) IS '투표 응답을 생성하거나 취소하는 함수. 이미 투표한 경우 취소하고, 다른 옵션에 투표한 경우 변경합니다.';

