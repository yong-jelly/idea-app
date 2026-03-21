-- =====================================================
-- 프로젝트 액세스 토큰 객체 제거 (데이터 삭제)
-- =====================================================
--
-- 기존에 065를 적용한 뒤 스키마를 바꾸려면 이 스크립트로 함수·테이블을 제거한 다음
-- docs/sql/065_create_project_access_tokens.sql 을 다시 실행하세요.
--
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/066_drop_project_access_tokens_for_recreate.sql
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/065_create_project_access_tokens.sql
--
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_revoke_project_access_token(uuid);
DROP FUNCTION IF EXISTS odd.v1_fetch_project_access_tokens(uuid, boolean);
DROP FUNCTION IF EXISTS odd.v1_create_project_access_token(uuid, text, text[], timestamptz);

DROP TABLE IF EXISTS odd.tbl_project_access_tokens CASCADE;
