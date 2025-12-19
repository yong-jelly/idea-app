-- =====================================================
-- 태스크 관련 함수들
-- =====================================================
-- 
-- 마일스톤의 태스크를 관리하는 함수들입니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/031_v1_task_functions.sql
-- 
-- =====================================================
-- 1. 태스크 목록 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_tasks(
    p_milestone_id uuid,
    p_status text DEFAULT NULL,  -- 'all', 'todo', 'done' (NULL이면 'all')
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    milestone_id uuid,
    author_id bigint,
    title text,
    description text,
    due_date date,
    status text,
    created_at timestamptz,
    updated_at timestamptz,
    completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 마일스톤의 태스크 목록을 조회합니다.
 *           필터링, 정렬, 페이지네이션을 지원합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 *   - p_status: 상태 필터 (NULL이면 전체)
 *                'all', 'todo', 'done' 중 하나
 *   - p_limit: 조회 개수 제한 (기본값: 100, 최대: 200)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 태스크 목록 (정렬: todo 우선, 그 다음 최신순)
 */
DECLARE
    v_status_filter text;
BEGIN
    -- 상태 필터 처리
    IF p_status IS NULL OR p_status = 'all' THEN
        v_status_filter := NULL;
    ELSIF p_status IN ('todo', 'done') THEN
        v_status_filter := p_status;
    ELSE
        RAISE EXCEPTION '유효하지 않은 상태입니다: %', p_status;
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
    
    -- 태스크 조회 쿼리
    RETURN QUERY
    SELECT 
        t.id,
        t.milestone_id,
        t.author_id,
        t.title,
        t.description,
        t.due_date,
        t.status,
        t.created_at,
        t.updated_at,
        t.completed_at
    FROM odd.tbl_tasks t
    WHERE 
        t.milestone_id = p_milestone_id
        -- 상태 필터
        AND (v_status_filter IS NULL OR t.status = v_status_filter)
    ORDER BY 
        -- todo 태스크 우선
        CASE WHEN t.status = 'todo' THEN 0 ELSE 1 END,
        -- 그 다음 최신순 정렬
        t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_tasks: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 태스크 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_task(
    p_milestone_id uuid,
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
 * 함수 설명: 태스크를 생성합니다.
 *           프로젝트 소유자만 생성 가능합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 *   - p_title: 제목 (필수, 최대 50자)
 *   - p_description: 설명 (선택, 최대 200자)
 *   - p_due_date: 마감일 (선택)
 * 
 * 반환값:
 *   - 생성된 태스크 ID (UUID)
 * 
 * 보안:
 *   - 프로젝트 소유자만 태스크 생성 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_id uuid;
    v_project_author_id bigint;
    v_task_id uuid;
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
    
    IF v_project_author_id IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자만 태스크를 생성할 수 있습니다';
    END IF;
    
    -- 제목 길이 검사
    IF length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 태스크 생성
    INSERT INTO odd.tbl_tasks (
        milestone_id,
        author_id,
        title,
        description,
        due_date,
        status
    ) VALUES (
        p_milestone_id,
        v_user_id,
        p_title,
        p_description,
        p_due_date,
        'todo'
    )
    RETURNING id INTO v_task_id;
    
    RETURN v_task_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_task: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 태스크 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_task(
    p_task_id uuid,
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
 * 함수 설명: 태스크를 수정합니다.
 *           프로젝트 소유자 또는 태스크 생성자만 수정 가능합니다.
 * 
 * 매개변수:
 *   - p_task_id: 태스크 ID (필수)
 *   - p_title: 제목 (선택, NULL이면 변경하지 않음)
 *   - p_description: 설명 (선택, NULL이면 변경하지 않음)
 *   - p_due_date: 마감일 (선택, NULL이면 변경하지 않음)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_task_author_id bigint;
    v_milestone_id uuid;
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
    
    -- 태스크의 작성자 및 마일스톤 ID 조회
    SELECT t.author_id, t.milestone_id INTO v_task_author_id, v_milestone_id
    FROM odd.tbl_tasks t
    WHERE t.id = p_task_id;
    
    IF v_milestone_id IS NULL THEN
        RAISE EXCEPTION '태스크를 찾을 수 없습니다';
    END IF;
    
    -- 마일스톤의 프로젝트 ID 조회
    SELECT m.project_id INTO v_project_id
    FROM odd.tbl_milestones m
    WHERE m.id = v_milestone_id;
    
    -- 프로젝트 작성자 확인
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    -- 권한 체크: 프로젝트 소유자 또는 태스크 생성자만 수정 가능
    IF v_project_author_id != v_user_id AND v_task_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자 또는 태스크 생성자만 태스크를 수정할 수 있습니다';
    END IF;
    
    -- 제목 길이 검사
    IF p_title IS NOT NULL AND length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 태스크 수정
    UPDATE odd.tbl_tasks
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        due_date = COALESCE(p_due_date, due_date)
    WHERE id = p_task_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_task: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 태스크 삭제 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_task(
    p_task_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 태스크를 삭제합니다.
 *           프로젝트 소유자 또는 태스크 생성자만 삭제 가능합니다.
 * 
 * 매개변수:
 *   - p_task_id: 태스크 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_task_author_id bigint;
    v_milestone_id uuid;
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
    
    -- 태스크의 작성자 및 마일스톤 ID 조회
    SELECT t.author_id, t.milestone_id INTO v_task_author_id, v_milestone_id
    FROM odd.tbl_tasks t
    WHERE t.id = p_task_id;
    
    IF v_milestone_id IS NULL THEN
        RAISE EXCEPTION '태스크를 찾을 수 없습니다';
    END IF;
    
    -- 마일스톤의 프로젝트 ID 조회
    SELECT m.project_id INTO v_project_id
    FROM odd.tbl_milestones m
    WHERE m.id = v_milestone_id;
    
    -- 프로젝트 작성자 확인
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    -- 권한 체크: 프로젝트 소유자 또는 태스크 생성자만 삭제 가능
    IF v_project_author_id != v_user_id AND v_task_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자 또는 태스크 생성자만 태스크를 삭제할 수 있습니다';
    END IF;
    
    -- 태스크 삭제
    DELETE FROM odd.tbl_tasks
    WHERE id = p_task_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_task: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 태스크 상태 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_task_status(
    p_task_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 태스크의 상태를 토글합니다 (todo ↔ done).
 *           프로젝트 소유자 또는 태스크 생성자만 토글 가능합니다.
 * 
 * 매개변수:
 *   - p_task_id: 태스크 ID (필수)
 * 
 * 반환값:
 *   - 성공 여부 (boolean)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_task_author_id bigint;
    v_current_status text;
    v_new_status text;
    v_milestone_id uuid;
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
    
    -- 태스크의 작성자, 현재 상태 및 마일스톤 ID 조회
    SELECT t.author_id, t.status, t.milestone_id INTO v_task_author_id, v_current_status, v_milestone_id
    FROM odd.tbl_tasks t
    WHERE t.id = p_task_id;
    
    IF v_milestone_id IS NULL THEN
        RAISE EXCEPTION '태스크를 찾을 수 없습니다';
    END IF;
    
    -- 마일스톤의 프로젝트 ID 조회
    SELECT m.project_id INTO v_project_id
    FROM odd.tbl_milestones m
    WHERE m.id = v_milestone_id;
    
    -- 프로젝트 작성자 확인
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    -- 권한 체크: 프로젝트 소유자 또는 태스크 생성자만 토글 가능
    IF v_project_author_id != v_user_id AND v_task_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자 또는 태스크 생성자만 태스크 상태를 변경할 수 있습니다';
    END IF;
    
    -- 상태 토글
    IF v_current_status = 'todo' THEN
        v_new_status := 'done';
    ELSE
        v_new_status := 'todo';
    END IF;
    
    -- 태스크 상태 업데이트
    UPDATE odd.tbl_tasks
    SET 
        status = v_new_status,
        completed_at = CASE 
            WHEN v_new_status = 'done' THEN now()
            ELSE NULL
        END
    WHERE id = p_task_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_task_status: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_tasks TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_task TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_update_task TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_delete_task TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_toggle_task_status TO authenticated;

-- =====================================================
-- 7. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_tasks IS '마일스톤의 태스크 목록을 조회하는 함수. 필터링, 정렬, 페이지네이션을 지원합니다.';
COMMENT ON FUNCTION odd.v1_create_task IS '태스크를 생성하는 함수. 프로젝트 소유자만 태스크 생성 가능.';
COMMENT ON FUNCTION odd.v1_update_task IS '태스크를 수정하는 함수. 프로젝트 소유자 또는 태스크 생성자만 수정 가능.';
COMMENT ON FUNCTION odd.v1_delete_task IS '태스크를 삭제하는 함수. 프로젝트 소유자 또는 태스크 생성자만 삭제 가능.';
COMMENT ON FUNCTION odd.v1_toggle_task_status IS '태스크의 상태를 토글하는 함수 (todo ↔ done). 프로젝트 소유자 또는 태스크 생성자만 토글 가능.';

