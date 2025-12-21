-- =====================================================
-- 프로젝트와 프로젝트 작성자를 제외한 모든 데이터 초기화
-- =====================================================
-- 
-- 이 스크립트는 프로젝트(projects)와 프로젝트 작성자(tbl_users)를 제외한
-- 모든 부산물 데이터(좋아요, 댓글, 포스트, 커뮤니티 활동 등)를 삭제합니다.
-- 
-- 유지되는 데이터:
--   - projects: 프로젝트 정보
--   - tbl_users: 사용자 정보 (프로젝트 작성자)
--   - tbl_project_bookmarks: 프로젝트 북마크 (프로젝트 작성자에게 자동으로 생기는 것 포함)
--   - tbl_codes: 코드 테이블 (시스템 테이블)
-- 
-- 삭제되는 데이터:
--   - 포스트 및 관련 데이터 (tbl_posts, tbl_post_likes, tbl_post_bookmarks 등)
--   - 댓글 및 관련 데이터 (tbl_comments, tbl_comment_likes 등)
--   - 커뮤니티 활동 (공지사항, 투표, 피드백 등)
--   - 마일스톤 및 태스크
--   - 변경사항(Changelog)
--   - 프로젝트 좋아요
--   - 멘션
-- 
-- 주의사항:
--   - 이 스크립트는 되돌릴 수 없습니다. 실행 전 백업을 권장합니다.
--   - 프로젝트의 통계 필드(likes_count, comments_count 등)도 0으로 초기화됩니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/ALL-KILL-WITHOUT-PROJECT.sql
-- 
-- =====================================================

BEGIN;

-- =====================================================
-- 1. 포스트 관련 데이터 삭제
-- =====================================================

-- 포스트 좋아요 삭제
DELETE FROM odd.tbl_post_likes;

-- 포스트 북마크 삭제
DELETE FROM odd.tbl_post_bookmarks;

-- 포스트 관련 커뮤니티 데이터 삭제 (투표 응답, 투표 옵션, 공지사항)
DELETE FROM odd.tbl_post_vote_responses;
DELETE FROM odd.tbl_post_votes;
DELETE FROM odd.tbl_post_announcements;

-- 피드백 투표 및 피드백 삭제
DELETE FROM odd.tbl_feedback_votes;
DELETE FROM odd.tbl_feedbacks;

-- 포스트 삭제 (CASCADE로 댓글도 함께 삭제됨)
DELETE FROM odd.tbl_posts;

-- =====================================================
-- 2. 댓글 관련 데이터 삭제
-- =====================================================

-- 댓글 좋아요 삭제 (포스트 삭제 시 CASCADE로 이미 삭제되었을 수 있음)
DELETE FROM odd.tbl_comment_likes;

-- 댓글 삭제 (포스트 삭제 시 CASCADE로 이미 삭제되었을 수 있음)
DELETE FROM odd.tbl_comments;

-- =====================================================
-- 3. 멘션 삭제
-- =====================================================

DELETE FROM odd.tbl_mentions;

-- =====================================================
-- 4. 프로젝트 관련 부산물 데이터 삭제
-- =====================================================

-- 프로젝트 좋아요 삭제
DELETE FROM odd.tbl_project_likes;

-- 마일스톤의 태스크 삭제
DELETE FROM odd.tbl_tasks;

-- 마일스톤 삭제
DELETE FROM odd.tbl_milestones;

-- 변경사항(Changelog) 삭제
DELETE FROM odd.tbl_changelogs;

-- =====================================================
-- 5. 프로젝트 통계 필드 초기화
-- =====================================================

-- 프로젝트의 모든 통계 필드를 0으로 초기화
UPDATE odd.projects
SET 
    likes_count = 0,
    comments_count = 0,
    backers_count = 0,
    current_funding = 0,
    target_funding = 0,
    days_left = 0;

-- =====================================================
-- 6. 삭제 결과 확인 (선택사항)
-- =====================================================

-- 삭제된 데이터 확인을 위한 쿼리 (주석 해제하여 사용 가능)
-- SELECT 
--     (SELECT COUNT(*) FROM odd.tbl_posts) AS posts_count,
--     (SELECT COUNT(*) FROM odd.tbl_comments) AS comments_count,
--     (SELECT COUNT(*) FROM odd.tbl_post_likes) AS post_likes_count,
--     (SELECT COUNT(*) FROM odd.tbl_project_likes) AS project_likes_count,
--     (SELECT COUNT(*) FROM odd.tbl_milestones) AS milestones_count,
--     (SELECT COUNT(*) FROM odd.tbl_tasks) AS tasks_count,
--     (SELECT COUNT(*) FROM odd.tbl_changelogs) AS changelogs_count,
--     (SELECT COUNT(*) FROM odd.projects) AS projects_count,
--     (SELECT COUNT(*) FROM odd.tbl_users) AS users_count,
--     (SELECT COUNT(*) FROM odd.tbl_project_bookmarks) AS project_bookmarks_count;

COMMIT;

-- =====================================================
-- 완료 메시지
-- =====================================================

-- 스크립트 실행이 완료되었습니다.
-- 프로젝트와 프로젝트 작성자, 프로젝트 북마크는 유지되었으며,
-- 나머지 모든 부산물 데이터가 삭제되었습니다.

