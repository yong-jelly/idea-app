-- =====================================================
-- 내가 생성한 프로젝트를 북마크 테이블에 자동 저장
-- =====================================================
-- 
-- 사용자가 생성한 프로젝트를 자동으로 북마크 테이블에 저장합니다.
-- 이 쿼리는 한 번만 실행하면 됩니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/040_upsert_my_projects_to_bookmarks.sql
-- 
-- =====================================================

-- 내가 생성한 프로젝트를 북마크 테이블에 upsert
-- 이미 존재하는 경우 무시하고, 없는 경우만 추가
INSERT INTO odd.tbl_project_bookmarks (project_id, user_id, created_at)
SELECT 
    p.id AS project_id,
    p.author_id AS user_id,
    p.created_at AS created_at
FROM odd.projects p
WHERE NOT EXISTS (
    SELECT 1 
    FROM odd.tbl_project_bookmarks pb
    WHERE pb.project_id = p.id 
    AND pb.user_id = p.author_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 결과 확인
SELECT 
    COUNT(*) AS total_bookmarks,
    COUNT(DISTINCT user_id) AS total_users,
    COUNT(DISTINCT project_id) AS total_projects
FROM odd.tbl_project_bookmarks;

