-- =====================================================
-- 인터랙션 테이블 생성 (좋아요, 북마크, 멘션)
-- =====================================================
-- 
-- 포스트와 댓글에 대한 인터랙션을 저장하는 테이블들입니다.
-- - tbl_post_likes: 포스트 좋아요
-- - tbl_post_bookmarks: 포스트 북마크
-- - tbl_comment_likes: 댓글 좋아요
-- - tbl_mentions: 멘션 (@username)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/014_create_interactions_tables.sql
-- 
-- =====================================================
-- 1. 포스트 좋아요 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_post_likes (
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- 인덱스: 사용자별 좋아요한 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_likes_user_id ON odd.tbl_post_likes(user_id);

-- 인덱스: 포스트별 좋아요 조회 (created_at 기준)
CREATE INDEX IF NOT EXISTS idx_tbl_post_likes_post_id ON odd.tbl_post_likes(post_id, created_at DESC);

-- =====================================================
-- 2. 포스트 북마크 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_post_bookmarks (
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- 인덱스: 사용자별 북마크한 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_bookmarks_user_id ON odd.tbl_post_bookmarks(user_id, created_at DESC);

-- 인덱스: 포스트별 북마크 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_bookmarks_post_id ON odd.tbl_post_bookmarks(post_id);

-- =====================================================
-- 3. 댓글 좋아요 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_comment_likes (
    comment_id uuid NOT NULL REFERENCES odd.tbl_comments(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (comment_id, user_id)
);

-- 인덱스: 사용자별 좋아요한 댓글 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comment_likes_user_id ON odd.tbl_comment_likes(user_id);

-- 인덱스: 댓글별 좋아요 조회
CREATE INDEX IF NOT EXISTS idx_tbl_comment_likes_comment_id ON odd.tbl_comment_likes(comment_id);

-- =====================================================
-- 4. 멘션 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 멘션 대상 (포스트 또는 댓글)
    post_id uuid REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES odd.tbl_comments(id) ON DELETE CASCADE,
    
    -- 멘션된 사용자
    mentioned_user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 멘션한 사용자
    mentioner_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 읽음 여부 (알림용)
    is_read boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 하나의 컨텍스트만 가져야 함
    CONSTRAINT chk_mention_context CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- 인덱스: 멘션된 사용자별 조회 (알림용)
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_mentioned_user ON odd.tbl_mentions(mentioned_user_id, created_at DESC);

-- 인덱스: 읽지 않은 멘션만 조회
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_unread ON odd.tbl_mentions(mentioned_user_id) WHERE is_read = false;

-- 인덱스: 포스트별 멘션 조회
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_post_id ON odd.tbl_mentions(post_id) WHERE post_id IS NOT NULL;

-- 인덱스: 댓글별 멘션 조회
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_comment_id ON odd.tbl_mentions(comment_id) WHERE comment_id IS NOT NULL;

-- =====================================================
-- 5. 좋아요 카운트 동기화 트리거 (포스트)
-- =====================================================

-- 포스트 좋아요 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION odd.increment_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_post_likes ON odd.tbl_post_likes;
CREATE TRIGGER trigger_increment_post_likes
    AFTER INSERT ON odd.tbl_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_post_likes_count();

-- 포스트 좋아요 삭제 시 카운트 감소
CREATE OR REPLACE FUNCTION odd.decrement_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_likes ON odd.tbl_post_likes;
CREATE TRIGGER trigger_decrement_post_likes
    AFTER DELETE ON odd.tbl_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_post_likes_count();

-- =====================================================
-- 6. 북마크 카운트 동기화 트리거
-- =====================================================

-- 포스트 북마크 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION odd.increment_post_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET bookmarks_count = bookmarks_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_post_bookmarks ON odd.tbl_post_bookmarks;
CREATE TRIGGER trigger_increment_post_bookmarks
    AFTER INSERT ON odd.tbl_post_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_post_bookmarks_count();

-- 포스트 북마크 삭제 시 카운트 감소
CREATE OR REPLACE FUNCTION odd.decrement_post_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_posts
    SET bookmarks_count = GREATEST(bookmarks_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_bookmarks ON odd.tbl_post_bookmarks;
CREATE TRIGGER trigger_decrement_post_bookmarks
    AFTER DELETE ON odd.tbl_post_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_post_bookmarks_count();

-- =====================================================
-- 7. 댓글 좋아요 카운트 동기화 트리거
-- =====================================================

-- 댓글 좋아요 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION odd.increment_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_comment_likes ON odd.tbl_comment_likes;
CREATE TRIGGER trigger_increment_comment_likes
    AFTER INSERT ON odd.tbl_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_comment_likes_count();

-- 댓글 좋아요 삭제 시 카운트 감소
CREATE OR REPLACE FUNCTION odd.decrement_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_comment_likes ON odd.tbl_comment_likes;
CREATE TRIGGER trigger_decrement_comment_likes
    AFTER DELETE ON odd.tbl_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_comment_likes_count();

-- =====================================================
-- 8. RLS (Row Level Security) 정책 설정
-- =====================================================

-- 포스트 좋아요 RLS
ALTER TABLE odd.tbl_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post likes"
    ON odd.tbl_post_likes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can like posts"
    ON odd.tbl_post_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can unlike posts"
    ON odd.tbl_post_likes
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 포스트 북마크 RLS
ALTER TABLE odd.tbl_post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
    ON odd.tbl_post_bookmarks
    FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can bookmark posts"
    ON odd.tbl_post_bookmarks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove bookmarks"
    ON odd.tbl_post_bookmarks
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 댓글 좋아요 RLS
ALTER TABLE odd.tbl_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes"
    ON odd.tbl_comment_likes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can like comments"
    ON odd.tbl_comment_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can unlike comments"
    ON odd.tbl_comment_likes
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 멘션 RLS
ALTER TABLE odd.tbl_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mentions"
    ON odd.tbl_mentions
    FOR SELECT
    TO authenticated
    USING (
        mentioned_user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
        OR
        mentioner_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create mentions"
    ON odd.tbl_mentions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        mentioner_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own mentions"
    ON odd.tbl_mentions
    FOR UPDATE
    TO authenticated
    USING (
        mentioned_user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        mentioned_user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 9. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_post_likes TO authenticated;

GRANT SELECT, INSERT, DELETE ON odd.tbl_post_bookmarks TO authenticated;

GRANT SELECT ON odd.tbl_comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_comment_likes TO authenticated;

GRANT SELECT, INSERT, UPDATE ON odd.tbl_mentions TO authenticated;

-- =====================================================
-- 10. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_post_likes IS '포스트 좋아요를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_post_likes.post_id IS '포스트 ID';
COMMENT ON COLUMN odd.tbl_post_likes.user_id IS '좋아요한 사용자 ID';
COMMENT ON COLUMN odd.tbl_post_likes.created_at IS '좋아요 일시';

COMMENT ON TABLE odd.tbl_post_bookmarks IS '포스트 북마크를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_post_bookmarks.post_id IS '포스트 ID';
COMMENT ON COLUMN odd.tbl_post_bookmarks.user_id IS '북마크한 사용자 ID';
COMMENT ON COLUMN odd.tbl_post_bookmarks.created_at IS '북마크 일시';

COMMENT ON TABLE odd.tbl_comment_likes IS '댓글 좋아요를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_comment_likes.comment_id IS '댓글 ID';
COMMENT ON COLUMN odd.tbl_comment_likes.user_id IS '좋아요한 사용자 ID';
COMMENT ON COLUMN odd.tbl_comment_likes.created_at IS '좋아요 일시';

COMMENT ON TABLE odd.tbl_mentions IS '멘션(@username)을 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_mentions.id IS '멘션 고유 ID';
COMMENT ON COLUMN odd.tbl_mentions.post_id IS '멘션이 포함된 포스트 ID';
COMMENT ON COLUMN odd.tbl_mentions.comment_id IS '멘션이 포함된 댓글 ID';
COMMENT ON COLUMN odd.tbl_mentions.mentioned_user_id IS '멘션된 사용자 ID';
COMMENT ON COLUMN odd.tbl_mentions.mentioner_id IS '멘션한 사용자 ID';
COMMENT ON COLUMN odd.tbl_mentions.is_read IS '읽음 여부 (알림용)';
COMMENT ON COLUMN odd.tbl_mentions.created_at IS '생성일시';


