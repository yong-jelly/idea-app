-- =====================================================
-- 변경사항(Changelog) 테이블 생성
-- =====================================================
-- 
-- 프로젝트의 릴리즈 노트와 변경사항을 관리하는 테이블입니다.
-- 
-- 사용 위치:
--   - ChangelogTab: 변경사항 목록 및 관리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/032_create_changelogs_table.sql
-- 
-- =====================================================
-- 1. 변경사항 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_changelogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES odd.projects(id) ON DELETE CASCADE,
    
    -- 변경사항 정보
    version text NOT NULL,  -- 버전 (최대 20자)
    title text NOT NULL,  -- 제목 (최대 50자)
    description text,  -- 설명 (최대 200자)
    changes jsonb NOT NULL DEFAULT '[]'::jsonb,  -- 변경사항 배열 [{id, type, description}]
    released_at date NOT NULL,  -- 릴리즈 날짜
    
    -- 링크 정보
    repository_url text,  -- 저장소 URL
    download_url text,  -- 다운로드 URL
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스: 프로젝트별 변경사항 조회
CREATE INDEX IF NOT EXISTS idx_tbl_changelogs_project_id ON odd.tbl_changelogs(project_id);

-- 인덱스: 릴리즈 날짜별 정렬 (최신순)
CREATE INDEX IF NOT EXISTS idx_tbl_changelogs_released_at ON odd.tbl_changelogs(released_at DESC);

-- 인덱스: 최신순 정렬
CREATE INDEX IF NOT EXISTS idx_tbl_changelogs_created_at ON odd.tbl_changelogs(created_at DESC);

-- =====================================================
-- 2. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_changelogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_changelogs_updated_at ON odd.tbl_changelogs;
CREATE TRIGGER trigger_tbl_changelogs_updated_at
    BEFORE UPDATE ON odd.tbl_changelogs
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_changelogs_updated_at();

-- =====================================================
-- 3. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_changelogs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 변경사항을 읽을 수 있음 (공개)
CREATE POLICY "Anyone can read changelogs"
    ON odd.tbl_changelogs
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 변경사항을 생성할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can create changelogs"
    ON odd.tbl_changelogs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

-- 인증된 사용자만 변경사항을 수정할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can update changelogs"
    ON odd.tbl_changelogs
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- 인증된 사용자만 변경사항을 삭제할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can delete changelogs"
    ON odd.tbl_changelogs
    FOR DELETE
    TO authenticated
    USING (true);  -- 권한 체크는 함수에서 수행

-- =====================================================
-- 4. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_changelogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_changelogs TO authenticated;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_changelogs IS '프로젝트의 변경사항(Changelog)을 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_changelogs.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_changelogs.project_id IS '프로젝트 ID (projects.id 참조)';
COMMENT ON COLUMN odd.tbl_changelogs.version IS '버전 (최대 20자, 예: v1.0.0)';
COMMENT ON COLUMN odd.tbl_changelogs.title IS '제목 (최대 50자)';
COMMENT ON COLUMN odd.tbl_changelogs.description IS '설명 (최대 200자)';
COMMENT ON COLUMN odd.tbl_changelogs.changes IS '변경사항 배열 (JSONB): [{id, type, description}]';
COMMENT ON COLUMN odd.tbl_changelogs.released_at IS '릴리즈 날짜';
COMMENT ON COLUMN odd.tbl_changelogs.repository_url IS '저장소 URL (선택)';
COMMENT ON COLUMN odd.tbl_changelogs.download_url IS '다운로드 URL (선택)';
COMMENT ON COLUMN odd.tbl_changelogs.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_changelogs.updated_at IS '수정일시';




