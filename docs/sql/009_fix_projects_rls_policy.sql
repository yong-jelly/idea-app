-- =====================================================
-- 프로젝트 테이블 RLS 정책 수정
-- =====================================================
-- 
-- 403 Forbidden 에러 해결을 위한 RLS 정책 수정
-- 
-- 문제: RLS 정책의 서브쿼리가 실패하여 INSERT가 거부될 수 있음
-- 해결: RLS 정책을 더 견고하게 수정하고, SECURITY DEFINER 함수 사용
-- 
-- 참고: supabase-config 규칙에 따라 스키마 권한도 확인/설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/009_fix_projects_rls_policy.sql
-- 
-- =====================================================

-- =====================================================
-- 0. 스키마 권한 확인 및 설정 (규칙 준수)
-- =====================================================

-- 스키마 권한 부여 (이미 부여되어 있어도 안전하게 재실행)
GRANT ALL ON SCHEMA odd TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA odd TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA odd TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA odd TO authenticated, anon;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can create projects" ON odd.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON odd.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON odd.projects;

-- =====================================================
-- 1. 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회)
-- =====================================================

-- 현재 사용자의 user_id를 반환하는 함수
-- SECURITY DEFINER로 실행하여 RLS 정책을 우회
CREATE OR REPLACE FUNCTION odd.get_current_user_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, pg_temp
STABLE
AS $$
DECLARE
    v_user_id bigint;
BEGIN
    -- auth.uid()가 NULL이면 NULL 반환
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT id INTO v_user_id
    FROM odd.tbl_users
    WHERE auth_id = auth.uid()
    LIMIT 1;
    
    RETURN v_user_id;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION odd.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION odd.get_current_user_id() TO anon;

-- =====================================================
-- 2. RLS 정책 재생성 (헬퍼 함수 사용)
-- =====================================================

-- 인증된 사용자만 프로젝트를 생성할 수 있음
-- author_id가 현재 로그인한 사용자의 user_id와 일치해야 함
CREATE POLICY "Authenticated users can create projects"
    ON odd.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        odd.get_current_user_id() IS NOT NULL AND
        author_id = odd.get_current_user_id()
    );

-- 작성자만 자신의 프로젝트를 수정할 수 있음
CREATE POLICY "Users can update own projects"
    ON odd.projects
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND
        odd.get_current_user_id() IS NOT NULL AND
        author_id = odd.get_current_user_id()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        odd.get_current_user_id() IS NOT NULL AND
        author_id = odd.get_current_user_id()
    );

-- 작성자만 자신의 프로젝트를 삭제할 수 있음
CREATE POLICY "Users can delete own projects"
    ON odd.projects
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND
        odd.get_current_user_id() IS NOT NULL AND
        author_id = odd.get_current_user_id()
    );

-- =====================================================
-- 3. 정책 확인
-- =====================================================

-- 생성된 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'odd' 
  AND tablename = 'projects'
ORDER BY policyname;

-- 함수 확인
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'odd'
  AND routine_name = 'get_current_user_id';

