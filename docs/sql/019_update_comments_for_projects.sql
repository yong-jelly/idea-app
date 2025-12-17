-- =====================================================
-- 댓글 테이블 업데이트: 프로젝트 댓글 지원 추가
-- =====================================================
-- 
-- 기존 댓글 테이블을 확장하여 프로젝트 댓글도 지원하도록 수정합니다.
-- post_id는 포스트 또는 프로젝트 ID를 참조할 수 있습니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/019_update_comments_for_projects.sql
-- 
-- =====================================================
-- 1. 댓글 테이블 수정: post_id 제약조건 변경
-- =====================================================

-- 기존 외래키 제약조건 제거
ALTER TABLE odd.tbl_comments DROP CONSTRAINT IF EXISTS tbl_comments_post_id_fkey;

-- 새로운 외래키 제약조건 추가 (포스트 또는 프로젝트 참조)
-- CHECK 제약조건으로 하나만 참조하도록 보장
ALTER TABLE odd.tbl_comments 
  ADD CONSTRAINT chk_comment_target CHECK (
    (post_id IN (SELECT id FROM odd.tbl_posts)) OR
    (post_id IN (SELECT id FROM odd.projects))
  );

-- 인덱스는 이미 존재하므로 그대로 사용

-- =====================================================
-- 2. 코멘트 업데이트
-- =====================================================

COMMENT ON COLUMN odd.tbl_comments.post_id IS '포스트 ID 또는 프로젝트 ID (tbl_posts.id 또는 projects.id 참조)';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * 프로젝트 댓글 사용 방법:
 * 
 * 1. 프로젝트 댓글 생성:
 *    SELECT * FROM odd.v1_create_comment(
 *      'project-uuid-here',  -- 프로젝트 ID를 post_id로 사용
 *      '댓글 내용'
 *    );
 * 
 * 2. 프로젝트 댓글 조회:
 *    SELECT * FROM odd.v1_fetch_comments(
 *      'project-uuid-here'  -- 프로젝트 ID를 post_id로 사용
 *    );
 * 
 * 주의사항:
 * - 프로젝트 ID와 포스트 ID는 모두 UUID 형식이므로 구분이 필요합니다.
 * - 실제로는 프로젝트 댓글을 위한 별도 테이블을 만드는 것이 더 나을 수 있습니다.
 * - 현재 구조는 프로젝트 ID를 post_id로 사용하는 방식으로 작동합니다.
 */

