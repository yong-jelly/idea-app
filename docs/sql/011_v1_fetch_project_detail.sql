-- =====================================================
-- odd.v1_fetch_project_detail: 프로젝트 상세 조회 함수
-- =====================================================
-- 
-- 프로젝트 상세 정보를 조회하는 함수입니다.
-- 작성자 정보와 함께 반환합니다.
-- 
-- 사용 위치:
--   - ProjectDetailPage에서 프로젝트 상세 조회 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_fetch_project_detail', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/011_v1_fetch_project_detail.sql
-- 
-- =====================================================
-- 1. 프로젝트 상세 조회 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_fetch_project_detail(
    p_project_id uuid
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
    author_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
STABLE
AS $$
/*
 * 함수 설명: 프로젝트 상세 정보를 조회합니다.
 *           작성자 정보도 함께 반환합니다.
 * 
 * 매개변수:
 *   - p_project_id: 프로젝트 ID (UUID)
 * 
 * 반환값:
 *   - 프로젝트 상세 정보 (작성자 정보 포함)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - 공개 조회이므로 인증 없이도 접근 가능 (RLS 정책에 따라)
 *   - RLS 정책: 모든 사용자가 프로젝트를 읽을 수 있음 (공개)
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_fetch_project_detail(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid
 *   );
 */
DECLARE
    v_project_id uuid;
BEGIN
    -- 프로젝트 ID 유효성 검사
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 ID는 필수입니다';
    END IF;
    
    v_project_id := p_project_id;
    
    -- 프로젝트 상세 조회
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
        -- 작성자 정보
        u.username AS author_username,
        u.display_name AS author_display_name,
        u.avatar_url AS author_avatar_url
    FROM odd.projects p
    INNER JOIN odd.tbl_users u ON p.author_id = u.id
    WHERE p.id = v_project_id
    LIMIT 1;

    -- 프로젝트가 없는 경우
    IF NOT FOUND THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다: %', v_project_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_fetch_project_detail: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 공개 조회이므로 모든 사용자가 접근 가능
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_project_detail(uuid) TO anon;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_fetch_project_detail IS '프로젝트 상세 정보를 조회하는 함수. 작성자 정보도 함께 반환합니다.';

-- =====================================================
-- 4. 테스트 쿼리
-- =====================================================

/*
 * 테스트 쿼리:
 * 
 * -- 프로젝트 상세 조회
 * SELECT * FROM odd.v1_fetch_project_detail(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid
 * );
 */

