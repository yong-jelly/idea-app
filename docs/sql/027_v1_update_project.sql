-- =====================================================
-- odd.v1_update_project: 프로젝트 수정 함수
-- =====================================================
-- 
-- 현재 로그인한 사용자가 자신의 프로젝트를 수정합니다.
-- 프로젝트 정보를 업데이트하고 updated_at을 자동으로 갱신합니다.
-- 
-- 사용 위치:
--   - EditProjectPage에서 프로젝트 수정 시 호출
--   - 프론트엔드: supabase.schema('odd').rpc('v1_update_project', {...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/027_v1_update_project.sql
-- 
-- =====================================================
-- 1. 프로젝트 수정 함수
-- =====================================================

-- 프로젝트 수정 함수
CREATE OR REPLACE FUNCTION odd.v1_update_project(
    p_project_id uuid,
    p_title text DEFAULT NULL,
    p_short_description text DEFAULT NULL,
    p_full_description text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_tech_stack jsonb DEFAULT NULL,
    p_thumbnail text DEFAULT NULL,
    p_gallery_images jsonb DEFAULT NULL,
    p_repository_url text DEFAULT NULL,
    p_demo_url text DEFAULT NULL,
    p_android_store_url text DEFAULT NULL,
    p_ios_store_url text DEFAULT NULL,
    p_mac_store_url text DEFAULT NULL
)
RETURNS odd.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자가 자신의 프로젝트를 수정합니다.
 *           프로젝트 정보를 업데이트하고 updated_at을 자동으로 갱신합니다.
 * 
 * 매개변수:
 *   - p_project_id: 수정할 프로젝트 ID (필수)
 *   - p_title: 프로젝트 제목 (선택, NULL이면 업데이트하지 않음)
 *   - p_short_description: 프로젝트 짧은 설명 (선택)
 *   - p_full_description: 프로젝트 상세 설명 (선택)
 *   - p_category: 프로젝트 카테고리 (선택)
 *                 'game', 'web', 'mobile', 'tool', 'opensource', 'ai' 중 하나
 *   - p_tech_stack: 사용한 기술 스택 (JSON 배열, 선택)
 *                   예: '["React", "TypeScript", "Node.js"]'::jsonb
 *   - p_thumbnail: 프로젝트 썸네일 이미지 경로 (선택)
 *   - p_gallery_images: 갤러리 이미지 경로 배열 (JSON 배열, 선택)
 *   - p_repository_url: 저장소 URL (선택)
 *   - p_demo_url: 데모 URL (선택)
 *   - p_android_store_url: Google Play Store URL (선택)
 *   - p_ios_store_url: App Store (iOS) URL (선택)
 *   - p_mac_store_url: Mac App Store URL (선택)
 * 
 * 반환값:
 *   - 수정된 프로젝트 레코드 (odd.projects)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 프로젝트 수정 가능
 *   - 프로젝트 작성자만 수정 가능 (author_id 확인)
 *   - RLS 정책과 함께 작동하여 보안 강화
 *   - updated_at은 트리거에 의해 자동으로 갱신됨
 * 
 * 예시 쿼리:
 *   -- 제목과 설명만 수정
 *   SELECT * FROM odd.v1_update_project(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid,
 *     '수정된 프로젝트 제목',
 *     '수정된 짧은 설명'
 *   );
 * 
 *   -- 모든 필드 수정
 *   SELECT * FROM odd.v1_update_project(
 *     '123e4567-e89b-12d3-a456-426614174000'::uuid,
 *     '수정된 제목',
 *     '수정된 짧은 설명',
 *     '수정된 상세 설명',
 *     'web',
 *     '["Next.js", "TypeScript"]'::jsonb,
 *     'user-id/images/projects/project-id/thumbnail-123.jpg',
 *     '["path/to/image1.jpg", "path/to/image2.jpg"]'::jsonb,
 *     'https://github.com/username/repo',
 *     'https://demo.example.com',
 *     'https://play.google.com/store/apps/details?id=...',
 *     'https://apps.apple.com/app/id...',
 *     'https://apps.apple.com/mac/app/...'
 *   );
 */
DECLARE
    v_project odd.projects;
    v_auth_id uuid;
    v_user_id bigint;
    v_update_data jsonb := '{}'::jsonb;
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
    
    -- 프로젝트 존재 및 소유자 확인
    SELECT * INTO v_project
    FROM odd.projects
    WHERE id = p_project_id AND author_id = v_user_id;
    
    IF v_project IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없거나 수정할 권한이 없습니다';
    END IF;
    
    -- 카테고리 유효성 검사 (제공된 경우)
    IF p_category IS NOT NULL AND p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RAISE EXCEPTION '유효하지 않은 카테고리입니다: %', p_category;
    END IF;
    
    -- 업데이트할 필드만 JSONB 객체에 추가
    IF p_title IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('title', p_title);
    END IF;
    
    IF p_short_description IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('short_description', p_short_description);
    END IF;
    
    IF p_full_description IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('full_description', p_full_description);
    END IF;
    
    IF p_category IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('category', p_category);
    END IF;
    
    IF p_tech_stack IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('tech_stack', p_tech_stack);
    END IF;
    
    IF p_thumbnail IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('thumbnail', p_thumbnail);
    END IF;
    
    IF p_gallery_images IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('gallery_images', p_gallery_images);
    END IF;
    
    IF p_repository_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('repository_url', p_repository_url);
    END IF;
    
    IF p_demo_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('demo_url', p_demo_url);
    END IF;
    
    IF p_android_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('android_store_url', p_android_store_url);
    END IF;
    
    IF p_ios_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('ios_store_url', p_ios_store_url);
    END IF;
    
    IF p_mac_store_url IS NOT NULL THEN
        v_update_data := v_update_data || jsonb_build_object('mac_store_url', p_mac_store_url);
    END IF;
    
    -- 업데이트할 필드가 없으면 에러
    IF v_update_data = '{}'::jsonb THEN
        RAISE EXCEPTION '수정할 필드가 없습니다';
    END IF;
    
    -- 프로젝트 업데이트
    -- updated_at은 트리거에 의해 자동으로 갱신됨
    UPDATE odd.projects
    SET
        title = COALESCE((v_update_data->>'title')::text, title),
        short_description = COALESCE((v_update_data->>'short_description')::text, short_description),
        full_description = COALESCE((v_update_data->>'full_description')::text, full_description),
        category = COALESCE((v_update_data->>'category')::text, category),
        tech_stack = COALESCE((v_update_data->>'tech_stack')::jsonb, tech_stack),
        thumbnail = COALESCE((v_update_data->>'thumbnail')::text, thumbnail),
        gallery_images = COALESCE((v_update_data->>'gallery_images')::jsonb, gallery_images),
        repository_url = COALESCE((v_update_data->>'repository_url')::text, repository_url),
        demo_url = COALESCE((v_update_data->>'demo_url')::text, demo_url),
        android_store_url = COALESCE((v_update_data->>'android_store_url')::text, android_store_url),
        ios_store_url = COALESCE((v_update_data->>'ios_store_url')::text, ios_store_url),
        mac_store_url = COALESCE((v_update_data->>'mac_store_url')::text, mac_store_url)
    WHERE id = p_project_id AND author_id = v_user_id
    RETURNING * INTO v_project;
    
    RETURN v_project;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_project: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_update_project TO authenticated;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_update_project IS '프로젝트를 수정하는 함수. 현재 로그인한 사용자가 작성자인 경우에만 수정 가능합니다. updated_at은 트리거에 의해 자동으로 갱신됩니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * 프로젝트 수정 방법:
 * 
 * 1. 함수 사용 (권장):
 *    SELECT * FROM odd.v1_update_project(
 *      p_project_id := '123e4567-e89b-12d3-a456-426614174000'::uuid,
 *      p_title := '수정된 제목',
 *      p_short_description := '수정된 설명'
 *    );
 * 
 * 2. 직접 UPDATE (프론트엔드에서 주로 사용):
 *    UPDATE odd.projects
 *    SET title = '수정된 제목', updated_at = now()
 *    WHERE id = '...' AND author_id = ...;
 * 
 * updated_at 자동 갱신:
 *   - 트리거 trigger_projects_updated_at에 의해 자동으로 갱신됨
 *   - 함수에서 명시적으로 updated_at을 설정할 필요 없음
 * 
 * tech_stack JSON 형식:
 *   - 배열: '["React", "TypeScript", "Node.js"]'::jsonb
 *   - 빈 배열: '[]'::jsonb
 * 
 * gallery_images JSON 형식:
 *   - 배열: '["path/to/image1.jpg", "path/to/image2.jpg"]'::jsonb
 *   - 빈 배열: '[]'::jsonb
 * 
 * NULL 값 처리:
 *   - 매개변수가 NULL이면 해당 필드는 업데이트하지 않음
 *   - 빈 문자열('')을 전달하면 NULL로 저장됨
 */

