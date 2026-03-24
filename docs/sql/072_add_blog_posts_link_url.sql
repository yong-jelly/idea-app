-- =====================================================
-- 보강: odd.blog_posts.link_url
-- =====================================================
-- 이미 docs/sql/070_create_blog_tables.sql 을 적용한 DB에만 실행하면 됩니다.
-- 신규 환경에서 070에 link_url이 포함된 경우 이 파일은 스킵해도 됩니다(ADD COLUMN IF NOT EXISTS).
-- 이후 docs/sql/071_v1_blog_functions.sql 의 최신 버전을 적용해 RPC 시그니처를 맞춥니다.
-- 실행: psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/072_add_blog_posts_link_url.sql
-- =====================================================

ALTER TABLE odd.blog_posts
    ADD COLUMN IF NOT EXISTS link_url text;

COMMENT ON COLUMN odd.blog_posts.link_url IS '선택 참고 URL(외부 원문 등)';
