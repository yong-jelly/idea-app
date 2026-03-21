생성일: 2026-03-21  
최종 갱신: 2026-03-21

# MCP 유사 프로토콜 운영 TODO

프로젝트 관리자가 로그인한 뒤, 자신이 관리하는 프로젝트에 대해 **LLM/에이전트가 읽고 쓰기 쉬운 프로토콜**을 발급·운영할 수 있게 하는 과제를 한 파일에 정리함.  
항목은 **완료(기준선)** → **Supabase(인증·감사·래퍼)** → **외부 호출 계층** → **프론트·문서** 순으로 배치함.

---

## 1. 작업 목록 요약

| 영역 | 과제 | 비고 |
|------|------|------|
| **완료** | 프로젝트 설정 **LLM 및 API** 기본 UI, **액세스 토큰** 목록·생성(평문 1회)·폐기, **이름 15자**·스코프 화이트리스트·DB 해시 저장 | 아래 [§2](#2-완료된-범위-기준선-2026-03) |
| **Supabase** | 토큰 **검증 RPC**, `last_used_at` 갱신, (선택) **감사 로그** 테이블·삽입 | [§3](#3-supabase-미구현) |
| **외부 API** | 공개 RPC `v1_llm_public_echo` / `v1_llm_public_project_read` (anon + 본문 `p_plain_token`, 스코프 검증) · 도메인 쓰기 래퍼는 향후 | [§4](#4-외부-호출-인증--래퍼-api) |
| **도메인 CRUD** | scope별 공지/마일스톤/changelog 등 **MCP용 엔드포인트** 정의·구현 | [§5](#5-도메인별-mcp-연동-후보) |
| **프론트** | **공개 LLM 문서** + **API 플레이그라운드** (동일 URL) | [§6](#6-프론트--문서-페이지) |
| **운영** | 명칭·레이트리밋·베타 플래그·보안 리뷰 | [§7](#7-운영--정책) |

---

## 2. 완료된 범위 (기준선, 2026-03)

### 2.1 제품 동작

- [x] 프로젝트 **작성자**만 설정 하위 **`/project/:id/settings/access`** 에서 토큰 발급·목록·폐기 가능.
- [x] **프로젝트 키**는 UUID 기반 **결정적 파생** 문자열(`deriveProjectKeyFromProjectId`)로 표시(별도 DB 테이블 없음).
- [x] **액세스 토큰**은 발급 시 평문 **1회만** 표시, DB에는 **SHA-256 해시** + `token_prefix`만 저장.
- [x] 토큰 **표시 이름** 1~15자, **스코프**는 SQL·UI 공통 화이트리스트 (`project.read`, `announcement.write`, …).
- [x] 목록 테이블: 이름 2줄 클램프, 스코프 `+n` 펼치기 UX.
- [x] **공개 URL** `GET /project/:id/llm-manual` — 연동 사양 MD + **공개 RPC 시험 UI** (토큰·키 입력). 비밀 토큰은 문서 본문에 미포함.
- [x] **공개 API** (Supabase RPC, `067_v1_llm_public_api.sql`): `v1_llm_public_echo` (`echo.invoke`), `v1_llm_public_project_read` (`project.read`).

### 2.2 DB / SQL

| 산출물 | 설명 |
|--------|------|
| `docs/sql/065_create_project_access_tokens.sql` | `odd.tbl_project_access_tokens`, RLS 차단, `fn_validate_mcp_scopes`, `v1_create_project_access_token`, `v1_fetch_project_access_tokens`, `v1_revoke_project_access_token` |
| `docs/sql/066_drop_project_access_tokens_for_recreate.sql` | 스키마 재적용 시 함수·테이블 DROP (데이터 삭제) 후 065 재실행 |

### 2.3 앱 코드 (참고 경로)

| 구분 | 경로 |
|------|------|
| API | `src/entities/project/api/project-access-token.api.ts` |
| 상수 | `src/entities/project/model/project-access-token.constants.ts` |
| 훅 | `src/pages/project/settings/hooks/useProjectAccessTokens.ts` |
| 페이지 | `src/pages/project/settings/ProjectSettingsAccessPage.tsx` |
| 테이블·모달 | `AccessTokenTable.tsx`, `widgets/modal/generate-access-token.modal.tsx` |
| 스코프·만료 UI | `src/features/project-settings/model/mcp-access-token.constants.ts` |
| 공개 LLM 문서·플레이그라운드 | `src/pages/project/llm-manual/project-llm-manual.md`, `ProjectPublicLlmManualPage.tsx`, `LlmPublicApiPlayground.tsx`, `build-llm-manual-markdown.ts` |
| 공개 RPC API | `src/entities/project/api/project-llm-public.api.ts` |
| SQL (공개 API) | `docs/sql/067_v1_llm_public_api.sql` |

### 2.4 의도적으로 아직 없는 것

- 별도 **도메인·Edge 전용 HTTP 게이트웨이** (Supabase RPC 외 레이트리밋·WAF 등).
- **감사 로그** 테이블·외부 호출 전부 기록.
- 공개 RPC 이외 도메인(공지/마일스톤 등) **스코프별 래퍼** 일괄 구현.

*(참고: 공개 RPC 성공 시 `last_used_at` 갱신은 `067`에 포함.)*

---

## 3. Supabase (미구현)

### 3.1 목표

- 발급된 `odd_pat_*` 평문 → 해시 매칭 → `project_id`·`scopes`·만료·폐기 여부 판정.
- (선택) 호출 성공 시 `last_used_at` 갱신.
- (선택) `odd.tbl_project_mcp_audit_logs` 또는 동등 테이블에 요약 기록.

### 3.2 산출물 (초안)

- [ ] `v1_verify_project_access_token` 또는 게이트 전용 함수 (파라미터: `p_project_id`, `p_plain_token` 또는 헤더 파싱은 Edge에서 하고 DB에는 해시만 전달 등 **팀 합의** 필요).
- [ ] 감사 로그 마이그레이션 파일 (`docs/sql` 순번 규칙 준수).
- [ ] RLS: 직접 테이블 접근 차단 + RPC만 `SECURITY DEFINER` 패턴 유지.

### 3.3 체크리스트

- [ ] `scope` 요구와 기존 `v1_*` 커뮤니티/마일스톤/changelog RPC 호출 전 검증 흐름 설계.
- [ ] 토큰 무차별 대입·만료·폐기 시 에러 메시지 규격 (`UNAUTHORIZED`, `TOKEN_EXPIRED`, …) 문서화.

---

## 4. 외부 호출(인증 + 래퍼 API)

### 4.1 목표

- LLM·스크립트가 **사이트 밖**에서 호출할 통로 정의 (Supabase RPC 직접 노출 vs **Edge Function / 별도 서버**).
- 공통 응답 포맷 (`ok`, `data`, `error`, `meta`) 및 에러 코드 표준화.

### 4.2 결정 필요

- [ ] `project_key` + `Authorization: Bearer <odd_pat_…>` 동시 요구 여부.
- [ ] 기존 `v1_fetch_project_detail` 등을 **그대로** 호출할지, `v1_mcp_*` 래퍼로 감쌀지.

### 4.3 산출물

- [ ] OpenAPI 또는 `docs/system` 수준의 **호출 스펙** 1페이지.
- [ ] (선택) `docs/sql`에 래퍼 RPC 묶음 파일.

---

## 5. 도메인별 MCP 연동 후보

기존 RPC·테이블은 [§2.4](#24-의도적으로-아직-없는-것) 이전 문서의 표와 동일하게 재사용 가능. 아래는 **아직 MCP용으로 묶이지 않은** 영역.

| 영역 | 재사용 자산 (요약) | 할 일 |
|------|-------------------|--------|
| 프로젝트 소개 | `odd.projects`, `updateProject` / 상세 RPC | 읽기·쓰기 래퍼·scope 매핑 |
| 공지/업데이트 | `v1_*_community_post` | 타입별 별칭·LLM 길이/금칙어 정책 |
| 마일스톤·태스크 | `029`, `031` 계열 | CRUD + 배치 필요 여부 |
| Changelog | `033` 계열 | `changes[]` 스키마 문서화 |

---

## 6. 프론트 · 문서 페이지

### 6.1 공개 LLM 연동 문서 (`/project/:id/llm-manual`)

- [x] 인증 없이 열람 가능, `project_id`·파생 `project_key`·Supabase URL·설정/에코 링크 자동 치환.
- [x] Markdown 렌더 + 전문 복사(도구·IDE 붙여넣기용).
- [ ] 게이트웨이 도입 후 본문의 예시 URL·상태 필드 갱신.

### 6.2 설정 내 «연동 메뉴얼» 탭 (`/project/:id/settings/manual`)

- [x] 공개 문서로 안내(플레이스홀더 보완).
- [ ] 설정 전용 추가 안내가 필요하면 본 탭에만 표시.

### 6.3 에코 테스트 (`/project/:id/settings/echo`)

- [ ] 검증 RPC(§3) 연동 후, 토큰·scope·만료 정보를 응답에 포함할지 결정.
- [ ] 실패 케이스(만료·잘못된 키) 재현 버튼.

---

## 7. 운영 · 정책

- [ ] 공식 명칭(내부: MCP 유사 / Odd agent API 등) 합의.
- [ ] 지원 클라이언트(Cursor, Claude Code, generic HTTP) 범위.
- [ ] 레이트 리밋 위치(Edge vs RPC), 활성 토큰 개수 상한.
- [ ] 기능 플래그·베타·보안 리뷰.

---

## 8. 구현 우선순위 (갱신)

### Phase A (현재 기준선)

- [x] 토큰 테이블 + 발급·목록·폐기 RPC + 설정 UI.

### Phase B (다음)

- [ ] 토큰 검증 + `last_used_at` + (선택) 감사 로그.
- [ ] 외부 호출 게이트웨이 또는 래퍼 RPC 묶음.
- [ ] 메뉴얼·에코 페이지 **실연동**.

### Phase C

- [ ] 도메인별 쓰기/읽기 MCP 엔드포인트 확장, 레이트리밋·모니터링.

---

## 9. SQL·코딩 규칙 (유지)

- 테이블은 `odd` 스키마, 이름은 `tbl_` 접두(기존 규칙).
- RPC는 `v1_` 접두, 클라이언트는 `supabase.schema('odd').rpc(...)`.
- 변경은 `docs/sql` 순번 파일로 기록.
- 상세: 워크스페이스 규칙 `.cursor/rules/supabase-config.mdc` 등.

---

## 10. 오픈 질문 (축약)

- [ ] 프로젝트 키를 완전 공개 식별자로 고정할지(현재는 파생 문자열 표시만).
- [ ] 이미지 업로드를 MCP 1차에 포함할지.
- [ ] 투표형 공지 외부 쓰기 허용 여부.
- [ ] RPC 직공개 vs HTTP 단일 진입점.

---

## 11. 참고

- GlassQL 운영 TODO 형식 참고: `pghook/docs/GlassQL/구현/TODO-운영.md` (요약 표 + 섹션 앵커 + 산출물·체크리스트 패턴).
- 본 프로젝트 Supabase·스키마 규칙: `.cursor/rules/supabase-config.mdc`, `docs/sql/065_*.sql`.
