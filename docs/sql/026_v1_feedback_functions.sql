-- =====================================================
-- 피드백 관련 함수들
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 피드백을 관리하는 함수들입니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/026_v1_feedback_functions.sql
-- 
-- =====================================================
-- 1. 피드백 목록 조회 함수
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위해)
DROP FUNCTION IF EXISTS odd.v1_fetch_feedbacks(uuid, text, text, integer, integer);

CREATE OR REPLACE FUNCTION odd.v1_fetch_feedbacks(
    p_project_id uuid,
    p_feedback_type text DEFAULT NULL,
    p_status text DEFAULT NULL,
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
    -- 피드백 정보
    post_id uuid,
    feedback_id uuid,
    title text,
    feedback_type text,
    status text,
    priority text,
    assignee_id bigint,
    developer_response text,
    votes_count integer,
    is_voted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 피드백 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_feedback_type: 피드백 타입 필터 (NULL이면 모든 타입)
 *                      'bug', 'feature', 'improvement', 'question' 중 하나
 *   - p_status: 상태 필터 (NULL이면 모든 상태)
 *                'open', 'in_progress', 'resolved', 'closed' 중 하나
 *   - p_limit: 조회 개수 제한 (기본값: 30, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 피드백 목록 (작성자 정보, 투표 정보 포함)
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
    
    -- 피드백 타입 유효성 검사
    IF p_feedback_type IS NOT NULL AND p_feedback_type NOT IN ('bug', 'feature', 'improvement', 'question') THEN
        RAISE EXCEPTION '유효하지 않은 피드백 타입입니다: %', p_feedback_type;
    END IF;
    
    -- 상태 유효성 검사
    IF p_status IS NOT NULL AND p_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
        RAISE EXCEPTION '유효하지 않은 상태입니다: %', p_status;
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
    
    -- 피드백 조회 쿼리
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
        -- 피드백 정보
        f.post_id,
        f.id AS feedback_id,
        f.title,
        f.feedback_type,
        f.status,
        f.priority,
        f.assignee_id,
        f.developer_response,
        f.votes_count,
        -- 현재 사용자 투표 여부
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_feedback_votes fv
                WHERE fv.feedback_id = f.id AND fv.user_id = v_user_id
            )
        ELSE false END AS is_voted
    FROM odd.tbl_posts p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    INNER JOIN odd.tbl_feedbacks f ON p.id = f.post_id
    WHERE 
        -- 삭제되지 않은 포스트만 조회
        p.is_deleted = false
        -- 프로젝트 ID 필터
        AND p.project_id = p_project_id
        -- 출처 타입 필터 (community)
        AND p.source_type = 'community'
        -- 피드백 타입 필터
        AND (p_feedback_type IS NULL OR f.feedback_type = p_feedback_type)
        -- 상태 필터
        AND (p_status IS NULL OR f.status = p_status)
    ORDER BY 
        -- 고정된 피드백을 먼저 표시
        f.is_pinned DESC,
        -- 최신순 정렬 (최근 작성된 글 우선)
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_feedbacks: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 피드백 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_feedback(
    p_project_id uuid,
    p_feedback_type text,  -- 'bug' | 'feature' | 'improvement' | 'question'
    p_title text,
    p_content text,
    p_images jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 피드백을 생성합니다.
 *           post + feedback을 함께 생성합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_feedback_type: 피드백 타입 (필수)
 *                      'bug', 'feature', 'improvement', 'question' 중 하나
 *   - p_title: 제목 (필수)
 *   - p_content: 내용 (필수)
 *   - p_images: 이미지 URL 배열 (선택, 최대 3개)
 * 
 * 반환값:
 *   - 생성된 포스트 ID (UUID)
 * 
 * 보안:
 *   - 인증된 사용자만 피드백 생성 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_id uuid;
    v_project_title text;
BEGIN
    -- 현재 로그인한 사용자 확인
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
    
    -- 피드백 타입 유효성 검사
    IF p_feedback_type NOT IN ('bug', 'feature', 'improvement', 'question') THEN
        RAISE EXCEPTION '유효하지 않은 피드백 타입입니다: %', p_feedback_type;
    END IF;
    
    -- 이미지 개수 검사 (최대 3개)
    IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 3 THEN
        RAISE EXCEPTION '이미지는 최대 3장까지 첨부할 수 있습니다';
    END IF;
    
    -- 프로젝트 정보 조회 (source_name, source_emoji용)
    SELECT title INTO v_project_title
    FROM odd.projects
    WHERE id = p_project_id;
    
    IF v_project_title IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;
    
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
        source_emoji
    ) VALUES (
        v_user_id,
        'text',
        p_content,
        COALESCE(p_images, '[]'::jsonb),
        p_project_id,
        'community',
        p_project_id,
        v_project_title,
        '💬'
    )
    RETURNING id INTO v_post_id;
    
    -- 피드백 정보 생성
    INSERT INTO odd.tbl_feedbacks (
        post_id,
        title,
        feedback_type,
        status,
        priority
    ) VALUES (
        v_post_id,
        p_title,
        p_feedback_type,
        'open',
        NULL  -- 우선순위는 프로젝트 멤버가 설정
    );
    
    RETURN v_post_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_feedback: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 피드백 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_feedback(
    p_post_id uuid,
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_feedback_type text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_priority text DEFAULT NULL,
    p_assignee_id bigint DEFAULT NULL,
    p_developer_response text DEFAULT NULL,
    p_is_pinned boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 피드백을 수정합니다.
 *           작성자는 제목, 내용, 이미지만 수정 가능
 *           프로젝트 멤버는 모든 필드 수정 가능
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수)
 *   - p_title: 제목 (선택, NULL이면 변경하지 않음)
 *   - p_content: 내용 (선택, NULL이면 변경하지 않음)
 *   - p_images: 이미지 URL 배열 (선택, NULL이면 변경하지 않음)
 *   - p_feedback_type: 피드백 타입 (선택, 프로젝트 멤버만 수정 가능)
 *   - p_status: 상태 (선택, 프로젝트 멤버만 수정 가능)
 *   - p_priority: 우선순위 (선택, 프로젝트 멤버만 수정 가능)
 *   - p_assignee_id: 담당자 ID (선택, 프로젝트 멤버만 수정 가능)
 *   - p_developer_response: 개발팀 공식 답변 (선택, 프로젝트 멤버만 수정 가능)
 *   - p_is_pinned: 상단 고정 여부 (선택, 프로젝트 멤버만 수정 가능)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_author_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
    v_is_project_member boolean;
BEGIN
    -- 현재 로그인한 사용자 확인
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
    
    -- 포스트 작성자 및 프로젝트 ID 확인
    SELECT author_id, project_id INTO v_post_author_id, v_project_id
    FROM odd.tbl_posts
    WHERE id = p_post_id;
    
    IF v_post_author_id IS NULL THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인
    SELECT author_id INTO v_project_author_id
    FROM odd.projects
    WHERE id = v_project_id;
    
    -- 프로젝트 멤버 여부 확인 (작성자 또는 프로젝트 생성자)
    v_is_project_member := (v_post_author_id = v_user_id) OR (v_project_author_id = v_user_id);
    
    -- 작성자는 제목, 내용, 이미지만 수정 가능
    IF NOT v_is_project_member AND (p_feedback_type IS NOT NULL OR p_status IS NOT NULL OR 
        p_priority IS NOT NULL OR p_assignee_id IS NOT NULL OR 
        p_developer_response IS NOT NULL OR p_is_pinned IS NOT NULL) THEN
        RAISE EXCEPTION '프로젝트 멤버만 해당 필드를 수정할 수 있습니다';
    END IF;
    
    -- 작성자만 수정 가능한 필드 체크
    IF v_post_author_id != v_user_id AND (p_title IS NOT NULL OR p_content IS NOT NULL OR p_images IS NOT NULL) THEN
        RAISE EXCEPTION '작성자만 제목, 내용, 이미지를 수정할 수 있습니다';
    END IF;
    
    -- 포스트 수정
    IF p_content IS NOT NULL OR p_images IS NOT NULL THEN
        UPDATE odd.tbl_posts
        SET 
            content = COALESCE(p_content, content),
            images = COALESCE(p_images, images)
        WHERE id = p_post_id;
    END IF;
    
    -- 피드백 정보 수정
    UPDATE odd.tbl_feedbacks
    SET 
        title = COALESCE(p_title, title),
        feedback_type = COALESCE(p_feedback_type, feedback_type),
        status = COALESCE(p_status, status),
        priority = COALESCE(p_priority, priority),
        assignee_id = COALESCE(p_assignee_id, assignee_id),
        developer_response = COALESCE(p_developer_response, developer_response),
        is_pinned = COALESCE(p_is_pinned, is_pinned)
    WHERE post_id = p_post_id;
    
    -- 포스트 고정 상태 동기화
    IF p_is_pinned IS NOT NULL THEN
        UPDATE odd.tbl_posts
        SET is_pinned = p_is_pinned
        WHERE id = p_post_id;
    END IF;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_feedback: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 피드백 투표 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_feedback_vote(
    p_feedback_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 피드백 투표를 토글합니다.
 *           이미 투표한 경우 취소하고, 투표하지 않은 경우 투표합니다.
 * 
 * 매개변수:
 *   - p_feedback_id: 피드백 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_exists boolean;
BEGIN
    -- 현재 로그인한 사용자 확인
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
    
    -- 기존 투표 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_feedback_votes
        WHERE feedback_id = p_feedback_id AND user_id = v_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 투표 취소
        DELETE FROM odd.tbl_feedback_votes
        WHERE feedback_id = p_feedback_id AND user_id = v_user_id;
    ELSE
        -- 투표 추가
        INSERT INTO odd.tbl_feedback_votes (
            feedback_id,
            user_id
        ) VALUES (
            p_feedback_id,
            v_user_id
        );
    END IF;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_feedback_vote: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_feedbacks TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_feedbacks TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_update_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_toggle_feedback_vote TO authenticated;

-- =====================================================
-- 6. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_feedbacks IS '피드백 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원합니다.';
COMMENT ON FUNCTION odd.v1_create_feedback IS '피드백을 생성하는 함수. 인증된 사용자만 피드백 생성 가능.';
COMMENT ON FUNCTION odd.v1_update_feedback IS '피드백을 수정하는 함수. 작성자는 제목, 내용, 이미지만 수정 가능. 프로젝트 멤버는 모든 필드 수정 가능.';
COMMENT ON FUNCTION odd.v1_toggle_feedback_vote IS '피드백 투표를 토글하는 함수. 이미 투표한 경우 취소하고, 투표하지 않은 경우 투표합니다.';

-- =====================================================
-- 7. 피드백 상세 조회 함수 (단일 피드백)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_feedback_detail(
    p_post_id uuid
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
    -- 피드백 정보
    post_id uuid,
    feedback_id uuid,
    title text,
    feedback_type text,
    status text,
    priority text,
    assignee_id bigint,
    developer_response text,
    votes_count integer,
    is_voted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 특정 피드백의 상세 정보를 조회합니다.
 * 
 * 매개변수:
 *   - p_post_id: 포스트 ID (필수, feedbackId는 post_id와 동일)
 * 
 * 반환값:
 *   - 피드백 상세 정보 (작성자 정보, 투표 정보 포함)
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
    
    -- 피드백 상세 조회 쿼리
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
        -- 피드백 정보
        f.post_id,
        f.id AS feedback_id,
        f.title,
        f.feedback_type,
        f.status,
        f.priority,
        f.assignee_id,
        f.developer_response,
        f.votes_count,
        -- 현재 사용자 투표 여부
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_feedback_votes fv
                WHERE fv.feedback_id = f.id AND fv.user_id = v_user_id
            )
        ELSE false END AS is_voted
    FROM odd.tbl_posts p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    INNER JOIN odd.tbl_feedbacks f ON p.id = f.post_id
    WHERE 
        -- 삭제되지 않은 포스트만 조회
        p.is_deleted = false
        -- 포스트 ID 필터
        AND p.id = p_post_id
    LIMIT 1;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_feedback_detail: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION odd.v1_fetch_feedback_detail TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_feedback_detail TO anon;

COMMENT ON FUNCTION odd.v1_fetch_feedback_detail IS '특정 피드백의 상세 정보를 조회하는 함수.';

