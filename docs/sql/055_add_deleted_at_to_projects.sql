-- =====================================================
-- projects 테이블에 deleted_at 필드 추가 (소프트 삭제)
-- =====================================================
-- 
-- 프로젝트 소프트 삭제를 위해 deleted_at 필드를 추가합니다.
-- deleted_at이 NULL이 아닌 프로젝트는 삭제된 것으로 간주하며, 조회 시 제외됩니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/055_add_deleted_at_to_projects.sql
-- 
-- =====================================================

-- 1. deleted_at 컬럼 추가 (NULL 허용, 기존 데이터는 NULL)
ALTER TABLE odd.projects
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. 인덱스 생성 (삭제되지 않은 프로젝트 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON odd.projects(deleted_at) WHERE deleted_at IS NULL;

-- 3. 코멘트 추가
COMMENT ON COLUMN odd.projects.deleted_at IS '프로젝트 삭제 일시. NULL이면 삭제되지 않은 프로젝트, NULL이 아니면 삭제된 프로젝트입니다. 소프트 삭제 방식으로 실제 데이터는 삭제되지 않습니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * 소프트 삭제:
 *   - deleted_at이 NULL이면 삭제되지 않은 프로젝트
 *   - deleted_at이 NULL이 아니면 삭제된 프로젝트
 *   - 삭제된 프로젝트는 조회 시 자동으로 제외됩니다
 *   - 관련 자료(댓글, 좋아요 등)는 삭제되지 않습니다
 */

