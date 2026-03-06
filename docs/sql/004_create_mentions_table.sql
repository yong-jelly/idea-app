-- =====================================================
-- 004_create_mentions_table.sql
-- 멘션 테이블 생성
-- =====================================================

-- 1. 멘션 테이블 생성
CREATE TABLE IF NOT EXISTS odd.tbl_mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES odd.tbl_comments(id) ON DELETE CASCADE,
    mentioned_user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    mentioner_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 포스트 멘션이거나 댓글 멘션이어야 함
    CONSTRAINT chk_mention_context CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_mentioned_user ON odd.tbl_mentions(mentioned_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_unread ON odd.tbl_mentions(mentioned_user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_post_id ON odd.tbl_mentions(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tbl_mentions_comment_id ON odd.tbl_mentions(comment_id) WHERE comment_id IS NOT NULL;

-- 3. RLS 정책 설정
ALTER TABLE odd.tbl_mentions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 멘션된 정보나 자신이 멘션한 정보를 읽을 수 있음
CREATE POLICY "Users can read own mentions" ON odd.tbl_mentions
    FOR SELECT TO authenticated
    USING (
        mentioned_user_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()) OR
        mentioner_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

-- 인증된 사용자만 멘션 생성 가능
CREATE POLICY "Authenticated users can create mentions" ON odd.tbl_mentions
    FOR INSERT TO authenticated
    WITH CHECK (
        mentioner_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid())
    );

-- 멘션된 사용자만 읽음 상태 업데이트 가능
CREATE POLICY "Users can update own mentions" ON odd.tbl_mentions
    FOR UPDATE TO authenticated
    USING (mentioned_user_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()))
    WITH CHECK (mentioned_user_id IN (SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()));

-- 4. 권한 부여
GRANT SELECT, INSERT, UPDATE ON odd.tbl_mentions TO authenticated;

-- 5. 코멘트 추가
COMMENT ON TABLE odd.tbl_mentions IS '사용자 멘션 정보를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_mentions.post_id IS '멘션이 발생한 포스트 ID';
COMMENT ON COLUMN odd.tbl_mentions.comment_id IS '멘션이 발생한 댓글 ID';
COMMENT ON COLUMN odd.tbl_mentions.mentioned_user_id IS '멘션된 사용자 ID';
COMMENT ON COLUMN odd.tbl_mentions.mentioner_id IS '멘션을 작성한 사용자 ID';
COMMENT ON COLUMN odd.tbl_mentions.is_read IS '멘션 확인 여부';
