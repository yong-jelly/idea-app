-- =====================================================
-- Bot 시스템 구축
-- =====================================================
-- 
-- 시스템 알림 및 자동화를 위한 Bot 계정 시스템을 구축합니다.
-- Bot 계정은 사용자 개입 없이 자동으로 피드를 생성할 수 있습니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/036_create_bot_system.sql
-- 
-- =====================================================
-- 1. 사용자 테이블에 user_type 컬럼 추가
-- =====================================================

-- user_type 컬럼 추가 ('user' | 'bot', 기본값: 'user')
ALTER TABLE odd.tbl_users 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'user' NOT NULL CHECK (user_type IN ('user', 'bot'));

-- Bot 계정은 auth_id가 NULL일 수 있음 (시스템 Bot)
-- 기존 제약조건이 있다면 수정 필요할 수 있음
-- ALTER TABLE odd.tbl_users ALTER COLUMN auth_id DROP NOT NULL; -- 필요시 주석 해제

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tbl_users_user_type ON odd.tbl_users(user_type) WHERE user_type = 'bot';

-- =====================================================
-- 2. Bot 역할 코드 추가
-- =====================================================

INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('bot_role', 'system_notification', '시스템 알림', '시스템 알림 봇 (프로젝트 생성 알림 등)', 1, true),
    ('bot_role', 'project_assistant', '프로젝트 어시스턴트', '프로젝트 관련 자동화 봇', 2, true),
    ('bot_role', 'community_moderator', '커뮤니티 모더레이터', '커뮤니티 관리 봇 (향후 확장용)', 3, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 3. 시스템 Bot 계정 생성
-- =====================================================

-- 프로젝트 생성 알림 봇 생성
INSERT INTO odd.tbl_users (
    auth_id,
    email,
    username,
    display_name,
    avatar_url,
    bio,
    user_type,
    points,
    level,
    subscribed_projects_count,
    supported_projects_count,
    projects_count,
    is_active,
    created_at,
    updated_at
)
SELECT 
    NULL,  -- 시스템 Bot은 auth_id 없음
    'system@1dd.app',
    'system_project_bot',
    '프로젝트 알림 봇',
    NULL,  -- 시스템 아이콘은 프론트엔드에서 처리
    '새로운 프로젝트가 생성되면 알려드립니다.',
    'bot',
    0,
    'bronze',
    0,
    0,
    0,
    true,
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM odd.tbl_users WHERE username = 'system_project_bot'
)
RETURNING id;

-- =====================================================
-- 4. 포스트 타입에 project_created 추가
-- =====================================================

-- 기존 CHECK 제약조건 제거 (필요시)
DO $$
BEGIN
    -- 제약조건 이름 확인 후 제거
    ALTER TABLE odd.tbl_posts 
    DROP CONSTRAINT IF EXISTS tbl_posts_type_check;
    
    -- 새로운 제약조건 추가 (project_created 포함)
    ALTER TABLE odd.tbl_posts 
    ADD CONSTRAINT tbl_posts_type_check 
    CHECK (type IN ('text', 'project_update', 'milestone', 'feature_accepted', 'project_created'));
EXCEPTION
    WHEN duplicate_object THEN
        -- 이미 존재하는 경우 무시
        NULL;
END $$;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON COLUMN odd.tbl_users.user_type IS '사용자 타입: user(일반 사용자) 또는 bot(봇 계정)';
COMMENT ON COLUMN odd.tbl_users.auth_id IS 'Supabase Auth ID. Bot 계정은 NULL일 수 있음';

