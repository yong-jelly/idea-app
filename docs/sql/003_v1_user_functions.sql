-- =====================================================
-- 003_v1_user_functions.sql
-- 사용자 관련 핵심 함수
-- =====================================================

-- 1. 현재 사용자 ID 가져오기 함수 (bigint)
-- Supabase의 auth.uid() (UUID) 대신 내부 PK인 id (bigint)를 반환합니다.
CREATE OR REPLACE FUNCTION odd.get_current_user_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
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

-- 2. username으로 사용자 정보 조회 함수
CREATE OR REPLACE FUNCTION odd.v1_get_user_by_username(p_username text)
RETURNS odd.tbl_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: username으로 사용자 프로필을 조회합니다.
 * 
 * 매개변수:
 *   - p_username: 조회할 사용자의 username
 * 
 * 반환값:
 *   - 사용자 레코드 (odd.tbl_users) 또는 NULL
 */
DECLARE
    v_user odd.tbl_users;
BEGIN
    SELECT * INTO v_user
    FROM odd.tbl_users
    WHERE username = p_username
    AND is_active = true;

    RETURN v_user;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_get_user_by_username: %', SQLERRM;
END;
$$;

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION odd.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_get_user_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION odd.v1_get_user_by_username(text) TO anon;

-- 4. 코멘트 추가
COMMENT ON FUNCTION odd.get_current_user_id IS '현재 로그인한 사용자의 고유 ID(bigint)를 반환하는 함수';
COMMENT ON FUNCTION odd.v1_get_user_by_username IS 'username을 사용하여 활성화된 사용자 정보를 조회하는 함수';
