# 엔지니어링 진단

이 문서는 현재 코드, SQL 문서, API 흐름을 바탕으로 확인된 리스크와 의심 지점을 정리합니다.

## 확정 이슈

### 1. 프로젝트 삭제 권한이 특정 username으로 하드코딩됨

- 분류: 보안 / 운영
- 심각도: Critical
- 근거:
  - `docs/sql/056_v1_delete_project.sql`
  - `src/pages/project/ProjectDetailPage.tsx`
- 문제:
  - 프로젝트 오너가 아니라 `user_89bf5abb`만 삭제 가능하도록 구현됨
- 영향:
  - 정상 오너 삭제 불가
  - 운영 계정 변경 시 즉시 장애
- 권장 조치:
  - 오너 또는 플랫폼 관리자 권한 기반으로 전환
  - 소프트 삭제 감사 로그 추가

### 2. 커뮤니티 관련 RLS 정책이 느슨함

- 분류: 보안 / 데이터 무결성
- 심각도: Critical
- 근거:
  - `docs/sql/023_create_community_tables.sql`
  - `docs/sql/028_create_milestones_table.sql`
  - `docs/sql/030_create_tasks_table.sql`
  - `docs/sql/032_create_changelogs_table.sql`
- 문제:
  - `USING (true)`, `WITH CHECK (true)` 기반 정책이 많음
- 영향:
  - 함수 우회형 직접 쓰기 가능성
  - 운영 사고 추적 어려움
- 권장 조치:
  - 쓰기는 RPC 전용으로 좁히고 RLS를 엄격히 재정비

### 3. 피드백 수정 권한이 문서와 다름

- 분류: 권한 / 제품 로직
- 심각도: High
- 근거:
  - `docs/sql/026_v1_feedback_functions.sql`
  - `docs/system/feedback.md`
- 문제:
  - 작성자도 운영 필드를 바꿀 수 있는 구조
- 영향:
  - 상태, 우선순위, 담당자, 공식 답변 신뢰 저하
- 권장 조치:
  - 작성자 권한과 운영 권한 분리
  - 변경 이력 별도 저장

### 4. 투표 옵션 변경 시 집계 무결성 위험

- 분류: 데이터 무결성
- 심각도: High
- 근거:
  - `docs/sql/025_v1_community_post_functions.sql`
  - `docs/sql/023_create_community_tables.sql`
- 문제:
  - `tbl_post_vote_responses.vote_option_id` 변경은 `UPDATE`로 처리되지만 `votes_count` 보정 트리거가 없다
  - 투표 수정 함수가 옵션을 전체 삭제 후 재생성해 기존 응답과 집계를 훼손할 수 있다
- 영향:
  - 옵션 변경 시 투표 수가 실제 응답 수와 어긋날 수 있음
  - 응답이 있는 투표 수정 시 기존 투표가 유실될 수 있음
- 권장 조치:
  - `UPDATE OF vote_option_id` 트리거 추가
  - 집계 기준을 `tbl_post_vote_responses`로 통일하고 재계산 함수 제공
  - 응답이 있는 투표의 옵션/타입 변경 금지 또는 별도 마이그레이션 정책 수립

### 5. 댓글 출처 검증 SQL의 마이그레이션 신뢰도 문제

- 분류: 스키마 / 마이그레이션
- 심각도: High
- 근거:
  - `docs/sql/021_add_comment_source_type.sql`
- 문제:
  - CHECK 내부에 `EXISTS (SELECT ...)` 사용
- 영향:
  - 문서 SQL이 실제로는 실패했을 가능성
- 권장 조치:
  - 트리거 기반 검증 또는 참조 가능한 코드 구조로 변경

### 6. 댓글 모델이 범용 대상 ID처럼 혼용됨

- 분류: 데이터 모델링
- 심각도: Medium
- 근거:
  - `src/entities/project/api/project.api.ts`
  - `docs/sql/022_remove_comments_foreign_key.sql`
- 문제:
  - 프로젝트 댓글도 `p_post_id`를 재사용
- 영향:
  - 댓글 수와 출처 정합성 흔들림
- 권장 조치:
  - `target_type + target_id` 구조 또는 댓글 테이블 분리

### 7. 리워드 화면은 더미 상태이며 유지 보류 대상

- 분류: 제품 완성도 / 신뢰
- 심각도: High
- 근거:
  - `src/pages/project/RewardManagePage.tsx`
  - `src/pages/project/community/index.tsx`
- 문제:
  - 더미 데이터와 하드코딩 권한 기반
- 방향:
  - 현재는 개발 대상에서 제외
  - 노출 정책만 정리

### 8. 인증은 OAuth 중심, 이메일 로그인은 미완성

- 분류: 인증 / 도입성
- 심각도: Medium
- 근거:
  - `docs/system/로그인-프로세스.md`
  - `src/app/router/index.tsx`
- 문제:
  - 기관/멘토/초대형 계정 운영에 제약
- 권장 조치:
  - OAuth 유지
  - 이메일 로그인 정식화
  - 초대 링크 기반 온보딩 고려

### 9. 프로젝트 댓글 수 계산이 일관되지 않음

- 분류: 데이터 무결성 / UX
- 심각도: Medium
- 근거:
  - `src/entities/project/api/project.api.ts`
- 문제:
  - 어떤 화면은 집계 컬럼, 어떤 화면은 실시간 계산 사용
- 권장 조치:
  - 카운트 전략 단일화

## 의심 이슈

### 1. 실서비스 기능과 준비중 기능이 같은 레벨로 노출됨

- 근거:
  - `docs/TODO.md`
  - `src/pages/project/community/index.tsx`
- 영향:
  - 사용자가 기능 상태를 오해

### 2. 운영 UX가 기능 단위로는 보이지만 운영 흐름 단위로는 약함

- 근거:
  - 피드백, 마일스톤, 변경사항이 각각 따로 존재
- 영향:
  - 운영자가 전체 진행 상황을 한 화면에서 파악하기 어려움

## 정리

- 지금 먼저 손봐야 할 것은 `권한`, `무결성`, `서비스 신뢰`
- 그 다음은 `운영 흐름`, `사용자 재방문`, `기관 도입 구조`
- 리워드는 당분간 보류하고 문서와 노출 정책만 관리하는 것이 맞습니다.
