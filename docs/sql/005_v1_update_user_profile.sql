-- odd.v1_update_user_profile: 사용자 프로필 업데이트 함수

-- links 컬럼 추가 (이미 추가된 경우 무시)
ALTER TABLE odd.tbl_users 
ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '{}'::jsonb;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_tbl_users_links ON odd.tbl_users USING gin(links);

-- 프로필 업데이트 함수
CREATE OR REPLACE FUNCTION odd.v1_update_user_profile(
    p_display_name text DEFAULT NULL,
    p_bio text DEFAULT NULL,
    p_links jsonb DEFAULT NULL
)
RETURNS odd.tbl_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 현재 로그인한 사용자의 프로필 정보를 업데이트합니다.
 *           display_name, bio, links를 업데이트할 수 있습니다.
 * 
 * 매개변수:
 *   - p_display_name: 표시 이름 (NULL이면 업데이트하지 않음)
 *   - p_bio: 자기소개 (NULL이면 업데이트하지 않음)
 *   - p_links: 링크 정보 JSON (NULL이면 업데이트하지 않음)
 *              형식: {"website": "https://example.com", "github": "username", "twitter": "username"}
 * 
 * 반환값:
 *   - 업데이트된 사용자 레코드 (odd.tbl_users)
 * 
 * 예시 쿼리:
 *   SELECT * FROM odd.v1_update_user_profile(
 *     '홍길동',
 *     '풀스택 개발자입니다',
 *     '{"website": "https://example.com", "github": "username", "twitter": "username"}'::jsonb
 *   );
 */
DECLARE
    v_user odd.tbl_users;
    v_auth_id uuid;
    v_bio_value text;
BEGIN
    -- 현재 사용자 auth_id 가져오기
    v_auth_id := auth.uid();
    
    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: 로그인이 필요합니다';
    END IF;

    -- 사용자 존재 확인
    SELECT * INTO v_user
    FROM odd.tbl_users
    WHERE auth_id = v_auth_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: 사용자를 찾을 수 없습니다';
    END IF;

    -- bio 처리: p_bio가 NULL이 아니면 처리 (빈 문자열은 NULL로)
    IF p_bio IS NOT NULL THEN
        IF trim(p_bio) = '' THEN
            v_bio_value := NULL;
        ELSE
            v_bio_value := trim(p_bio);
        END IF;
    END IF;

    -- 프로필 업데이트
    UPDATE odd.tbl_users
    SET 
        display_name = COALESCE(p_display_name, display_name),
        bio = CASE 
            WHEN p_bio IS NOT NULL THEN v_bio_value
            ELSE bio
        END,
        links = COALESCE(p_links, links),
        updated_at = now()
    WHERE auth_id = v_auth_id
    RETURNING * INTO v_user;

    RETURN v_user;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_user_profile: %', SQLERRM;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION odd.v1_update_user_profile(text, text, jsonb) TO authenticated;

