-- =====================================================
-- 댓글 테이블 생성
-- =====================================================
-- 
-- 포스트에 대한 댓글을 저장하는 테이블입니다.
-- 최대 3 depth까지 중첩된 답글을 지원합니다 (depth 0, 1, 2).
-- 
-- 사용 위치:
--   - PostDetailPage에서 댓글 목록 표시
--   - CommentThread 컴포넌트에서 댓글 CRUD
--   - 프론트엔드: supabase.schema('odd').rpc('v1_create_comment', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/013_create_comments_table.sql
-- 
-- =====================================================
-- 1. 댓글 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES odd.tbl_comments(id) ON DELETE CASCADE,
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 콘텐츠
    content text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,  -- 이미지 URL 배열 (최대 1장)
    link_preview jsonb,  -- {url, title, description, image, domain}
    
    -- 댓글 구조
    depth smallint DEFAULT 0 NOT NULL CHECK (depth >= 0 AND depth <= 2),
    
    -- 통계 (비정규화)
    likes_count integer DEFAULT 0 NOT NULL,
    
    -- 상태
    is_deleted boolean DEFAULT false,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

-- 포스트별 댓글 조회 (생성일 기준)
CREATE INDEX IF NOT EXISTS idx_tbl_comments_post_id ON odd.tbl_comments(post_id, created_at);

-- 부모 댓글별 답글 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comments_parent_id ON odd.tbl_comments(parent_id) WHERE parent_id IS NOT NULL;

-- 작성자별 댓글 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comments_author_id ON odd.tbl_comments(author_id);

-- 활성 댓글만 조회 (부분 인덱스)
CREATE INDEX IF NOT EXISTS idx_tbl_comments_active ON odd.tbl_comments(post_id, created_at) WHERE is_deleted = false;

-- 댓글 depth별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comments_depth ON odd.tbl_comments(post_id, depth);

-- =====================================================
-- 3. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_comments_updated_at ON odd.tbl_comments;
CREATE TRIGGER trigger_tbl_comments_updated_at
    BEFORE UPDATE ON odd.tbl_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_comments_updated_at();

-- =====================================================
-- 4. 댓글 수 동기화 트리거
-- =====================================================

-- 댓글 생성 시 포스트의 comments_count 증가
CREATE OR REPLACE FUNCTION odd.increment_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_post_comments ON odd.tbl_comments;
CREATE TRIGGER trigger_increment_post_comments
    AFTER INSERT ON odd.tbl_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_post_comments_count();

-- 댓글 삭제 시 포스트의 comments_count 감소 (실제 삭제인 경우)
CREATE OR REPLACE FUNCTION odd.decrement_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_comments ON odd.tbl_comments;
CREATE TRIGGER trigger_decrement_post_comments
    AFTER DELETE ON odd.tbl_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_post_comments_count();

-- 댓글 소프트 삭제 시 포스트의 comments_count 감소 (is_deleted가 false에서 true로 변경될 때)
CREATE OR REPLACE FUNCTION odd.decrement_post_comments_count_on_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- is_deleted가 false에서 true로 변경될 때만 카운트 감소
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
        UPDATE odd.tbl_posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_comments_on_soft_delete ON odd.tbl_comments;
CREATE TRIGGER trigger_decrement_post_comments_on_soft_delete
    AFTER UPDATE ON odd.tbl_comments
    FOR EACH ROW
    WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
    EXECUTE FUNCTION odd.decrement_post_comments_count_on_soft_delete();

-- =====================================================
-- 5. depth 자동 계산 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.set_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.depth := 0;
    ELSE
        SELECT LEAST(depth + 1, 2) INTO NEW.depth
        FROM odd.tbl_comments
        WHERE id = NEW.parent_id;
        
        -- 부모가 없으면 depth 0으로 설정
        IF NEW.depth IS NULL THEN
            NEW.depth := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_comment_depth ON odd.tbl_comments;
CREATE TRIGGER trigger_set_comment_depth
    BEFORE INSERT ON odd.tbl_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.set_comment_depth();

-- =====================================================
-- 6. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 삭제되지 않은 댓글을 읽을 수 있음
-- (삭제된 댓글도 구조 유지를 위해 읽을 수 있지만, 내용은 프론트엔드에서 마스킹)
CREATE POLICY "Anyone can read comments"
    ON odd.tbl_comments
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 댓글을 생성할 수 있음
CREATE POLICY "Authenticated users can create comments"
    ON odd.tbl_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 작성자만 자신의 댓글을 수정할 수 있음
CREATE POLICY "Users can update own comments"
    ON odd.tbl_comments
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

-- 작성자만 자신의 댓글을 삭제할 수 있음
CREATE POLICY "Users can delete own comments"
    ON odd.tbl_comments
    FOR DELETE
    TO authenticated
    USING (
        author_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 7. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_comments TO authenticated;

-- =====================================================
-- 8. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_comments IS '포스트 댓글을 저장하는 테이블 (최대 3 depth)';
COMMENT ON COLUMN odd.tbl_comments.id IS '댓글 고유 ID (UUID)';
COMMENT ON COLUMN odd.tbl_comments.post_id IS '포스트 ID (tbl_posts.id 참조)';
COMMENT ON COLUMN odd.tbl_comments.parent_id IS '부모 댓글 ID (답글인 경우)';
COMMENT ON COLUMN odd.tbl_comments.author_id IS '작성자 ID (tbl_users.id 참조)';
COMMENT ON COLUMN odd.tbl_comments.content IS '댓글 내용';
COMMENT ON COLUMN odd.tbl_comments.images IS '첨부 이미지 URL 배열 (최대 1장)';
COMMENT ON COLUMN odd.tbl_comments.link_preview IS '링크 프리뷰 정보 JSON {url, title, description, image, domain}';
COMMENT ON COLUMN odd.tbl_comments.depth IS '댓글 depth (0: 원댓글, 1: 대댓글, 2: 대대댓글)';
COMMENT ON COLUMN odd.tbl_comments.likes_count IS '좋아요 수 (비정규화)';
COMMENT ON COLUMN odd.tbl_comments.is_deleted IS '삭제 여부 (소프트 삭제, 하위 답글 유지)';
COMMENT ON COLUMN odd.tbl_comments.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_comments.updated_at IS '수정일시';

