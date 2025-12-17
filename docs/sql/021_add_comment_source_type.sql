-- =====================================================
-- 댓글 테이블 수정: 출처 타입 코드 추가
-- =====================================================
-- 
-- 댓글 테이블에 source_type_code 컬럼을 추가하여 댓글의 출처를 구분합니다.
-- 코드 테이블(tbl_codes)을 참조하여 체계적으로 관리합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/021_add_comment_source_type.sql
-- 
-- =====================================================
-- 1. 댓글 테이블에 source_type_code 컬럼 추가
-- =====================================================

-- 컬럼 추가 (기존 데이터는 NULL로 설정)
ALTER TABLE odd.tbl_comments
    ADD COLUMN IF NOT EXISTS source_type_code text;

-- CHECK 제약조건으로 코드 값 검증
-- (외래키는 복합키를 참조하므로 CHECK 제약조건 사용)
ALTER TABLE odd.tbl_comments
    DROP CONSTRAINT IF EXISTS chk_tbl_comments_source_type_code;

ALTER TABLE odd.tbl_comments
    ADD CONSTRAINT chk_tbl_comments_source_type_code
    CHECK (
        source_type_code IS NULL OR
        EXISTS (
            SELECT 1 
            FROM odd.tbl_codes 
            WHERE code_type = 'comment_source_type' 
            AND code_value = source_type_code 
            AND is_active = true
        )
    );

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

-- 출처 타입별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comments_source_type_code ON odd.tbl_comments(source_type_code) WHERE source_type_code IS NOT NULL;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON COLUMN odd.tbl_comments.source_type_code IS '댓글 출처 타입 코드 (tbl_codes 참조, comment_source_type)';

