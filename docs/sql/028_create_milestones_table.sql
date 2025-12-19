-- =====================================================
-- 마일스톤 테이블 생성
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 마일스톤(목표)을 관리하는 테이블입니다.
-- 
-- 사용 위치:
--   - MilestonesTab: 마일스톤 목록 및 관리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/028_create_milestones_table.sql
-- 
-- =====================================================
-- 1. 마일스톤 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES odd.projects(id) ON DELETE CASCADE,
    
    -- 마일스톤 정보
    title text NOT NULL,  -- 제목 (최대 50자)
    description text,  -- 설명 (최대 200자)
    due_date date,  -- 목표 기한
    
    -- 상태
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),  -- 상태
    
    -- 통계 (비정규화)
    open_issues_count integer DEFAULT 0 NOT NULL,  -- 진행 중인 이슈 수
    closed_issues_count integer DEFAULT 0 NOT NULL,  -- 완료된 이슈 수
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    closed_at timestamptz  -- 완료일시 (status가 'closed'일 때 설정)
);

-- 인덱스: 프로젝트별 마일스톤 조회
CREATE INDEX IF NOT EXISTS idx_tbl_milestones_project_id ON odd.tbl_milestones(project_id);

-- 인덱스: 상태별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_milestones_status ON odd.tbl_milestones(status);

-- 인덱스: 최신순 정렬
CREATE INDEX IF NOT EXISTS idx_tbl_milestones_created_at ON odd.tbl_milestones(created_at DESC);

-- =====================================================
-- 2. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_milestones_updated_at ON odd.tbl_milestones;
CREATE TRIGGER trigger_tbl_milestones_updated_at
    BEFORE UPDATE ON odd.tbl_milestones
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_milestones_updated_at();

-- =====================================================
-- 3. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_milestones ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 마일스톤을 읽을 수 있음 (공개)
CREATE POLICY "Anyone can read milestones"
    ON odd.tbl_milestones
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 마일스톤을 생성할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can create milestones"
    ON odd.tbl_milestones
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

-- 인증된 사용자만 마일스톤을 수정할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can update milestones"
    ON odd.tbl_milestones
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- 인증된 사용자만 마일스톤을 삭제할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can delete milestones"
    ON odd.tbl_milestones
    FOR DELETE
    TO authenticated
    USING (true);  -- 권한 체크는 함수에서 수행

-- =====================================================
-- 4. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_milestones TO authenticated;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_milestones IS '프로젝트의 마일스톤(목표)을 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_milestones.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_milestones.project_id IS '프로젝트 ID (projects.id 참조)';
COMMENT ON COLUMN odd.tbl_milestones.title IS '제목 (최대 50자)';
COMMENT ON COLUMN odd.tbl_milestones.description IS '설명 (최대 200자)';
COMMENT ON COLUMN odd.tbl_milestones.due_date IS '목표 기한';
COMMENT ON COLUMN odd.tbl_milestones.status IS '상태 (open, closed)';
COMMENT ON COLUMN odd.tbl_milestones.open_issues_count IS '진행 중인 이슈 수';
COMMENT ON COLUMN odd.tbl_milestones.closed_issues_count IS '완료된 이슈 수';
COMMENT ON COLUMN odd.tbl_milestones.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_milestones.updated_at IS '수정일시';
COMMENT ON COLUMN odd.tbl_milestones.closed_at IS '완료일시 (status가 closed일 때 설정)';

