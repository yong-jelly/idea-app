-- =====================================================
-- 커뮤니티 공지 및 피드백 시스템 테이블 생성
-- =====================================================
-- 
-- 프로젝트 커뮤니티의 공지사항, 업데이트, 투표, 피드백을 관리하는 테이블들입니다.
-- 
-- 사용 위치:
--   - DevFeedTab: 공지사항/업데이트/투표 포스트 관리
--   - FeedbackTab: 피드백 관리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/023_create_community_tables.sql
-- 
-- =====================================================
-- 1. 공지사항/업데이트/투표 포스트 파생 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_post_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    
    -- 포스트 정보
    title text NOT NULL,  -- 제목
    post_type text NOT NULL CHECK (post_type IN ('announcement', 'update', 'vote')),  -- 포스트 타입
    
    -- 상태
    is_pinned boolean DEFAULT false NOT NULL,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- 하나의 포스트는 하나의 announcement만 가질 수 있음
    UNIQUE(post_id)
);

-- 인덱스: 포스트 ID로 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_announcements_post_id ON odd.tbl_post_announcements(post_id);

-- 인덱스: 포스트 타입별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_announcements_type ON odd.tbl_post_announcements(post_type);

-- 인덱스: 고정된 포스트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_announcements_pinned ON odd.tbl_post_announcements(is_pinned) WHERE is_pinned = true;

-- =====================================================
-- 2. 투표 옵션 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_post_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    
    -- 옵션 정보
    option_text text NOT NULL,  -- 옵션 텍스트 (최대 50자)
    sort_order integer NOT NULL DEFAULT 0,  -- 정렬 순서
    
    -- 통계 (비정규화)
    votes_count integer DEFAULT 0 NOT NULL,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스: 포스트별 투표 옵션 조회 (정렬 순서 기준)
CREATE INDEX IF NOT EXISTS idx_tbl_post_votes_post_id ON odd.tbl_post_votes(post_id, sort_order);

-- =====================================================
-- 3. 투표 응답 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_post_vote_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    vote_option_id uuid NOT NULL REFERENCES odd.tbl_post_votes(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 한 사용자는 한 포스트에 하나의 투표만 가능
    UNIQUE(post_id, user_id)
);

-- 인덱스: 포스트별 투표 응답 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_vote_responses_post_id ON odd.tbl_post_vote_responses(post_id);

-- 인덱스: 옵션별 투표 응답 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_vote_responses_option_id ON odd.tbl_post_vote_responses(vote_option_id);

-- 인덱스: 사용자별 투표 조회
CREATE INDEX IF NOT EXISTS idx_tbl_post_vote_responses_user_id ON odd.tbl_post_vote_responses(user_id);

-- =====================================================
-- 4. 피드백 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_feedbacks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES odd.tbl_posts(id) ON DELETE CASCADE,
    
    -- 피드백 정보
    title text NOT NULL,  -- 제목
    feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'improvement', 'question')),  -- 피드백 타입
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),  -- 상태
    priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),  -- 우선순위
    
    -- 담당자 및 답변
    assignee_id bigint REFERENCES odd.tbl_users(id) ON DELETE SET NULL,  -- 담당자
    developer_response text,  -- 개발팀 공식 답변
    
    -- 상태
    is_pinned boolean DEFAULT false NOT NULL,
    
    -- 통계 (비정규화)
    votes_count integer DEFAULT 0 NOT NULL,
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- 하나의 포스트는 하나의 피드백만 가질 수 있음
    UNIQUE(post_id)
);

-- 인덱스: 포스트 ID로 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_post_id ON odd.tbl_feedbacks(post_id);

-- 인덱스: 피드백 타입별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_type ON odd.tbl_feedbacks(feedback_type);

-- 인덱스: 상태별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_status ON odd.tbl_feedbacks(status);

-- 인덱스: 우선순위별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_priority ON odd.tbl_feedbacks(priority) WHERE priority IS NOT NULL;

-- 인덱스: 담당자별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_assignee ON odd.tbl_feedbacks(assignee_id) WHERE assignee_id IS NOT NULL;

-- 인덱스: 고정된 피드백 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_pinned ON odd.tbl_feedbacks(is_pinned) WHERE is_pinned = true;

-- 인덱스: 투표수 정렬 (인기순)
CREATE INDEX IF NOT EXISTS idx_tbl_feedbacks_votes ON odd.tbl_feedbacks(votes_count DESC);

-- =====================================================
-- 5. 피드백 투표 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_feedback_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id uuid NOT NULL REFERENCES odd.tbl_feedbacks(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 한 사용자는 한 피드백에 하나의 투표만 가능
    UNIQUE(feedback_id, user_id)
);

-- 인덱스: 피드백별 투표 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedback_votes_feedback_id ON odd.tbl_feedback_votes(feedback_id);

-- 인덱스: 사용자별 투표 조회
CREATE INDEX IF NOT EXISTS idx_tbl_feedback_votes_user_id ON odd.tbl_feedback_votes(user_id);

-- =====================================================
-- 6. updated_at 자동 업데이트 트리거
-- =====================================================

-- post_announcements
CREATE OR REPLACE FUNCTION odd.update_tbl_post_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_post_announcements_updated_at ON odd.tbl_post_announcements;
CREATE TRIGGER trigger_tbl_post_announcements_updated_at
    BEFORE UPDATE ON odd.tbl_post_announcements
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_post_announcements_updated_at();

-- post_votes
CREATE OR REPLACE FUNCTION odd.update_tbl_post_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_post_votes_updated_at ON odd.tbl_post_votes;
CREATE TRIGGER trigger_tbl_post_votes_updated_at
    BEFORE UPDATE ON odd.tbl_post_votes
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_post_votes_updated_at();

-- feedbacks
CREATE OR REPLACE FUNCTION odd.update_tbl_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_feedbacks_updated_at ON odd.tbl_feedbacks;
CREATE TRIGGER trigger_tbl_feedbacks_updated_at
    BEFORE UPDATE ON odd.tbl_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_feedbacks_updated_at();

-- =====================================================
-- 7. 투표 카운트 동기화 트리거
-- =====================================================

-- 투표 응답 추가 시 옵션의 votes_count 증가
CREATE OR REPLACE FUNCTION odd.increment_post_vote_option_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_post_votes
    SET votes_count = votes_count + 1
    WHERE id = NEW.vote_option_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_post_vote_option_count ON odd.tbl_post_vote_responses;
CREATE TRIGGER trigger_increment_post_vote_option_count
    AFTER INSERT ON odd.tbl_post_vote_responses
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_post_vote_option_count();

-- 투표 응답 삭제 시 옵션의 votes_count 감소
CREATE OR REPLACE FUNCTION odd.decrement_post_vote_option_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_post_votes
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.vote_option_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_post_vote_option_count ON odd.tbl_post_vote_responses;
CREATE TRIGGER trigger_decrement_post_vote_option_count
    AFTER DELETE ON odd.tbl_post_vote_responses
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_post_vote_option_count();

-- 피드백 투표 추가 시 피드백의 votes_count 증가
CREATE OR REPLACE FUNCTION odd.increment_feedback_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_feedbacks
    SET votes_count = votes_count + 1
    WHERE id = NEW.feedback_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_feedback_votes_count ON odd.tbl_feedback_votes;
CREATE TRIGGER trigger_increment_feedback_votes_count
    AFTER INSERT ON odd.tbl_feedback_votes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_feedback_votes_count();

-- 피드백 투표 삭제 시 피드백의 votes_count 감소
CREATE OR REPLACE FUNCTION odd.decrement_feedback_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_feedbacks
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.feedback_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_feedback_votes_count ON odd.tbl_feedback_votes;
CREATE TRIGGER trigger_decrement_feedback_votes_count
    AFTER DELETE ON odd.tbl_feedback_votes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_feedback_votes_count();

-- =====================================================
-- 8. RLS (Row Level Security) 정책 설정
-- =====================================================

-- post_announcements RLS
ALTER TABLE odd.tbl_post_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post announcements"
    ON odd.tbl_post_announcements
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create post announcements"
    ON odd.tbl_post_announcements
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

CREATE POLICY "Users can update own post announcements"
    ON odd.tbl_post_announcements
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- post_votes RLS
ALTER TABLE odd.tbl_post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post votes"
    ON odd.tbl_post_votes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create post votes"
    ON odd.tbl_post_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

CREATE POLICY "Users can update own post votes"
    ON odd.tbl_post_votes
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- post_vote_responses RLS
ALTER TABLE odd.tbl_post_vote_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post vote responses"
    ON odd.tbl_post_vote_responses
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create vote responses"
    ON odd.tbl_post_vote_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own vote responses"
    ON odd.tbl_post_vote_responses
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- feedbacks RLS
ALTER TABLE odd.tbl_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedbacks"
    ON odd.tbl_feedbacks
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create feedbacks"
    ON odd.tbl_feedbacks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

CREATE POLICY "Users can update own feedbacks"
    ON odd.tbl_feedbacks
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- feedback_votes RLS
ALTER TABLE odd.tbl_feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback votes"
    ON odd.tbl_feedback_votes
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create feedback votes"
    ON odd.tbl_feedback_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own feedback votes"
    ON odd.tbl_feedback_votes
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 9. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_post_announcements TO anon;
GRANT SELECT, INSERT, UPDATE ON odd.tbl_post_announcements TO authenticated;

GRANT SELECT ON odd.tbl_post_votes TO anon;
GRANT SELECT, INSERT, UPDATE ON odd.tbl_post_votes TO authenticated;

GRANT SELECT ON odd.tbl_post_vote_responses TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_post_vote_responses TO authenticated;

GRANT SELECT ON odd.tbl_feedbacks TO anon;
GRANT SELECT, INSERT, UPDATE ON odd.tbl_feedbacks TO authenticated;

GRANT SELECT ON odd.tbl_feedback_votes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_feedback_votes TO authenticated;

-- =====================================================
-- 10. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_post_announcements IS '공지사항/업데이트/투표 포스트의 추가 정보를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_post_announcements.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_post_announcements.post_id IS '포스트 ID (tbl_posts.id 참조)';
COMMENT ON COLUMN odd.tbl_post_announcements.title IS '제목';
COMMENT ON COLUMN odd.tbl_post_announcements.post_type IS '포스트 타입 (announcement, update, vote)';
COMMENT ON COLUMN odd.tbl_post_announcements.is_pinned IS '상단 고정 여부';

COMMENT ON TABLE odd.tbl_post_votes IS '투표 포스트의 옵션을 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_post_votes.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_post_votes.post_id IS '포스트 ID (tbl_posts.id 참조)';
COMMENT ON COLUMN odd.tbl_post_votes.option_text IS '옵션 텍스트';
COMMENT ON COLUMN odd.tbl_post_votes.sort_order IS '정렬 순서';
COMMENT ON COLUMN odd.tbl_post_votes.votes_count IS '투표 수 (비정규화)';

COMMENT ON TABLE odd.tbl_post_vote_responses IS '사용자의 투표 응답을 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_post_vote_responses.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_post_vote_responses.post_id IS '포스트 ID (tbl_posts.id 참조)';
COMMENT ON COLUMN odd.tbl_post_vote_responses.vote_option_id IS '투표 옵션 ID (tbl_post_votes.id 참조)';
COMMENT ON COLUMN odd.tbl_post_vote_responses.user_id IS '투표한 사용자 ID (tbl_users.id 참조)';

COMMENT ON TABLE odd.tbl_feedbacks IS '피드백을 저장하는 테이블 (post와 1:1 관계)';
COMMENT ON COLUMN odd.tbl_feedbacks.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_feedbacks.post_id IS '포스트 ID (tbl_posts.id 참조)';
COMMENT ON COLUMN odd.tbl_feedbacks.title IS '제목';
COMMENT ON COLUMN odd.tbl_feedbacks.feedback_type IS '피드백 타입 (bug, feature, improvement, question)';
COMMENT ON COLUMN odd.tbl_feedbacks.status IS '상태 (open, in_progress, resolved, closed)';
COMMENT ON COLUMN odd.tbl_feedbacks.priority IS '우선순위 (low, medium, high, critical)';
COMMENT ON COLUMN odd.tbl_feedbacks.assignee_id IS '담당자 ID (tbl_users.id 참조)';
COMMENT ON COLUMN odd.tbl_feedbacks.developer_response IS '개발팀 공식 답변';
COMMENT ON COLUMN odd.tbl_feedbacks.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN odd.tbl_feedbacks.votes_count IS '투표 수 (비정규화)';

COMMENT ON TABLE odd.tbl_feedback_votes IS '피드백 투표를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_feedback_votes.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_feedback_votes.feedback_id IS '피드백 ID (tbl_feedbacks.id 참조)';
COMMENT ON COLUMN odd.tbl_feedback_votes.user_id IS '투표한 사용자 ID (tbl_users.id 참조)';

