-- =====================================================
-- odd.v1_delete_project: 프로젝트 소프트 삭제 함수
-- =====================================================
-- 
-- 프로젝트를 소프트 삭제하는 함수입니다.
-- user_89bf5abb 사용자만 삭제할 수 있습니다.
-- 
-- 사용 위치:
--   - ProjectDetailPage에서 프로젝트 삭제 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_delete_project', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/056_v1_delete_project.sql
-- 
-- =====================================================
-- 1. 프로젝트 삭제 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_project(
    p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 프로젝트를 소프트 삭제합니다.
 *           user_89bf5abb 사용자만 삭제할 수 있습니다.
 *           deleted_at 필드를 현재 시간으로 설정하여 삭제 표시합니다.
 *           관련 자료(댓글, 좋아요 등)는 삭제되지 않습니다.
 * 
 * 매개변수:
 *   - p_project_id: 삭제할 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - true: 삭제 성공
 *   - 예외 발생: 삭제 실패
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - user_89bf5abb 사용자만 삭제 가능 (하드코딩)
 *   - 인증된 사용자만 접근 가능
 * 
 * 예시 쿼리:
 *   SELECT odd.v1_delete_project(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid
 *   );
 */
DECLARE
    v_project_id uuid;
    v_auth_id uuid;
    v_user_id bigint;
    v_allowed_user_id bigint;
BEGIN
    -- 프로젝트 ID 유효성 검사
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 ID는 필수입니다';
    END IF;
    
    v_project_id := p_project_id;
    
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;
    
    -- user_89bf5abb 사용자 ID 조회 (username으로 확인, 하드코딩)
    SELECT u.id INTO v_allowed_user_id
    FROM odd.tbl_users u
    WHERE u.username = 'user_89bf5abb';
    
    -- user_89bf5abb 사용자가 아닌 경우 삭제 불가
    IF v_allowed_user_id IS NULL OR v_user_id != v_allowed_user_id THEN
        RAISE EXCEPTION '프로젝트를 삭제할 권한이 없습니다';
    END IF;
    
    -- 프로젝트 존재 여부 확인
    IF NOT EXISTS (
        SELECT 1 FROM odd.projects
        WHERE id = v_project_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없거나 이미 삭제되었습니다';
    END IF;
    
    -- 프로젝트 소프트 삭제 (deleted_at 설정)
    UPDATE odd.projects
    SET deleted_at = now()
    WHERE id = v_project_id;
    
    -- 삭제 성공
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_project: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 인증된 사용자만 접근 가능 (하지만 실제로는 user_89bf5abb만 삭제 가능)
GRANT EXECUTE ON FUNCTION odd.v1_delete_project(uuid) TO authenticated;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_delete_project IS '프로젝트를 소프트 삭제하는 함수. user_89bf5abb 사용자만 삭제할 수 있습니다. deleted_at 필드를 현재 시간으로 설정하여 삭제 표시합니다.';

-- =====================================================
-- 4. 테스트 쿼리
-- =====================================================

/*
 * 테스트 쿼리:
 * 
 * -- 프로젝트 삭제 (user_89bf5abb 사용자로 로그인한 경우만 가능)
 * SELECT odd.v1_delete_project(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid
 * );
 */

