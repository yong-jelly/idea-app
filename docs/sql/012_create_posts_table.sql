-- =====================================================
-- 포스트 테이블 생성
-- =====================================================
-- 
-- 피드 시스템의 핵심 테이블로, 사용자가 작성하는 포스트를 저장합니다.
-- 포스트 타입: text, project_update, milestone, feature_accepted
-- 
-- 사용 위치:
--   - FeedPage에서 포스트 목록 표시
--   - PostDetailPage에서 포스트 상세 표시
--   - 프론트엔드: supabase.schema('odd').rpc('v1_create_post', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/012_create_posts_table.sql
-- 
-- =====================================================
-- 1. 포스트 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 포스트 타입
    type text NOT NULL CHECK (type IN ('text', 'project_update', 'milestone', 'feature_accepted')),
    
    -- 콘텐츠
    content text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,  -- 이미지 URL 배열 (최대 4장)
    link_preview jsonb,  -- {url, title, description, image, domain}
    
    -- 프로젝트 연관 (project_update, milestone, feature_accepted용)
    project_id uuid REFERENCES odd.projects(id) ON DELETE SET NULL,
    milestone_title text,
    feature_title text,
    
    -- 출처 정보
    source_type text DEFAULT 'direct' CHECK (source_type IN ('direct', 'project', 'community')),
    source_id uuid,  -- project_id 또는 community_id
    source_name text,  -- 출처 이름 (비정규화)
    source_emoji text,  -- 출처 이모지 (비정규화)
    
    -- 통계 (비정규화)
    likes_count integer DEFAULT 0 NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL,
    bookmarks_count integer DEFAULT 0 NOT NULL,
    
    -- 상태
    is_pinned boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

-- 작성자별 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_posts_author_id ON odd.tbl_posts(author_id);

-- 타임라인 정렬 (최신순)
CREATE INDEX IF NOT EXISTS idx_tbl_posts_created_at ON odd.tbl_posts(created_at DESC);

-- 프로젝트별 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_posts_project_id ON odd.tbl_posts(project_id) WHERE project_id IS NOT NULL;

-- 출처별 필터링
CREATE INDEX IF NOT EXISTS idx_tbl_posts_source ON odd.tbl_posts(source_type, source_id) WHERE source_id IS NOT NULL;

-- 포스트 타입별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_posts_type ON odd.tbl_posts(type);

-- 삭제되지 않은 포스트만 조회 (부분 인덱스)
CREATE INDEX IF NOT EXISTS idx_tbl_posts_active ON odd.tbl_posts(created_at DESC) WHERE is_deleted = false;

-- 고정된 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_posts_pinned ON odd.tbl_posts(is_pinned) WHERE is_pinned = true;

-- 좋아요 수 정렬 (인기순)
CREATE INDEX IF NOT EXISTS idx_tbl_posts_likes ON odd.tbl_posts(likes_count DESC);

-- GIN 인덱스 (JSON 검색용)
CREATE INDEX IF NOT EXISTS idx_tbl_posts_images ON odd.tbl_posts USING gin(images);

-- =====================================================
-- 3. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_posts_updated_at ON odd.tbl_posts;
CREATE TRIGGER trigger_tbl_posts_updated_at
    BEFORE UPDATE ON odd.tbl_posts
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_posts_updated_at();

-- =====================================================
-- 4. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 삭제되지 않은 포스트를 읽을 수 있음
CREATE POLICY "Anyone can read active posts"
    ON odd.tbl_posts
    FOR SELECT
    TO public
    USING (is_deleted = false);

-- 인증된 사용자만 포스트를 생성할 수 있음
CREATE POLICY "Authenticated users can create posts"
    ON odd.tbl_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 작성자만 자신의 포스트를 수정할 수 있음
CREATE POLICY "Users can update own posts"
    ON odd.tbl_posts
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

-- 작성자만 자신의 포스트를 삭제할 수 있음 (소프트 삭제)
CREATE POLICY "Users can delete own posts"
    ON odd.tbl_posts
    FOR DELETE
    TO authenticated
    USING (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 5. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_posts TO authenticated;

-- =====================================================
-- 6. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_posts IS '피드 포스트를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_posts.id IS '포스트 고유 ID (UUID)';
COMMENT ON COLUMN odd.tbl_posts.author_id IS '작성자 ID (tbl_users.id 참조)';
COMMENT ON COLUMN odd.tbl_posts.type IS '포스트 타입 (text, project_update, milestone, feature_accepted)';
COMMENT ON COLUMN odd.tbl_posts.content IS '포스트 내용';
COMMENT ON COLUMN odd.tbl_posts.images IS '첨부 이미지 URL 배열 (최대 4장)';
COMMENT ON COLUMN odd.tbl_posts.link_preview IS '링크 프리뷰 정보 JSON {url, title, description, image, domain}';
COMMENT ON COLUMN odd.tbl_posts.project_id IS '연관 프로젝트 ID (projects.id 참조)';
COMMENT ON COLUMN odd.tbl_posts.milestone_title IS '마일스톤 제목 (milestone 타입용)';
COMMENT ON COLUMN odd.tbl_posts.feature_title IS '기능 제목 (feature_accepted 타입용)';
COMMENT ON COLUMN odd.tbl_posts.source_type IS '출처 타입 (direct, project, community)';
COMMENT ON COLUMN odd.tbl_posts.source_id IS '출처 ID (프로젝트 또는 커뮤니티 ID)';
COMMENT ON COLUMN odd.tbl_posts.source_name IS '출처 이름 (비정규화)';
COMMENT ON COLUMN odd.tbl_posts.source_emoji IS '출처 이모지 (비정규화)';
COMMENT ON COLUMN odd.tbl_posts.likes_count IS '좋아요 수 (비정규화)';
COMMENT ON COLUMN odd.tbl_posts.comments_count IS '댓글 수 (비정규화)';
COMMENT ON COLUMN odd.tbl_posts.bookmarks_count IS '북마크 수 (비정규화)';
COMMENT ON COLUMN odd.tbl_posts.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN odd.tbl_posts.is_deleted IS '삭제 여부 (소프트 삭제)';
COMMENT ON COLUMN odd.tbl_posts.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_posts.updated_at IS '수정일시';







