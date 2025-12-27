-- =====================================================
-- 코드 테이블 생성
-- =====================================================
-- 
-- 모든 코드 타입을 통합 관리하는 단일 테이블입니다.
-- 댓글 출처 타입, 포스트 타입 등 다양한 코드를 관리합니다.
-- 
-- 사용 위치:
--   - 댓글 출처 타입 구분 (comment_source_type)
--   - 향후 확장 가능한 코드 관리 시스템
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/020_create_codes_table.sql
-- 
-- =====================================================
-- 1. 코드 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_codes (
    id bigserial PRIMARY KEY,
    code_type text NOT NULL,  -- 코드 타입 (예: 'comment_source_type')
    code_value text NOT NULL,  -- 코드 값 (예: 'feed', 'project', 'project.community')
    code_label text NOT NULL,  -- 표시용 레이블 (예: '피드', '프로젝트', '프로젝트 커뮤니티')
    description text,  -- 설명
    is_active boolean DEFAULT true NOT NULL,  -- 활성화 여부
    sort_order integer DEFAULT 0 NOT NULL,  -- 정렬 순서
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- 고유 제약조건: 같은 코드 타입 내에서 코드 값은 유일해야 함
    UNIQUE(code_type, code_value)
);

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

-- 코드 타입별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_codes_code_type ON odd.tbl_codes(code_type, sort_order);

-- 활성 코드만 조회 (부분 인덱스)
CREATE INDEX IF NOT EXISTS idx_tbl_codes_active ON odd.tbl_codes(code_type, sort_order) WHERE is_active = true;

-- =====================================================
-- 3. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_codes_updated_at ON odd.tbl_codes;
CREATE TRIGGER trigger_tbl_codes_updated_at
    BEFORE UPDATE ON odd.tbl_codes
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_codes_updated_at();

-- =====================================================
-- 4. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_codes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 코드를 읽을 수 있음
CREATE POLICY "Anyone can read active codes"
    ON odd.tbl_codes
    FOR SELECT
    TO public
    USING (is_active = true);

-- 인증된 사용자만 모든 코드를 읽을 수 있음 (관리용)
CREATE POLICY "Authenticated users can read all codes"
    ON odd.tbl_codes
    FOR SELECT
    TO authenticated
    USING (true);

-- 관리자만 코드를 생성/수정/삭제할 수 있음 (향후 구현)
-- 현재는 직접 INSERT로 초기 데이터 삽입

-- =====================================================
-- 5. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_codes TO anon;
GRANT SELECT ON odd.tbl_codes TO authenticated;

-- =====================================================
-- 6. 초기 코드 데이터 삽입
-- =====================================================

-- 댓글 출처 타입 코드 삽입
INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('comment_source_type', 'feed', '피드', '피드 포스트 댓글', 1, true),
    ('comment_source_type', 'project', '프로젝트', '프로젝트 댓글', 2, true),
    ('comment_source_type', 'project.community', '프로젝트 커뮤니티', '프로젝트 커뮤니티 포스트 댓글', 3, true),
    ('comment_source_type', 'feedback', '피드백', '피드백 댓글', 4, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 7. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_codes IS '모든 코드 타입을 통합 관리하는 테이블';
COMMENT ON COLUMN odd.tbl_codes.id IS '코드 고유 ID';
COMMENT ON COLUMN odd.tbl_codes.code_type IS '코드 타입 (예: comment_source_type)';
COMMENT ON COLUMN odd.tbl_codes.code_value IS '코드 값 (예: feed, project, project.community)';
COMMENT ON COLUMN odd.tbl_codes.code_label IS '표시용 레이블 (예: 피드, 프로젝트, 프로젝트 커뮤니티)';
COMMENT ON COLUMN odd.tbl_codes.description IS '코드 설명';
COMMENT ON COLUMN odd.tbl_codes.is_active IS '활성화 여부';
COMMENT ON COLUMN odd.tbl_codes.sort_order IS '정렬 순서';
COMMENT ON COLUMN odd.tbl_codes.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_codes.updated_at IS '수정일시';






