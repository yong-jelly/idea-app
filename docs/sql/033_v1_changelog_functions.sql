-- =====================================================
-- 변경사항(Changelog) 관련 함수들
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 변경사항을 관리하는 함수들입니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/033_v1_changelog_functions.sql
-- 
-- =====================================================
-- 1. 변경사항 목록 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_changelogs(
    p_project_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    version text,
    title text,
    description text,
    changes jsonb,
    released_at date,
    repository_url text,
    download_url text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트의 변경사항 목록을 조회합니다.
 *           정렬, 페이지네이션을 지원합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 변경사항 목록 (정렬: 릴리즈 날짜 최신순)
 */
BEGIN
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
    
    -- 변경사항 조회 쿼리
    RETURN QUERY
    SELECT 
        c.id,
        c.project_id,
        c.version,
        c.title,
        c.description,
        c.changes,
        c.released_at,
        c.repository_url,
        c.download_url,
        c.created_at,
        c.updated_at
    FROM odd.tbl_changelogs c
    WHERE 
        c.project_id = p_project_id
    ORDER BY 
        -- 릴리즈 날짜 최신순
        c.released_at DESC,
        -- 그 다음 생성일시 최신순
        c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_changelogs: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 변경사항 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_changelog(
    p_project_id uuid,
    p_version text,
    p_title text,
    p_description text DEFAULT NULL,
    p_changes jsonb DEFAULT '[]'::jsonb,
    p_released_at date DEFAULT NULL,
    p_repository_url text DEFAULT NULL,
    p_download_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 변경사항을 생성합니다.
 *           프로젝트 생성자만 생성 가능합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 *   - p_version: 버전 (필수, 최대 20자)
 *   - p_title: 제목 (필수, 최대 50자)
 *   - p_description: 설명 (선택, 최대 200자)
 *   - p_changes: 변경사항 배열 (JSONB, 기본값: 빈 배열)
 *   - p_released_at: 릴리즈 날짜 (선택, NULL이면 오늘 날짜)
 *   - p_repository_url: 저장소 URL (선택)
 *   - p_download_url: 다운로드 URL (선택)
 * 
 * 반환값:
 *   - 생성된 변경사항 ID (UUID)
 * 
 * 보안:
 *   - 프로젝트 생성자만 변경사항 생성 가능
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_project_author_id bigint;
    v_changelog_id uuid;
    v_released_at date;
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
        RAISE EXCEPTION '프로젝트 생성자만 변경사항을 생성할 수 있습니다';
    END IF;
    
    -- 버전 길이 검사
    IF length(p_version) > 20 THEN
        RAISE EXCEPTION '버전은 최대 20자까지 가능합니다';
    END IF;
    
    -- 제목 길이 검사
    IF length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 릴리즈 날짜 설정 (NULL이면 오늘 날짜)
    IF p_released_at IS NULL THEN
        v_released_at := CURRENT_DATE;
    ELSE
        v_released_at := p_released_at;
    END IF;
    
    -- 변경사항 생성
    INSERT INTO odd.tbl_changelogs (
        project_id,
        version,
        title,
        description,
        changes,
        released_at,
        repository_url,
        download_url
    ) VALUES (
        p_project_id,
        p_version,
        p_title,
        p_description,
        p_changes,
        v_released_at,
        p_repository_url,
        p_download_url
    )
    RETURNING id INTO v_changelog_id;
    
    RETURN v_changelog_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_changelog: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. 변경사항 수정 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_update_changelog(
    p_changelog_id uuid,
    p_version text DEFAULT NULL,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_changes jsonb DEFAULT NULL,
    p_released_at date DEFAULT NULL,
    p_repository_url text DEFAULT NULL,
    p_download_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 변경사항을 수정합니다.
 *           프로젝트 생성자만 수정 가능합니다.
 * 
 * 매개변수:
 *   - p_changelog_id: 변경사항 ID (필수)
 *   - p_version: 버전 (선택, NULL이면 변경하지 않음)
 *   - p_title: 제목 (선택, NULL이면 변경하지 않음)
 *   - p_description: 설명 (선택, NULL이면 변경하지 않음)
 *   - p_changes: 변경사항 배열 (선택, NULL이면 변경하지 않음)
 *   - p_released_at: 릴리즈 날짜 (선택, NULL이면 변경하지 않음)
 *   - p_repository_url: 저장소 URL (선택, NULL이면 변경하지 않음)
 *   - p_download_url: 다운로드 URL (선택, NULL이면 변경하지 않음)
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
    
    -- 변경사항의 프로젝트 ID 조회
    SELECT c.project_id INTO v_project_id
    FROM odd.tbl_changelogs c
    WHERE c.id = p_changelog_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '변경사항을 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 변경사항을 수정할 수 있습니다';
    END IF;
    
    -- 버전 길이 검사
    IF p_version IS NOT NULL AND length(p_version) > 20 THEN
        RAISE EXCEPTION '버전은 최대 20자까지 가능합니다';
    END IF;
    
    -- 제목 길이 검사
    IF p_title IS NOT NULL AND length(p_title) > 50 THEN
        RAISE EXCEPTION '제목은 최대 50자까지 가능합니다';
    END IF;
    
    -- 설명 길이 검사
    IF p_description IS NOT NULL AND length(p_description) > 200 THEN
        RAISE EXCEPTION '설명은 최대 200자까지 가능합니다';
    END IF;
    
    -- 변경사항 수정
    UPDATE odd.tbl_changelogs
    SET 
        version = COALESCE(p_version, version),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        changes = COALESCE(p_changes, changes),
        released_at = COALESCE(p_released_at, released_at),
        repository_url = COALESCE(p_repository_url, repository_url),
        download_url = COALESCE(p_download_url, download_url)
    WHERE id = p_changelog_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_changelog: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 변경사항 삭제 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_changelog(
    p_changelog_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 변경사항을 삭제합니다.
 *           프로젝트 생성자만 삭제 가능합니다.
 * 
 * 매개변수:
 *   - p_changelog_id: 변경사항 ID (필수)
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
    
    -- 변경사항의 프로젝트 ID 조회
    SELECT c.project_id INTO v_project_id
    FROM odd.tbl_changelogs c
    WHERE c.id = p_changelog_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION '변경사항을 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 작성자 확인 (권한 체크)
    SELECT prj.author_id INTO v_project_author_id
    FROM odd.projects prj
    WHERE prj.id = v_project_id;
    
    IF v_project_author_id != v_user_id THEN
        RAISE EXCEPTION '프로젝트 생성자만 변경사항을 삭제할 수 있습니다';
    END IF;
    
    -- 변경사항 삭제
    DELETE FROM odd.tbl_changelogs
    WHERE id = p_changelog_id;
    
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_changelog: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_fetch_changelogs TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_changelogs TO anon;

GRANT EXECUTE ON FUNCTION odd.v1_create_changelog TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_update_changelog TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_delete_changelog TO authenticated;

-- =====================================================
-- 6. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_changelogs IS '프로젝트의 변경사항 목록을 조회하는 함수. 정렬, 페이지네이션을 지원합니다.';
COMMENT ON FUNCTION odd.v1_create_changelog IS '변경사항을 생성하는 함수. 프로젝트 생성자만 변경사항 생성 가능.';
COMMENT ON FUNCTION odd.v1_update_changelog IS '변경사항을 수정하는 함수. 프로젝트 생성자만 수정 가능.';
COMMENT ON FUNCTION odd.v1_delete_changelog IS '변경사항을 삭제하는 함수. 프로젝트 생성자만 삭제 가능.';

