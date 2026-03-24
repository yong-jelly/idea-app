-- =====================================================
-- 블로그: 게시글·댓글 테이블 (odd.blog_posts, odd.blog_comments)
-- =====================================================
-- 피드(tbl_posts)와 분리된 Markdown 블로그 전용 도메인입니다.
-- 실행: psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/070_create_blog_tables.sql
-- 이후: docs/sql/071_v1_blog_functions.sql
-- =====================================================

-- ------------------------------------------------------------
-- 1. blog_posts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS odd.blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    -- 선택 참고 URL(외부 원문 등). 앱 UI에서 목록/상세에 표시
    link_url text,
    content_md text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    comments_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    is_deleted boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_blog_posts_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON odd.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON odd.blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON odd.blog_posts(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON odd.blog_posts(published_at DESC NULLS LAST)
    WHERE status = 'published' AND is_deleted = false;

CREATE OR REPLACE FUNCTION odd.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON odd.blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON odd.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_blog_posts_updated_at();

ALTER TABLE odd.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
    ON odd.blog_posts
    FOR SELECT
    TO public
    USING (is_deleted = false AND (status = 'published' OR author_id IN (
        SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
    )));

CREATE POLICY "Authenticated users can insert blog posts"
    ON odd.blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can update own blog posts"
    ON odd.blog_posts
    FOR UPDATE
    TO authenticated
    USING (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can delete own blog posts"
    ON odd.blog_posts
    FOR DELETE
    TO authenticated
    USING (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

GRANT SELECT ON odd.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.blog_posts TO authenticated;

-- ------------------------------------------------------------
-- 2. blog_comments (피드 댓글과 분리)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS odd.blog_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id uuid NOT NULL REFERENCES odd.blog_posts(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES odd.blog_comments(id) ON DELETE CASCADE,
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    content text NOT NULL,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    depth smallint NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
    likes_count integer NOT NULL DEFAULT 0,
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON odd.blog_comments(blog_post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON odd.blog_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_comments_author ON odd.blog_comments(author_id);

CREATE OR REPLACE FUNCTION odd.update_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_comments_updated_at ON odd.blog_comments;
CREATE TRIGGER trigger_blog_comments_updated_at
    BEFORE UPDATE ON odd.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_blog_comments_updated_at();

CREATE OR REPLACE FUNCTION odd.increment_blog_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.blog_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.blog_post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inc_blog_post_comments ON odd.blog_comments;
CREATE TRIGGER trigger_inc_blog_post_comments
    AFTER INSERT ON odd.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_blog_post_comments_count();

CREATE OR REPLACE FUNCTION odd.decrement_blog_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.blog_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.blog_post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dec_blog_post_comments_del ON odd.blog_comments;
CREATE TRIGGER trigger_dec_blog_post_comments_del
    AFTER DELETE ON odd.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_blog_post_comments_count();

CREATE OR REPLACE FUNCTION odd.decrement_blog_post_comments_soft()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
        UPDATE odd.blog_posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = NEW.blog_post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dec_blog_post_comments_soft ON odd.blog_comments;
CREATE TRIGGER trigger_dec_blog_post_comments_soft
    AFTER UPDATE ON odd.blog_comments
    FOR EACH ROW
    WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
    EXECUTE FUNCTION odd.decrement_blog_post_comments_soft();

CREATE OR REPLACE FUNCTION odd.set_blog_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.depth := 0;
    ELSE
        SELECT LEAST(depth + 1, 2) INTO NEW.depth
        FROM odd.blog_comments
        WHERE id = NEW.parent_id;
        IF NEW.depth IS NULL THEN
            NEW.depth := 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_blog_comment_depth ON odd.blog_comments;
CREATE TRIGGER trigger_set_blog_comment_depth
    BEFORE INSERT ON odd.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION odd.set_blog_comment_depth();

ALTER TABLE odd.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog comments"
    ON odd.blog_comments
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create blog comments"
    ON odd.blog_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can update own blog comments"
    ON odd.blog_comments
    FOR UPDATE
    TO authenticated
    USING (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can delete own blog comments"
    ON odd.blog_comments
    FOR DELETE
    TO authenticated
    USING (
        author_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

GRANT SELECT ON odd.blog_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.blog_comments TO authenticated;

-- ------------------------------------------------------------
-- 3. blog_comment_likes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS odd.blog_comment_likes (
    comment_id uuid NOT NULL REFERENCES odd.blog_comments(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user ON odd.blog_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment ON odd.blog_comment_likes(comment_id);

CREATE OR REPLACE FUNCTION odd.increment_blog_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.blog_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inc_blog_comment_likes ON odd.blog_comment_likes;
CREATE TRIGGER trigger_inc_blog_comment_likes
    AFTER INSERT ON odd.blog_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_blog_comment_likes_count();

CREATE OR REPLACE FUNCTION odd.decrement_blog_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.blog_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dec_blog_comment_likes ON odd.blog_comment_likes;
CREATE TRIGGER trigger_dec_blog_comment_likes
    AFTER DELETE ON odd.blog_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_blog_comment_likes_count();

ALTER TABLE odd.blog_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog comment likes"
    ON odd.blog_comment_likes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can toggle blog comment likes"
    ON odd.blog_comment_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can delete own blog comment likes"
    ON odd.blog_comment_likes
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

GRANT SELECT ON odd.blog_comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.blog_comment_likes TO authenticated;

COMMENT ON TABLE odd.blog_posts IS 'Markdown 블로그 게시글';
COMMENT ON TABLE odd.blog_comments IS '블로그 게시글 댓글';
COMMENT ON TABLE odd.blog_comment_likes IS '블로그 댓글 좋아요';
