-- =====================================================
-- 프로젝트 생성 시 Bot을 통한 피드 자동 생성
-- =====================================================
-- 
-- 프로젝트가 생성될 때 시스템 Bot이 자동으로 피드를 생성합니다.
-- 트리거를 사용하여 프로젝트 생성 후 자동으로 피드가 생성됩니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/035_v1_create_project_with_feed.sql
-- 
-- =====================================================
-- 1. 프로젝트 생성 후 피드 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.v1_create_project_feed(
    p_project_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 함수 설명: 프로젝트 생성 후 Bot을 통해 피드를 자동 생성합니다.
 *           시스템 Bot 계정(@system_project_bot)이 작성자가 됩니다.
 * 
 * 매개변수:
 *   - p_project_id: 생성된 프로젝트 ID (필수)
 * 
 * 반환값:
 *   - 생성된 피드 ID (UUID)
 */
DECLARE
    v_bot_id bigint;
    v_project_title text;
    v_project_description text;
    v_project_thumbnail text;
    v_project_author_id bigint;
    v_feed_id uuid;
    v_feed_content text;
BEGIN
    -- 시스템 Bot 계정 조회
    SELECT id INTO v_bot_id
    FROM odd.tbl_users
    WHERE username = 'system_project_bot' AND user_type = 'bot'
    LIMIT 1;
    
    IF v_bot_id IS NULL THEN
        RAISE EXCEPTION '시스템 Bot 계정을 찾을 수 없습니다. Bot 시스템을 먼저 구축해주세요.';
    END IF;
    
    -- 프로젝트 정보 조회
    SELECT 
        title,
        short_description,
        thumbnail,
        author_id
    INTO 
        v_project_title,
        v_project_description,
        v_project_thumbnail,
        v_project_author_id
    FROM odd.projects
    WHERE id = p_project_id;
    
    IF v_project_title IS NULL THEN
        RAISE EXCEPTION '프로젝트를 찾을 수 없습니다: %', p_project_id;
    END IF;
    
    -- 피드 내용 생성
    v_feed_content := format('새로운 프로젝트 "%s"가 생성되었습니다!', v_project_title);
    
    IF v_project_description IS NOT NULL AND length(v_project_description) > 0 THEN
        v_feed_content := v_feed_content || E'\n\n' || v_project_description;
    END IF;
    
    -- 프로젝트 생성 피드 생성
    INSERT INTO odd.tbl_posts (
        author_id,
        type,
        content,
        images,
        project_id,
        source_type,
        source_id,
        source_name,
        source_emoji,
        is_pinned,
        likes_count,
        comments_count,
        bookmarks_count
    ) VALUES (
        v_bot_id,
        'project_created',
        v_feed_content,
        CASE 
            WHEN v_project_thumbnail IS NOT NULL THEN 
                jsonb_build_array(v_project_thumbnail)
            ELSE 
                '[]'::jsonb
        END,
        p_project_id,
        'project',
        p_project_id,
        v_project_title,
        '🚀',
        false,
        0,
        0,
        0
    )
    RETURNING id INTO v_feed_id;
    
    RETURN v_feed_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_create_project_feed: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. 프로젝트 생성 트리거 함수
-- =====================================================

CREATE OR REPLACE FUNCTION odd.trigger_create_project_feed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
/*
 * 트리거 함수: 프로젝트 생성 후 자동으로 피드를 생성합니다.
 */
DECLARE
    v_feed_id uuid;
BEGIN
    -- Bot을 통한 피드 생성
    SELECT odd.v1_create_project_feed(NEW.id) INTO v_feed_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러가 발생해도 프로젝트 생성은 계속 진행
        RAISE WARNING '프로젝트 피드 생성 실패: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- =====================================================
-- 3. 트리거 생성
-- =====================================================

-- 기존 트리거가 있으면 제거
DROP TRIGGER IF EXISTS trigger_after_project_created ON odd.projects;

-- 프로젝트 생성 후 트리거 생성
CREATE TRIGGER trigger_after_project_created
    AFTER INSERT ON odd.projects
    FOR EACH ROW
    EXECUTE FUNCTION odd.trigger_create_project_feed();

-- =====================================================
-- 4. 권한 부여
-- =====================================================

GRANT EXECUTE ON FUNCTION odd.v1_create_project_feed TO authenticated;
GRANT EXECUTE ON FUNCTION odd.trigger_create_project_feed TO authenticated;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON FUNCTION odd.v1_create_project_feed IS '프로젝트 생성 후 Bot을 통해 피드를 자동 생성하는 함수. 시스템 Bot이 작성자가 됩니다.';
COMMENT ON FUNCTION odd.trigger_create_project_feed IS '프로젝트 생성 후 자동으로 피드를 생성하는 트리거 함수.';
COMMENT ON TRIGGER trigger_after_project_created ON odd.projects IS '프로젝트 생성 후 자동으로 피드를 생성하는 트리거.';

