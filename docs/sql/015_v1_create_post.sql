-- =====================================================
-- odd.v1_create_post: 포스트 생성 함수
-- =====================================================
-- 
-- 현재 로그인한 사용자가 포스트를 생성합니다.
-- 포스트 정보를 입력받아 데이터베이스에 저장합니다.
-- 
-- 사용 위치:
--   - FeedPage에서 포스트 작성 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_create_post', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/015_v1_create_post.sql
-- 
-- =====================================================
-- 1. 포스트 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_post(
    p_type text,
    p_content text,
    p_images jsonb DEFAULT '[]'::jsonb,
    p_link_preview jsonb DEFAULT NULL,
    p_project_id uuid DEFAULT NULL,
    p_milestone_title text DEFAULT NULL,
    p_feature_title text DEFAULT NULL,
    p_source_type text DEFAULT 'direct',
    p_source_id uuid DEFAULT NULL,
    p_source_name text DEFAULT NULL,
    p_source_emoji text DEFAULT NULL
)
RETURNS odd.tbl_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 포스트를 생성합니다.
 *           포스트 정보를 입력받아 데이터베이스에 저장합니다.
 * 
 * 매개변수:
 *   - p_type: 포스트 타입 (필수)
 *             'text', 'project_update', 'milestone', 'feature_accepted' 중 하나
 *   - p_content: 포스트 내용 (필수)
 *   - p_images: 이미지 URL 배열 (선택, 최대 4장)
 *               예: '["url1", "url2"]'::jsonb
 *   - p_link_preview: 링크 프리뷰 정보 (선택)
 *                     예: '{"url": "...", "title": "...", "description": "...", "image": "...", "domain": "..."}'::jsonb
 *   - p_project_id: 연관 프로젝트 ID (선택, project_update, milestone, feature_accepted용)
 *   - p_milestone_title: 마일스톤 제목 (선택, milestone 타입용)
 *   - p_feature_title: 기능 제목 (선택, feature_accepted 타입용)
 *   - p_source_type: 출처 타입 (기본값: 'direct')
 *                    'direct', 'project', 'community' 중 하나
 *   - p_source_id: 출처 ID (선택, 프로젝트 또는 커뮤니티 ID)
 *   - p_source_name: 출처 이름 (선택, 비정규화)
 *   - p_source_emoji: 출처 이모지 (선택, 비정규화)
 * 
 * 반환값:
 *   - 생성된 포스트 레코드 (odd.tbl_posts)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 포스트 생성 가능
 *   - RLS 정책과 함께 작동하여 보안 강화
 *   - author_id는 자동으로 현재 로그인한 사용자로 설정됨
 * 
 * 예시 쿼리:
 *   -- 일반 텍스트 포스트
 *   SELECT * FROM odd.v1_create_post(
 *     'text',
 *     '오늘 드디어 AI 코드 리뷰 도구의 베타 버전을 완성했습니다! 🎉'
 *   );
 * 
 *   -- 프로젝트 업데이트 포스트
 *   SELECT * FROM odd.v1_create_post(
 *     'project_update',
 *     '오픈소스 API 게이트웨이 v2.0을 릴리즈했습니다!',
 *     '[]'::jsonb,
 *     NULL,
 *     'project-uuid-here',
 *     NULL,
 *     NULL,
 *     'project',
 *     'project-uuid-here',
 *     '오픈소스 API 게이트웨이',
 *     '🔌'
 *   );
 * 
 *   -- 마일스톤 달성 포스트
 *   SELECT * FROM odd.v1_create_post(
 *     'milestone',
 *     '첫 번째 마일스톤을 달성했습니다!',
 *     '[]'::jsonb,
 *     NULL,
 *     'project-uuid-here',
 *     'MVP 기능 완성',
 *     NULL,
 *     'project',
 *     'project-uuid-here',
 *     '실시간 협업 화이트보드',
 *     '🎨'
 *   );
 */
DECLARE
    v_post odd.tbl_posts;
    v_auth_id uuid;
    v_user_id bigint;
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
    
    -- 포스트 타입 유효성 검사
    IF p_type NOT IN ('text', 'project_update', 'milestone', 'feature_accepted') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_type;
    END IF;
    
    -- 출처 타입 유효성 검사
    IF p_source_type NOT IN ('direct', 'project', 'community') THEN
        RAISE EXCEPTION '유효하지 않은 출처 타입입니다: %', p_source_type;
    END IF;
    
    -- 이미지 개수 검사 (최대 4장)
    IF jsonb_array_length(COALESCE(p_images, '[]'::jsonb)) > 4 THEN
        RAISE EXCEPTION '이미지는 최대 4장까지 첨부할 수 있습니다';
    END IF;
    
    -- 프로젝트 연관 타입 검사
    IF p_type IN ('project_update', 'milestone', 'feature_accepted') AND p_project_id IS NULL THEN
        RAISE EXCEPTION '프로젝트 연관 타입은 project_id가 필요합니다';
    END IF;
    
    -- 마일스톤 타입 검사
    IF p_type = 'milestone' AND p_milestone_title IS NULL THEN
        RAISE EXCEPTION 'milestone 타입은 milestone_title이 필요합니다';
    END IF;
    
    -- 기능 수락 타입 검사
    IF p_type = 'feature_accepted' AND p_feature_title IS NULL THEN
        RAISE EXCEPTION 'feature_accepted 타입은 feature_title이 필요합니다';
    END IF;
    
    -- 포스트 생성
    INSERT INTO odd.tbl_posts (
        author_id,
        type,
        content,
        images,
        link_preview,
        project_id,
        milestone_title,
        feature_title,
        source_type,
        source_id,
        source_name,
        source_emoji
    ) VALUES (
        v_user_id,
        p_type,
        p_content,
        COALESCE(p_images, '[]'::jsonb),
        p_link_preview,
        p_project_id,
        p_milestone_title,
        p_feature_title,
        p_source_type,
        p_source_id,
        p_source_name,
        p_source_emoji
    )
    RETURNING * INTO v_post;
    
    RETURN v_post;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_post: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_create_post TO authenticated;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_create_post IS '포스트를 생성하는 함수. 현재 로그인한 사용자가 작성자가 됩니다.';








