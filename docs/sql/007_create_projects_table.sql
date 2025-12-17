-- =====================================================
-- 프로젝트 테이블 생성
-- =====================================================
-- 
-- 프로젝트 등록 기능을 위한 테이블을 생성합니다.
-- /create-project 페이지에서 프로젝트를 등록할 때 사용됩니다.
-- 
-- 사용 위치:
--   - CreateProjectPage에서 프로젝트 생성 시 호출
--   - 프론트엔드: supabase.from('projects').insert({...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/007_create_projects_table.sql
-- 
-- =====================================================
-- 1. 프로젝트 테이블 생성
-- =====================================================

-- 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS odd.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    title text NOT NULL,
    short_description text NOT NULL,
    full_description text,
    category text NOT NULL CHECK (category IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai')),
    
    -- 기술 스택 (JSON 배열)
    tech_stack jsonb DEFAULT '[]'::jsonb,
    
    -- 이미지
    thumbnail text, -- Storage 경로 또는 URL
    gallery_images jsonb DEFAULT '[]'::jsonb, -- Storage 경로 배열
    
    -- 링크
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    
    -- 작성자
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 통계
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    backers_count integer DEFAULT 0 NOT NULL,
    current_funding integer DEFAULT 0 NOT NULL,
    target_funding integer DEFAULT 0 NOT NULL,
    days_left integer DEFAULT 0 NOT NULL,
    
    -- 상태
    status text DEFAULT 'funding' NOT NULL CHECK (status IN ('funding', 'in_progress', 'completed', 'cancelled')),
    featured boolean DEFAULT false NOT NULL,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_author_id ON odd.projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON odd.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON odd.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON odd.projects(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON odd.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_likes_count ON odd.projects(likes_count DESC);

-- GIN 인덱스 (JSON 검색용)
CREATE INDEX IF NOT EXISTS idx_projects_tech_stack ON odd.projects USING gin(tech_stack);
CREATE INDEX IF NOT EXISTS idx_projects_gallery_images ON odd.projects USING gin(gallery_images);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION odd.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON odd.projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON odd.projects
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_projects_updated_at();

-- =====================================================
-- 2. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.projects ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
CREATE POLICY "Anyone can read projects"
    ON odd.projects
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 프로젝트를 생성할 수 있음
CREATE POLICY "Authenticated users can create projects"
    ON odd.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 작성자만 자신의 프로젝트를 수정할 수 있음
CREATE POLICY "Users can update own projects"
    ON odd.projects
    FOR UPDATE
    TO authenticated
    USING (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 작성자만 자신의 프로젝트를 삭제할 수 있음
CREATE POLICY "Users can delete own projects"
    ON odd.projects
    FOR DELETE
    TO authenticated
    USING (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.projects IS '프로젝트 정보를 저장하는 테이블';
COMMENT ON COLUMN odd.projects.id IS '프로젝트 고유 ID (UUID)';
COMMENT ON COLUMN odd.projects.title IS '프로젝트 제목';
COMMENT ON COLUMN odd.projects.short_description IS '프로젝트 짧은 설명 (최대 200자)';
COMMENT ON COLUMN odd.projects.full_description IS '프로젝트 상세 설명';
COMMENT ON COLUMN odd.projects.category IS '프로젝트 카테고리 (game, web, mobile, tool, opensource, ai)';
COMMENT ON COLUMN odd.projects.tech_stack IS '사용한 기술 스택 (JSON 배열)';
COMMENT ON COLUMN odd.projects.thumbnail IS '프로젝트 썸네일 이미지 경로 (Storage 경로 또는 URL)';
COMMENT ON COLUMN odd.projects.gallery_images IS '갤러리 이미지 경로 배열 (JSON 배열)';
COMMENT ON COLUMN odd.projects.repository_url IS '저장소 URL (예: GitHub)';
COMMENT ON COLUMN odd.projects.demo_url IS '데모 URL';
COMMENT ON COLUMN odd.projects.android_store_url IS 'Google Play Store URL';
COMMENT ON COLUMN odd.projects.ios_store_url IS 'App Store (iOS) URL';
COMMENT ON COLUMN odd.projects.mac_store_url IS 'Mac App Store URL';
COMMENT ON COLUMN odd.projects.author_id IS '작성자 ID (tbl_users.id 참조)';
COMMENT ON COLUMN odd.projects.likes_count IS '좋아요 수';
COMMENT ON COLUMN odd.projects.comments_count IS '댓글 수';
COMMENT ON COLUMN odd.projects.backers_count IS '서포터 수';
COMMENT ON COLUMN odd.projects.current_funding IS '현재 펀딩 금액';
COMMENT ON COLUMN odd.projects.target_funding IS '목표 펀딩 금액';
COMMENT ON COLUMN odd.projects.days_left IS '남은 일수';
COMMENT ON COLUMN odd.projects.status IS '프로젝트 상태 (funding, in_progress, completed, cancelled)';
COMMENT ON COLUMN odd.projects.featured IS '주목할 프로젝트 여부';
COMMENT ON COLUMN odd.projects.created_at IS '생성일시';
COMMENT ON COLUMN odd.projects.updated_at IS '수정일시';
