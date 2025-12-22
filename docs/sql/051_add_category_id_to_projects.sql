-- =====================================================
-- projects 테이블에 category_id 필드 추가
-- =====================================================
-- 
-- 원본 카테고리 ID를 저장하여 편집 시 정확한 카테고리를 표시할 수 있도록 합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/051_add_category_id_to_projects.sql
-- 
-- =====================================================

-- 1. category_id 컬럼 추가 (NULL 허용, 기존 데이터는 NULL)
ALTER TABLE odd.projects
ADD COLUMN IF NOT EXISTS category_id text;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON odd.projects(category_id);

-- 3. 코멘트 추가
COMMENT ON COLUMN odd.projects.category_id IS '원본 카테고리 ID (예: devtool, utility, productivity 등). category 필드와 함께 사용하여 편집 시 정확한 카테고리를 표시합니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * category_id 값 예시:
 *   - 'game', 'web', 'mobile', 'ai', 'opensource' (mappedCategory와 동일)
 *   - 'devtool', 'utility', 'productivity', 'desktop', 'design' (tool로 매핑되는 카테고리들)
 *   - 'social', 'education', 'entertainment' 등 (web으로 매핑되는 카테고리들)
 * 
 * 기존 데이터:
 *   - 기존 프로젝트의 category_id는 NULL입니다
 *   - 편집 시 category 필드 값으로 역매핑을 시도하지만, 정확하지 않을 수 있습니다
 *   - 새로 생성되는 프로젝트부터는 category_id가 저장됩니다
 */


