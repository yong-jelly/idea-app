-- =====================================================
-- 코드 테이블 업데이트: 커뮤니티 관련 코드 추가
-- =====================================================
-- 
-- 커뮤니티 공지 및 피드백 시스템에 필요한 코드를 추가합니다.
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/024_update_codes_table.sql
-- 
-- =====================================================
-- 1. 포스트 타입 코드 삽입
-- =====================================================

INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('post_type', 'announcement', '공지사항', '프로젝트 커뮤니티 공지사항', 1, true),
    ('post_type', 'update', '업데이트', '프로젝트 업데이트 소식', 2, true),
    ('post_type', 'vote', '투표', '커뮤니티 의견 수렴을 위한 투표', 3, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 2. 피드백 타입 코드 삽입
-- =====================================================

INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('feedback_type', 'bug', '버그', '오류, 버그 리포트', 1, true),
    ('feedback_type', 'feature', '기능 요청', '새로운 기능 요청', 2, true),
    ('feedback_type', 'improvement', '개선 제안', '기존 기능 개선 제안', 3, true),
    ('feedback_type', 'question', '질문', '사용법, API 등 문의', 4, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 3. 피드백 상태 코드 삽입
-- =====================================================

INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('feedback_status', 'open', '접수됨', '새로 등록됨', 1, true),
    ('feedback_status', 'in_progress', '진행 중', '개발팀 검토/작업 중', 2, true),
    ('feedback_status', 'resolved', '해결됨', '문제 해결됨', 3, true),
    ('feedback_status', 'closed', '닫힘', '처리 완료 또는 반려', 4, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 4. 피드백 우선순위 코드 삽입
-- =====================================================

INSERT INTO odd.tbl_codes (code_type, code_value, code_label, description, sort_order, is_active)
VALUES
    ('feedback_priority', 'low', '낮음', '중요도 낮음, 여유있게 처리', 1, true),
    ('feedback_priority', 'medium', '보통', '일반적인 중요도', 2, true),
    ('feedback_priority', 'high', '높음', '빠른 처리 필요', 3, true),
    ('feedback_priority', 'critical', '긴급', '즉시 처리 필요', 4, true)
ON CONFLICT (code_type, code_value) DO NOTHING;

-- =====================================================
-- 5. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_codes IS '모든 코드 타입을 통합 관리하는 테이블. 커뮤니티 공지 및 피드백 시스템 코드 포함';




