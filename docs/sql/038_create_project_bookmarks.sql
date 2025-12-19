-- =====================================================
-- 프로젝트 저장(북마크) 테이블 및 함수 생성
-- =====================================================
-- 
-- 사용자가 프로젝트를 저장하는 기능을 제공합니다.
-- - tbl_project_bookmarks: 프로젝트 저장 테이블
-- - v1_toggle_project_bookmark: 프로젝트 저장/해제 토글 함수
-- - v1_fetch_saved_projects: 저장한 프로젝트 목록 조회 함수
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/038_create_project_bookmarks.sql
-- 
-- =====================================================
-- 1. 프로젝트 저장 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_project_bookmarks (
    project_id uuid NOT NULL REFERENCES odd.projects(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- 인덱스: 사용자별 저장한 프로젝트 조회
CREATE INDEX IF NOT EXISTS idx_tbl_project_bookmarks_user_id ON odd.tbl_project_bookmarks(user_id, created_at DESC);

-- 인덱스: 프로젝트별 저장한 사용자 조회
CREATE INDEX IF NOT EXISTS idx_tbl_project_bookmarks_project_id ON odd.tbl_project_bookmarks(project_id);

-- =====================================================
-- 2. RLS (Row Level Security) 정책 설정
-- =====================================================

ALTER TABLE odd.tbl_project_bookmarks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신이 저장한 프로젝트만 조회 가능
CREATE POLICY "Users can read own bookmarks"
    ON odd.tbl_project_bookmarks
    FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 인증된 사용자는 프로젝트를 저장할 수 있음
CREATE POLICY "Authenticated users can bookmark projects"
    ON odd.tbl_project_bookmarks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- 사용자는 자신이 저장한 프로젝트를 삭제할 수 있음
CREATE POLICY "Users can remove bookmarks"
    ON odd.tbl_project_bookmarks
    FOR DELETE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- 3. 권한 부여
-- =====================================================

GRANT SELECT, INSERT, DELETE ON odd.tbl_project_bookmarks TO authenticated;

-- =====================================================
-- 4. 프로젝트 저장/해제 토글 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_toggle_project_bookmark(uuid);

CREATE OR REPLACE FUNCTION odd.v1_toggle_project_bookmark(
    p_project_id uuid
)
RETURNS TABLE (
    is_bookmarked boolean,
    bookmarks_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 프로젝트 저장/해제를 토글합니다.
 *           이미 저장되어 있으면 해제하고, 없으면 저장합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - is_bookmarked: 현재 저장 상태 (true: 저장됨, false: 해제됨)
 *   - bookmarks_count: 프로젝트의 총 저장 수
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 인증된 사용자만 접근 가능
 *   - 현재 로그인한 사용자의 ID를 자동으로 사용
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_bookmarked boolean;
    v_bookmarks_count integer;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;
    
    -- 프로젝트 존재 확인
    IF NOT EXISTS (SELECT 1 FROM odd.projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다';
    END IF;
    
    -- 현재 저장 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_project_bookmarks
        WHERE project_id = p_project_id AND user_id = v_user_id
    ) INTO v_is_bookmarked;
    
    -- 저장/해제 토글
    IF v_is_bookmarked THEN
        -- 저장 해제
        DELETE FROM odd.tbl_project_bookmarks
        WHERE project_id = p_project_id AND user_id = v_user_id;
        v_is_bookmarked := false;
    ELSE
        -- 저장
        INSERT INTO odd.tbl_project_bookmarks (project_id, user_id)
        VALUES (p_project_id, v_user_id)
        ON CONFLICT (project_id, user_id) DO NOTHING;
        v_is_bookmarked := true;
    END IF;
    
    -- 총 저장 수 조회
    SELECT COUNT(*) INTO v_bookmarks_count
    FROM odd.tbl_project_bookmarks
    WHERE project_id = p_project_id;
    
    RETURN QUERY SELECT v_is_bookmarked, v_bookmarks_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_toggle_project_bookmark: %', SQLERRM;
END;
$$;

-- =====================================================
-- 5. 저장한 프로젝트 목록 조회 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_fetch_saved_projects(integer, integer);

CREATE OR REPLACE FUNCTION odd.v1_fetch_saved_projects(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    short_description text,
    full_description text,
    category text,
    tech_stack jsonb,
    thumbnail text,
    gallery_images jsonb,
    repository_url text,
    demo_url text,
    android_store_url text,
    ios_store_url text,
    mac_store_url text,
    author_id bigint,
    likes_count integer,
    comments_count integer,
    backers_count integer,
    current_funding integer,
    target_funding integer,
    days_left integer,
    status text,
    featured boolean,
    created_at timestamptz,
    updated_at timestamptz,
    -- 작성자 정보
    author_username text,
    author_display_name text,
    author_avatar_url text,
    -- 저장 일시
    saved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 현재 사용자가 저장한 프로젝트 목록을 조회합니다.
 *           저장한 순서대로 정렬하여 반환합니다.
 * 
 * 매개변수:
 *   - p_limit: 조회 개수 제한 (기본값: 50, 최대: 100)
 *   - p_offset: 페이지네이션 오프셋 (기본값: 0)
 * 
 * 반환값:
 *   - 저장한 프로젝트 목록 (작성자 정보, 저장 일시 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 인증된 사용자만 접근 가능
 *   - 현재 로그인한 사용자의 저장 목록만 반환
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다';
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자 정보를 찾을 수 없습니다';
    END IF;
    
    -- limit 최대값 제한
    IF p_limit > 100 THEN
        RAISE EXCEPTION 'limit은 최대 100까지 가능합니다';
    END IF;
    
    -- limit 최소값 검사
    IF p_limit < 1 THEN
        RAISE EXCEPTION 'limit은 최소 1 이상이어야 합니다';
    END IF;
    
    -- offset 최소값 검사
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'offset은 0 이상이어야 합니다';
    END IF;
    
    -- 저장한 프로젝트 목록 조회
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.short_description,
        p.full_description,
        p.category,
        p.tech_stack,
        p.thumbnail,
        p.gallery_images,
        p.repository_url,
        p.demo_url,
        p.android_store_url,
        p.ios_store_url,
        p.mac_store_url,
        p.author_id,
        p.likes_count,
        p.comments_count,
        p.backers_count,
        p.current_funding,
        p.target_funding,
        p.days_left,
        p.status,
        p.featured,
        p.created_at,
        p.updated_at,
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url,
        pb.created_at AS saved_at
    FROM odd.tbl_project_bookmarks pb
    INNER JOIN odd.projects p ON pb.project_id = p.id
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE pb.user_id = v_user_id
    ORDER BY pb.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_saved_projects: %', SQLERRM;
END;
$$;

-- =====================================================
-- 6. 프로젝트 저장 상태 확인 함수
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_check_project_bookmark(uuid);

CREATE OR REPLACE FUNCTION odd.v1_check_project_bookmark(
    p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 현재 사용자가 특정 프로젝트를 저장했는지 확인합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - true: 저장됨, false: 저장되지 않음 (인증되지 않은 경우도 false)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 인증되지 않은 사용자는 false 반환
 */
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_is_bookmarked boolean;
BEGIN
    -- 현재 로그인한 사용자 확인
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- auth_id로 사용자 ID 조회
    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- 저장 상태 확인
    SELECT EXISTS (
        SELECT 1 FROM odd.tbl_project_bookmarks
        WHERE project_id = p_project_id AND user_id = v_user_id
    ) INTO v_is_bookmarked;
    
    RETURN COALESCE(v_is_bookmarked, false);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- =====================================================
-- 7. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_toggle_project_bookmark TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_saved_projects TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_check_project_bookmark TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_check_project_bookmark TO anon;

-- =====================================================
-- 8. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_project_bookmarks IS '사용자가 저장한 프로젝트를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_project_bookmarks.project_id IS '프로젝트 ID';
COMMENT ON COLUMN odd.tbl_project_bookmarks.user_id IS '저장한 사용자 ID';
COMMENT ON COLUMN odd.tbl_project_bookmarks.created_at IS '저장 일시';

COMMENT ON FUNCTION odd.v1_toggle_project_bookmark IS '프로젝트 저장/해제를 토글하는 함수. 이미 저장되어 있으면 해제하고, 없으면 저장합니다.';
COMMENT ON FUNCTION odd.v1_fetch_saved_projects IS '현재 사용자가 저장한 프로젝트 목록을 조회하는 함수. 저장한 순서대로 정렬하여 반환합니다.';
COMMENT ON FUNCTION odd.v1_check_project_bookmark IS '현재 사용자가 특정 프로젝트를 저장했는지 확인하는 함수. 인증되지 않은 사용자는 false를 반환합니다.';

