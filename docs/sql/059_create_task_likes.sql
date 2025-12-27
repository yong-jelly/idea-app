-- =====================================================
-- 태스크 좋아요 테이블 및 함수 생성
-- =====================================================
-- 
-- 태스크에 대한 좋아요 기능을 추가합니다.
-- - tbl_task_likes: 태스크 좋아요 테이블
-- - tbl_tasks.likes_count: 좋아요 수 컬럼 추가
-- - 좋아요 카운트 자동 업데이트 트리거
-- - v1_toggle_task_like: 태스크 좋아요 토글 함수
-- - v1_fetch_tasks: 좋아요 정보 포함하도록 수정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/059_create_task_likes.sql
-- 
-- =====================================================
-- 1. 태스크 테이블에 likes_count 컬럼 추가
-- =====================================================

ALTER TABLE odd.tbl_tasks 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0 NOT NULL;

-- 인덱스: 좋아요 수 기준 정렬
CREATE INDEX IF NOT EXISTS idx_tbl_tasks_likes_count ON odd.tbl_tasks(likes_count DESC);

-- =====================================================
-- 2. 태스크 좋아요 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_task_likes (
    task_id uuid NOT NULL REFERENCES odd.tbl_tasks(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

-- 인덱스: 사용자별 좋아요한 태스크 조회
CREATE INDEX IF NOT EXISTS idx_tbl_task_likes_user_id ON odd.tbl_task_likes(user_id);

-- 인덱스: 태스크별 좋아요 조회 (created_at 기준)
CREATE INDEX IF NOT EXISTS idx_tbl_task_likes_task_id ON odd.tbl_task_likes(task_id, created_at DESC);

-- =====================================================
-- 3. 좋아요 카운트 자동 업데이트 트리거
-- =====================================================

-- 좋아요 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION odd.increment_task_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_tasks
    SET likes_count = likes_count + 1
    WHERE id = NEW.task_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_task_likes ON odd.tbl_task_likes;
CREATE TRIGGER trigger_increment_task_likes
    AFTER INSERT ON odd.tbl_task_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.increment_task_likes_count();

-- 좋아요 제거 시 카운트 감소
CREATE OR REPLACE FUNCTION odd.decrement_task_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odd.tbl_tasks
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.task_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_task_likes ON odd.tbl_task_likes;
CREATE TRIGGER trigger_decrement_task_likes
    AFTER DELETE ON odd.tbl_task_likes
    FOR EACH ROW
    EXECUTE FUNCTION odd.decrement_task_likes_count();

-- =====================================================
-- 4. 태스크 좋아요 토글 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_toggle_task_like(
    p_task_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 태스크에 좋아요를 토글합니다.
 *           좋아요가 없으면 추가하고, 있으면 제거합니다.
 *           트리거를 통해 자동으로 likes_count가 동기화됩니다.
 * 
 * 매개변수:
 *   - p_task_id: 태스크 ID (필수)
 * 
 * 반환값:
 *   - JSON 객체: {"is_liked": boolean, "likes_count": integer}
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 좋아요 가능
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
    
    -- 태스크 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.tbl_tasks WHERE id = p_task_id) THEN
        RAISE EXCEPTION '태스크를 찾을 수 없습니다';
    END IF;
    
    -- 좋아요 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_task_likes
        WHERE task_id = p_task_id AND user_id = v_user_id
    ) INTO v_is_liked;
    
    -- 좋아요 토글
    IF v_is_liked THEN
        -- 좋아요 제거
        DELETE FROM odd.tbl_task_likes
        WHERE task_id = p_task_id AND user_id = v_user_id;
    ELSE
        -- 좋아요 추가
        INSERT INTO odd.tbl_task_likes (task_id, user_id)
        VALUES (p_task_id, v_user_id)
        ON CONFLICT (task_id, user_id) DO NOTHING;
    END IF;
    
    -- 업데이트된 좋아요 수 조회
    SELECT likes_count INTO v_likes_count
    FROM odd.tbl_tasks
    WHERE id = p_task_id;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'is_liked', NOT v_is_liked,
        'likes_count', v_likes_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_task_like: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 기존 v1_fetch_tasks 함수 삭제 (반환 타입 변경을 위해)
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_tasks(uuid, text, integer, integer);

-- =====================================================
-- 6. v1_fetch_tasks 함수 수정 (좋아요 정보 포함)
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_tasks(
    p_milestone_id uuid,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    milestone_id uuid,
    author_id bigint,
    title text,
    description text,
    due_date date,
    status text,
    created_at timestamptz,
    updated_at timestamptz,
    completed_at timestamptz,
    likes_count integer,
    is_liked boolean,
    liked_users jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 마일스톤의 태스크 목록을 조회합니다.
 *           좋아요 정보를 포함합니다.
 * 
 * 매개변수:
 *   - p_milestone_id: 마일스톤 ID (필수)
 *   - p_status: 상태 필터 (NULL이면 전체)
 *   - p_limit: 조회 개수 제한 (기본값: 100, 최대: 200)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 태스크 목록 (정렬: todo 우선, 그 다음 최신순)
 *   - likes_count: 좋아요 수
 *   - is_liked: 현재 사용자가 좋아요했는지 여부
 *   - liked_users: 좋아요한 유저 목록 (최대 5명, JSON 배열)
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_status_filter text;
BEGIN
    -- 현재 로그인한 사용자 확인 (선택적)
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NOT NULL THEN
        SELECT u.id INTO v_user_id
        FROM odd.tbl_users u
        WHERE u.auth_id = v_auth_id;
    END IF;
    
    -- 상태 필터 처리
    IF p_status IS NULL OR p_status = 'all' THEN
        v_status_filter := NULL;
    ELSIF p_status IN ('todo', 'done') THEN
        v_status_filter := p_status;
    ELSE
        RAISE EXCEPTION '유효하지 않은 상태입니다: %', p_status;
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 200 THEN
        RAISE EXCEPTION 'limit은 최대 200까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 태스크 조회 쿼리 (좋아요 정보 포함)
    RETURN QUERY
    SELECT 
        t.id,
        t.milestone_id,
        t.author_id,
        t.title,
        t.description,
        t.due_date,
        t.status,
        t.created_at,
        t.updated_at,
        t.completed_at,
        COALESCE(t.likes_count, 0),
        -- 현재 사용자가 좋아요했는지 여부
        CASE WHEN v_user_id IS NOT NULL THEN
            EXISTS (
                SELECT 1 FROM odd.tbl_task_likes tl_check
                WHERE tl_check.task_id = t.id AND tl_check.user_id = v_user_id
            )
        ELSE false END,
        -- 좋아요한 유저 목록 (최대 5명)
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', u_liked.id::text,
                        'username', u_liked.username,
                        'displayName', u_liked.display_name,
                        'avatar', u_liked.avatar_url
                    )
                    ORDER BY tl_liked.created_at ASC
                )
                FROM odd.tbl_task_likes tl_liked
                INNER JOIN odd.tbl_users u_liked ON u_liked.id = tl_liked.user_id
                WHERE tl_liked.task_id = t.id
                LIMIT 5
            ),
            '[]'::jsonb
        )
    FROM odd.tbl_tasks t
    WHERE 
        t.milestone_id = p_milestone_id
        -- 상태 필터
        AND (v_status_filter IS NULL OR t.status = v_status_filter)
    ORDER BY 
        -- todo 태스크 우선
        CASE WHEN t.status = 'todo' THEN 0 ELSE 1 END,
        -- 그 다음 최신순 정렬
        t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_tasks: %', SQLERRM;
END;
$$;

-- =====================================================
-- 8. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_task_likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Anyone can read task likes" ON odd.tbl_task_likes;
DROP POLICY IF EXISTS "Authenticated users can like tasks" ON odd.tbl_task_likes;
DROP POLICY IF EXISTS "Users can unlike tasks" ON odd.tbl_task_likes;

-- 모든 사용자가 태스크 좋아요를 읽을 수 있음 (공개)
CREATE POLICY "Anyone can read task likes"
    ON odd.tbl_task_likes
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 태스크 좋아요를 추가할 수 있음
CREATE POLICY "Authenticated users can like tasks"
    ON odd.tbl_task_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 사용자는 자신의 좋아요만 제거할 수 있음
CREATE POLICY "Users can unlike tasks"
    ON odd.tbl_task_likes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM odd.tbl_users u
            WHERE u.id = user_id AND u.auth_id = auth.uid()
        )
    );

-- =====================================================
-- 9. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_task_likes TO anon;
GRANT SELECT, INSERT, DELETE ON odd.tbl_task_likes TO authenticated;

GRANT EXECUTE ON FUNCTION odd.v1_toggle_task_like TO authenticated;

-- =====================================================
-- 10. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_task_likes IS '태스크 좋아요를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_task_likes.task_id IS '태스크 ID';
COMMENT ON COLUMN odd.tbl_task_likes.user_id IS '좋아요한 사용자 ID';
COMMENT ON COLUMN odd.tbl_task_likes.created_at IS '좋아요 일시';

COMMENT ON COLUMN odd.tbl_tasks.likes_count IS '좋아요 수 (비정규화)';

COMMENT ON FUNCTION odd.v1_toggle_task_like IS '태스크에 좋아요를 토글하는 함수. 트리거를 통해 자동으로 likes_count가 동기화됩니다.';

