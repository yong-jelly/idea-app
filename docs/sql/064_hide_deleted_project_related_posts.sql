-- =====================================================
-- 삭제된 프로젝트의 연관 포스트 숨김 처리
-- =====================================================
--
-- 목적:
--   - 프로젝트 삭제 시 해당 프로젝트에 연결된 포스트도 함께 소프트 삭제한다
--   - 기존 feed/community/feedback 조회 함수들의 p.is_deleted = false 조건을 재사용한다
--   - 통합 피드, 유저 피드, 좋아요 피드, 상세, 커뮤니티/피드백 목록에서
--     삭제된 프로젝트와 관련된 소통 내용이 모두 숨겨지게 한다
--
-- 참고:
--   - v1_fetch_saved_projects는 이미 projects.deleted_at IS NULL 필터가 적용되어 있다
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/064_hide_deleted_project_related_posts.sql

BEGIN;

-- =====================================================
-- 1. 프로젝트 삭제 함수 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_delete_project(
    p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_project_id uuid;
    v_auth_id uuid;
    v_user_id bigint;
    v_allowed_user_id bigint;
BEGIN
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 ID는 필수입니다';
    END IF;

    v_project_id := p_project_id;

    v_auth_id := auth.uid();

    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;

    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;

    SELECT u.id INTO v_allowed_user_id
    FROM odd.tbl_users u
    WHERE u.username = 'user_89bf5abb';

    IF v_allowed_user_id IS NULL OR v_user_id != v_allowed_user_id THEN
        RAISE EXCEPTION '프로젝트를 삭제할 권한이 없습니다';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM odd.projects
        WHERE id = v_project_id
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없거나 이미 삭제되었습니다';
    END IF;

    UPDATE odd.projects
    SET deleted_at = now()
    WHERE id = v_project_id;

    -- 프로젝트에 연결된 모든 포스트를 함께 숨긴다.
    -- 기존 피드/커뮤니티/상세 함수들의 p.is_deleted = false 필터를 그대로 활용한다.
    UPDATE odd.tbl_posts
    SET
        is_deleted = true,
        updated_at = now()
    WHERE project_id = v_project_id
      AND is_deleted = false;

    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_delete_project: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 코멘트 갱신
-- =====================================================

COMMENT ON FUNCTION odd.v1_delete_project(uuid) IS '프로젝트를 소프트 삭제하는 함수. 프로젝트 deleted_at을 설정하고, 연관 포스트도 is_deleted=true로 숨깁니다.';

COMMIT;
