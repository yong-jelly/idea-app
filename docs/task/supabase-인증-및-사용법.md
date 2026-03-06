# Supabase 인증 및 사용법

이 문서는 이 프로젝트에서 Cursor의 Supabase 플러그인과 MCP를 사용할 때 빠르게 참고하기 위한 요약입니다.

## 현재 연결 기준

- Supabase 프로젝트 ID: `xyqpggpilgcdsawuvpzn`
- 프로젝트 URL: `https://xyqpggpilgcdsawuvpzn.supabase.co`
- 기본 스키마 규칙: `odd`
- 테이블 네이밍 규칙: `tbl_` 접두사 사용

## 인증 요약

- Cursor에 Supabase 플러그인이 설치되어 있어야 함
- MCP 서버 이름은 `plugin-supabase-supabase`
- 인증이 안 된 상태에서는 MCP 호출이 실패할 수 있음
- 인증 완료 후에는 조직, 프로젝트, 테이블, SQL 조회가 정상 응답해야 함

## 인증이 정상인지 확인하는 방법

다음 항목이 정상 조회되면 연결은 된 상태로 봐도 됩니다.

- 조직 목록 조회
- 프로젝트 목록 조회
- 프로젝트 URL 조회
- `odd` 스키마 테이블 목록 조회
- 간단한 읽기 SQL 실행

이번 점검에서 실제로 확인된 항목:

- 조직: `YONGTAEK-ORG`
- 프로젝트: `place`
- 프로젝트 상태: `ACTIVE_HEALTHY`
- `odd` 스키마 테이블 조회 성공
- `select 1 as ok, now() as server_time;` 실행 성공

## 자주 쓰는 작업

### 1. 프로젝트 확인

- 프로젝트 목록 조회
- 특정 프로젝트 상세 조회
- 프로젝트 URL 확인

주로 아래 정보 확인에 사용:

- 프로젝트 상태
- 지역
- DB 버전
- API URL

### 2. 스키마/테이블 확인

- `odd` 스키마 기준으로 테이블 목록 조회
- 필요 시 verbose 모드로 컬럼, PK, FK 확인

이 프로젝트는 `public`보다 `odd` 스키마를 먼저 확인하는 것이 맞습니다.

### 3. SQL 실행

- 단순 조회나 검증 쿼리는 `execute_sql`로 확인 가능
- DDL 변경은 직접 실행보다 마이그레이션 문서와 일치 여부를 먼저 봐야 함
- 스키마 변경은 `docs/sql`에 순서대로 기록하는 규칙을 유지

예시 쿼리:

```sql
select 1 as ok, now() as server_time;
```

## 작업 시 기본 원칙

- 쓰기 작업 전에는 먼저 읽기 작업으로 상태를 확인
- 운영 DB에 바로 DDL을 넣기 전에 `docs/sql` 문서와 현재 스키마 차이를 먼저 검토
- 테이블 생성/수정 시 `odd` 스키마와 `tbl_` 접두사 규칙 준수
- RLS 정책은 느슨하게 두지 말고, 가능하면 쓰기 경로를 명확히 제한
- 비밀 키, PAT, secret 값은 문서에 남기지 않음

## 자주 확인할 파일

- `docs/sql`
- `docs/system/로그인-프로세스.md`
- `docs/system/feedback.md`
- `docs/system/milestone.md`
- `docs/system/comment.md`

## 문제 발생 시 체크포인트

### 인증 오류가 날 때

- Cursor 재시작
- 플러그인 재설치 또는 업데이트
- MCP 인증 재시도
- OAuth 오류가 나면 플러그인 쪽 문제인지 먼저 의심

과거 실제 오류 예시:

- `Unrecognized client_id`

이 오류는 사용자 프로젝트 설정이 아니라 플러그인 OAuth 설정 문제일 수 있습니다.

### 연결은 됐는데 원하는 데이터가 안 보일 때

- 프로젝트 ID가 맞는지 확인
- 스키마를 `public`이 아니라 `odd`로 보고 있는지 확인
- RLS 때문에 조회 결과가 제한되는지 확인
- 필요한 경우 테이블 구조와 정책을 함께 점검

## 앞으로 작업할 때의 권장 순서

1. 프로젝트와 스키마 상태를 읽기로 확인
2. 관련 `docs/sql`, `docs/system` 문서를 함께 검토
3. 필요한 SQL 또는 스키마 변경안을 문서 기준으로 정리
4. 실제 조회/검증 쿼리로 영향 범위를 확인
5. 변경이 필요하면 문서와 구현을 함께 맞춤
