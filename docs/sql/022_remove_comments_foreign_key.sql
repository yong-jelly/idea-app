-- =====================================================
-- 댓글 테이블 외래키 제약조건 제거
-- =====================================================
-- 
-- 프로젝트 댓글을 지원하기 위해 post_id의 외래키 제약조건을 제거합니다.
-- v1_create_comment 함수에서 포스트/프로젝트 존재 여부를 검증합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/022_remove_comments_foreign_key.sql
-- 
-- =====================================================
-- 1. 외래키 제약조건 제거
-- =====================================================

-- 기존 외래키 제약조건 제거 (여러 이름으로 존재할 수 있음)
ALTER TABLE odd.tbl_comments DROP CONSTRAINT IF EXISTS tbl_comments_post_id_fkey;
ALTER TABLE odd.tbl_comments DROP CONSTRAINT IF EXISTS tbl_comments_post_id_fkey1;
ALTER TABLE odd.tbl_comments DROP CONSTRAINT IF EXISTS tbl_comments_post_id_fkey2;

-- 모든 외래키 제약조건 확인 및 제거
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'odd'
        AND table_name = 'tbl_comments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%post_id%'
    ) LOOP
        EXECUTE 'ALTER TABLE odd.tbl_comments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- =====================================================
-- 2. 코멘트 업데이트
-- =====================================================

COMMENT ON COLUMN odd.tbl_comments.post_id IS '포스트 ID 또는 프로젝트 ID (tbl_posts.id 또는 projects.id 참조, 외래키 제약조건 없음)';







