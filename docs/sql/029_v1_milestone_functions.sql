-- =====================================================
-- 마일스톤 관련 함수들
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 마일스톤을 관리하는 함수들입니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/029_v1_milestone_functions.sql
-- 
-- =====================================================
-- 1. 마일스톤 목록 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_milestones(
    p_project_id uuid,
    p_status text DEFAULT NULL,  -- 'all', 'open', 'closed' (NULL이면 'all')
    p_limit integer DEFAULT 30,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    title text,
    description text,
    due_date date,
    status text,
    open_issues_count integer,
    closed_issues_count integer,
    created_at timestamptz,
    updated_at timestamptz,
    closed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트의 마일스톤 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_status: 상태 필터 (NULL이면 전체)
 *                'all', 'open', 'closed' 중 하나
 *   - p_limit: 조회 개수 제한 (기본값: 30, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 마일스톤 목록 (정렬: 진행 중 우선, 그 다음 최신순)
 */
DECLARE
    v_status_filter text;
BEGIN
    -- 상태 필터 처리
    IF p_status IS NULL OR p_status = 'all' THEN
        v_status_filter := NULL;
    ELSIF p_status IN ('open', 'closed') THEN
        v_status_filter := p_status;
    ELSE
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
    
    -- 마일스톤 조회 쿼리
    RETURN QUERY
    SELECT 
        m.id,
        m.project_id,
        m.title,
        m.description,
        m.due_date,
        m.status,
        m.open_issues_count,
        m.closed_issues_count,
        m.created_at,
        m.updated_at,
        m.closed_at
    FROM odd.tbl_milestones m
    WHERE 
        m.project_id = p_project_id
        -- 상태 필터
        AND (v_status_filter IS NULL OR m.status = v_status_filter)
    ORDER BY 
        -- 진행 중 마일스톤 우선
        CASE WHEN m.status = 'open' THEN 0 ELSE 1 END,
        -- 그 다음 최신순 정렬
        m.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_milestones: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 마일스톤 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_milestone(
    p_project_id uuid,
    p_title text,
    p_description text DEFAULT NULL,
    p_due_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 마일스톤을 생성합니다.
 *           프로젝트 생성자만 생성 가능합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_title: 제목 (필수, 최대 50자)
 *   - p_description: 설명 (선택, 최대 200자)
 *   - p_due_date: 목표 기한 (선택)
 * 
 * 반환값:
 *   - 생성된 마일스톤 ID (UUID)
 * 
 * 보안:
 *   - 프로젝트 생성자만 마일스톤 생성 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_author_id bigint;
    v_milestone_id uuid;
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
        RAISE EXCEPTION '프로젝트 생성자만 마일스톤을 생성할 수 있습니다';
    END IF;
    
    -- 제목 길이 검사
    IF length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 마일스톤 생성
    INSERT INTO odd.tbl_milestones (
        project_id,
        title,
        description,
        due_date,
        status,
        open_issues_count,
        closed_issues_count
    ) VALUES (
        p_project_id,
        p_title,
        p_description,
        p_due_date,
        'open',
        0,
        0
    )
    RETURNING id INTO v_milestone_id;
    
    RETURN v_milestone_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_milestone: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 마일스톤 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_milestone(
    p_milestone_id uuid,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_due_date date DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 마일스톤을 수정합니다.
 *           프로젝트 생성자만 수정 가능합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 *   - p_title: 제목 (선택, NULL이면 변경하지 않음)
 *   - p_description: 설명 (선택, NULL이면 변경하지 않음)
 *   - p_due_date: 목표 기한 (선택, NULL이면 변경하지 않음)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
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
    
    -- 마일스톤의 프로젝트 ID 조회
    SELECT m.project_id INTO v_project_id
    FROM odd.tbl_milestones m
    WHERE m.id = p_milestone_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '마일스톤을 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 마일스톤을 수정할 수 있습니다';
    END IF;
    
    -- 제목 길이 검사
    IF p_title IS NOT NULL AND length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 마일스톤 수정
    UPDATE odd.tbl_milestones
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        due_date = COALESCE(p_due_date, due_date)
    WHERE id = p_milestone_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_milestone: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 마일스톤 삭제 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_milestone(
    p_milestone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 마일스톤을 삭제합니다.
 *           프로젝트 생성자만 삭제 가능합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
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
    
    -- 마일스톤의 프로젝트 ID 조회
    SELECT m.project_id INTO v_project_id
    FROM odd.tbl_milestones m
    WHERE m.id = p_milestone_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '마일스톤을 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 마일스톤을 삭제할 수 있습니다';
    END IF;
    
    -- 마일스톤 삭제
    DELETE FROM odd.tbl_milestones
    WHERE id = p_milestone_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_milestone: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 마일스톤 상태 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_milestone_status(
    p_milestone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 마일스톤의 상태를 토글합니다 (open ↔ closed).
 *           프로젝트 생성자만 토글 가능합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
    v_current_status text;
    v_new_status text;
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
    
    -- 마일스톤의 프로젝트 ID 및 현재 상태 조회
    SELECT m.project_id, m.status INTO v_project_id, v_current_status
    FROM odd.tbl_milestones m
    WHERE m.id = p_milestone_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '마일스톤을 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 마일스톤 상태를 변경할 수 있습니다';
    END IF;
    
    -- 상태 토글
    IF v_current_status = 'open' THEN
        v_new_status := 'closed';
    ELSE
        v_new_status := 'open';
    END IF;
    
    -- 마일스톤 상태 업데이트
    UPDATE odd.tbl_milestones
    SET 
        status = v_new_status,
        closed_at = CASE 
            WHEN v_new_status = 'closed' THEN now()
            ELSE NULL
        END
    WHERE id = p_milestone_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_milestone_status: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_milestones TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_milestones TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_milestone TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_update_milestone TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_delete_milestone TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_toggle_milestone_status TO authenticated;

-- =====================================================
-- 6. 마일스톤 상세 조회 함수 (단일 마일스톤)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_milestone_detail(
    p_milestone_id uuid
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    title text,
    description text,
    due_date date,
    status text,
    open_issues_count integer,
    closed_issues_count integer,
    created_at timestamptz,
    updated_at timestamptz,
    closed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 특정 마일스톤의 상세 정보를 조회합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 * 
 * 반환값:
 *   - 마일스톤 상세 정보
 */
BEGIN
    -- 마일스톤 상세 조회 쿼리
    RETURN QUERY
    SELECT 
        m.id,
        m.project_id,
        m.title,
        m.description,
        m.due_date,
        m.status,
        m.open_issues_count,
        m.closed_issues_count,
        m.created_at,
        m.updated_at,
        m.closed_at
    FROM odd.tbl_milestones m
    WHERE m.id = p_milestone_id
    LIMIT 1;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_milestone_detail: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION odd.v1_fetch_milestone_detail TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_milestone_detail TO anon;

-- =====================================================
-- 7. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_milestones IS '프로젝트의 마일스톤 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원합니다.';
COMMENT ON FUNCTION odd.v1_create_milestone IS '마일스톤을 생성하는 함수. 프로젝트 생성자만 마일스톤 생성 가능.';
COMMENT ON FUNCTION odd.v1_update_milestone IS '마일스톤을 수정하는 함수. 프로젝트 생성자만 수정 가능.';
COMMENT ON FUNCTION odd.v1_delete_milestone IS '마일스톤을 삭제하는 함수. 프로젝트 생성자만 삭제 가능.';
COMMENT ON FUNCTION odd.v1_toggle_milestone_status IS '마일스톤의 상태를 토글하는 함수 (open ↔ closed). 프로젝트 생성자만 토글 가능.';
COMMENT ON FUNCTION odd.v1_fetch_milestone_detail IS '특정 마일스톤의 상세 정보를 조회하는 함수.';

