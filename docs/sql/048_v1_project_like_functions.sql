-- =====================================================
-- 프로젝트 좋아요 테이블 및 함수 생성
-- =====================================================
-- 
-- 프로젝트에 대한 좋아요 기능을 제공합니다.
-- - tbl_project_likes: 프로젝트 좋아요 테이블
-- - v1_toggle_project_like: 프로젝트 좋아요 토글 함수
-- - 트리거를 통해 자동으로 likes_count가 동기화됩니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/048_v1_project_like_functions.sql
-- 
-- =====================================================
-- 1. 프로젝트 좋아요 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_project_likes (
    project_id uuid NOT NULL REFERENCES odd.projects(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- 인덱스: 사용자별 좋아요한 프로젝트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_project_likes_user_id ON odd.tbl_project_likes(user_id, created_at DESC);

-- 인덱스: 프로젝트별 좋아요 조회 (created_at 기준)
CREATE INDEX IF NOT EXISTS idx_tbl_project_likes_project_id ON odd.tbl_project_likes(project_id, created_at DESC);

-- =====================================================
-- 2. 좋아요 카운트 증가 트리거 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.increment_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.projects
    SET likes_count = likes_count + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_project_likes ON odd.tbl_project_likes;
CREATE TRIGGER trigger_increment_project_likes
    AFTER INSERT ON odd.tbl_project_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_project_likes_count();

-- =====================================================
-- 3. 좋아요 카운트 감소 트리거 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.decrement_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.projects
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.project_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_project_likes ON odd.tbl_project_likes;
CREATE TRIGGER trigger_decrement_project_likes
    AFTER DELETE ON odd.tbl_project_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_project_likes_count();

-- =====================================================
-- 4. 프로젝트 좋아요 토글 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_toggle_project_like(uuid);

CREATE OR REPLACE FUNCTION odd.v1_toggle_project_like(
    p_project_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 프로젝트에 좋아요를 토글합니다.
 *           좋아요가 없으면 추가하고, 있으면 제거합니다.
 *           트리거를 통해 자동으로 likes_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (필수)
 * 
 * 반환값:
 *   - JSON 객체: {"is_liked": boolean, "likes_count": integer}
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 좋아요 가능
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_toggle_project_like('project-uuid-here');
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_liked boolean;
    v_likes_count integer;
BEGIN
    -- 현재 로그인한 사용자 auth_id 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT id INTO v_user_id
    FROM odd.tbl_users
    WHERE auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;
    
    -- 좋아요 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_project_likes
        WHERE project_id = p_project_id AND user_id = v_user_id
    ) INTO v_is_liked;
    
    -- 좋아요 토글
    IF v_is_liked THEN
        -- 좋아요 제거
        DELETE FROM odd.tbl_project_likes
        WHERE project_id = p_project_id AND user_id = v_user_id;
    ELSE
        -- 좋아요 추가
        INSERT INTO odd.tbl_project_likes (project_id, user_id)
        VALUES (p_project_id, v_user_id)
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    
    -- 업데이트된 좋아요 수 조회
    SELECT likes_count INTO v_likes_count
    FROM odd.projects
    WHERE id = p_project_id;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'is_liked', NOT v_is_liked,
        'likes_count', v_likes_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_project_like: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. RLS (Row Level Security) 정책 설정
-- =====================================================

ALTER TABLE odd.tbl_project_likes ENABLE ROW LEVEL SECURITY;

-- 누구나 좋아요 목록 조회 가능
CREATE POLICY "Anyone can read project likes"
    ON odd.tbl_project_likes
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자는 프로젝트에 좋아요 가능
CREATE POLICY "Authenticated users can like projects"
    ON odd.tbl_project_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 사용자는 자신이 좋아요한 프로젝트의 좋아요를 취소할 수 있음
CREATE POLICY "Users can unlike projects"
    ON odd.tbl_project_likes
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 6. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_project_likes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_project_likes TO authenticated;

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_toggle_project_like TO authenticated;

-- =====================================================
-- 7. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_project_likes IS '프로젝트 좋아요를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_project_likes.project_id IS '프로젝트 ID';
COMMENT ON COLUMN odd.tbl_project_likes.user_id IS '좋아요한 사용자 ID';
COMMENT ON COLUMN odd.tbl_project_likes.created_at IS '좋아요 일시';

COMMENT ON FUNCTION odd.v1_toggle_project_like IS '프로젝트에 좋아요를 토글하는 함수. 트리거를 통해 자동으로 likes_count가 동기화됩니다.';

