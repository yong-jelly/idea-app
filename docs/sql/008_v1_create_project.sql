-- =====================================================
-- odd.v1_create_project: 프로젝트 생성 함수
-- =====================================================
-- 
-- 현재 로그인한 사용자가 프로젝트를 생성합니다.
-- 프로젝트 정보를 입력받아 데이터베이스에 저장합니다.
-- 
-- 사용 위치:
--   - CreateProjectPage에서 프로젝트 생성 시 호출 (선택사항)
--   - 프론트엔드: supabase.schema('odd').rpc('v1_create_project', {...})
--   - 또는 직접 INSERT 사용 가능: supabase.from('projects').insert({...})
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/008_v1_create_project.sql
-- 
-- =====================================================
-- 1. 프로젝트 생성 함수
-- =====================================================

-- 프로젝트 생성 함수 (프론트엔드에서 직접 INSERT 사용 가능하므로 선택사항)
CREATE OR REPLACE FUNCTION odd.v1_create_project(
    p_title text,
    p_short_description text,
    p_category text,
    p_full_description text DEFAULT NULL,
    p_tech_stack jsonb DEFAULT '[]'::jsonb,
    p_thumbnail text DEFAULT NULL,
    p_gallery_images jsonb DEFAULT '[]'::jsonb,
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
 * 함수 설명: 현재 로그인한 사용자가 프로젝트를 생성합니다.
 *           프로젝트 정보를 입력받아 데이터베이스에 저장합니다.
 * 
 * 매개변수:
 *   - p_title: 프로젝트 제목 (필수)
 *   - p_short_description: 프로젝트 짧은 설명 (필수)
 *   - p_full_description: 프로젝트 상세 설명 (선택)
 *   - p_category: 프로젝트 카테고리 (필수)
 *                 'game', 'web', 'mobile', 'tool', 'opensource', 'ai' 중 하나
 *   - p_tech_stack: 사용한 기술 스택 (JSON 배열, 선택)
 *                   예: '["React", "TypeScript", "Node.js"]'::jsonb
 *   - p_thumbnail: 프로젝트 썸네일 이미지 경로 (선택)
 *                  형식: {userId}/images/projects/{projectId}/thumbnail-{timestamp}.{ext}
 *   - p_gallery_images: 갤러리 이미지 경로 배열 (JSON 배열, 선택)
 *                       예: '["path/to/image1.jpg", "path/to/image2.jpg"]'::jsonb
 *   - p_repository_url: 저장소 URL (선택, 예: GitHub)
 *   - p_demo_url: 데모 URL (선택)
 *   - p_android_store_url: Google Play Store URL (선택)
 *   - p_ios_store_url: App Store (iOS) URL (선택)
 *   - p_mac_store_url: Mac App Store URL (선택)
 * 
 * 반환값:
 *   - 생성된 프로젝트 레코드 (odd.projects)
 * 
 * 보안:
 *   - SECURITY DEFINER: 함수 소유자 권한으로 실행
 *   - auth.uid()로 현재 로그인한 사용자만 프로젝트 생성 가능
 *   - RLS 정책과 함께 작동하여 보안 강화
 *   - author_id는 자동으로 현재 로그인한 사용자로 설정됨
 * 
 * 예시 쿼리:
 *   -- 기본 프로젝트 생성
 *   SELECT * FROM odd.v1_create_project(
 *     'AI 코드 리뷰 도구',
 *     '머신러닝을 활용한 자동 코드 리뷰 도구',
 *     '상세 설명...',
 *     'ai',
 *     '["Python", "TensorFlow", "React"]'::jsonb
 *   );
 * 
 *   -- 모든 필드 포함
 *   SELECT * FROM odd.v1_create_project(
 *     '실시간 협업 화이트보드',
 *     '개발팀을 위한 실시간 협업 화이트보드',
 *     '상세 설명...',
 *     'web',
 *     '["Next.js", "Socket.io", "MongoDB"]'::jsonb,
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
    
    -- 카테고리 유효성 검사
    IF p_category NOT IN ('game', 'web', 'mobile', 'tool', 'opensource', 'ai') THEN
        RAISE EXCEPTION '유효하지 않은 카테고리입니다: %', p_category;
    END IF;
    
    -- 프로젝트 생성
    INSERT INTO odd.projects (
        title,
        short_description,
        full_description,
        category,
        tech_stack,
        thumbnail,
        gallery_images,
        repository_url,
        demo_url,
        android_store_url,
        ios_store_url,
        mac_store_url,
        author_id
    ) VALUES (
        p_title,
        p_short_description,
        p_full_description,
        p_category,
        p_tech_stack,
        p_thumbnail,
        p_gallery_images,
        p_repository_url,
        p_demo_url,
        p_android_store_url,
        p_ios_store_url,
        p_mac_store_url,
        v_user_id
    )
    RETURNING * INTO v_project;
    
    RETURN v_project;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_project: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 권한 부여
-- =====================================================

-- 인증된 사용자만 실행 가능
GRANT EXECUTE ON FUNCTION odd.v1_create_project TO authenticated;

-- =====================================================
-- 3. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_create_project IS '프로젝트를 생성하는 함수. 현재 로그인한 사용자가 작성자가 됩니다.';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * 프로젝트 생성 방법:
 * 
 * 1. 함수 사용 (권장):
 *    SELECT * FROM odd.v1_create_project(...);
 * 
 * 2. 직접 INSERT (프론트엔드에서 주로 사용):
 *    INSERT INTO odd.projects (title, short_description, category, author_id, ...)
 *    VALUES (...);
 * 
 * 이미지 업로드:
 *   - 프로젝트 생성 후 projectId를 받아서 이미지를 업로드
 *   - 업로드된 이미지 경로를 프로젝트에 업데이트
 *   - Storage 경로 형식: {userId}/images/projects/{projectId}/thumbnail-{timestamp}.{ext}
 * 
 * tech_stack JSON 형식:
 *   - 배열: '["React", "TypeScript", "Node.js"]'::jsonb
 *   - 빈 배열: '[]'::jsonb
 * 
 * gallery_images JSON 형식:
 *   - 배열: '["path/to/image1.jpg", "path/to/image2.jpg"]'::jsonb
 *   - 빈 배열: '[]'::jsonb
 */

