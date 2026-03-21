## Odd 프로젝트 LLM·에이전트 API 사양 (공개)

> 이 문서는 **프로젝트별 공개 URL**로 공유되는 LLM 전용 API 문서입니다.  
> **액세스 토큰 평문은 절대 문서에 넣지 마세요.** 토큰은 설정 화면에서만 발급되고, 서버에는 해시만 저장됩니다.

---

### LLM·도구용 메타 (파싱용)

```json
{
  "schema": "odd.project_llm_manual.v3",
  "project_id": "{{PROJECT_ID}}",
  "project_key": "{{PROJECT_KEY}}",
  "manual_public_url": "{{MANUAL_ABS_URL}}",
  "settings_access_url": "{{SETTINGS_ACCESS_ABS_URL}}",
  "echo_page_url": "{{ECHO_ABS_URL}}",
  "supabase_url": "{{SUPABASE_URL}}",
  "supabase_anon_key": "{{SUPABASE_ANON_KEY}}",
  "public_rpc": [
    "v1_llm_public_echo",
    "v1_llm_public_project_read",
    "v1_llm_public_manual_read",
    "v1_llm_public_project_update",
    "v1_llm_public_announcement_list",
    "v1_llm_public_announcement_create",
    "v1_llm_public_announcement_update",
    "v1_llm_public_announcement_delete"
  ],
  "token_prefix": "odd_pat_"
}
```

---

### 1. 식별자와 비밀

| 이름 | 예시 | 비밀 여부 | 설명 |
|------|------|-----------|------|
| `project_id` | `{{PROJECT_ID}}` | 아님 | UUID PK |
| `project_key` | `{{PROJECT_KEY}}` | 아님 | `project_id`에서 파생한 공개 핸들 |
| `access_token` | `odd_pat_...` | **예** | Bearer 역할의 평문 토큰 |

---

### 2. 인증 모델

공개 API는 **Supabase PostgREST RPC** 방식입니다. 사용자 로그인 세션 없이 **anon 키 + 프로젝트 액세스 토큰**으로 호출합니다.

| 항목 | 값 |
|------|-----|
| Base URL | `{{SUPABASE_URL}}` |
| 스키마 | `odd` (`Accept-Profile: odd`) |
| 헤더 | `apikey: {{SUPABASE_ANON_KEY}}`, `Authorization: Bearer {{SUPABASE_ANON_KEY}}` |
| 토큰 전달 | RPC JSON body 의 `p_plain_token` |
| 프로젝트 식별 | `p_project_id` 또는 `p_project_key` |

공통 헤더:

```http
Content-Type: application/json
Accept-Profile: odd
apikey: {{SUPABASE_ANON_KEY}}
Authorization: Bearer {{SUPABASE_ANON_KEY}}
```

---

### 3. 인증·권한 (스코프)

| 스코프 | 사용 가능 RPC |
|--------|---------------|
| `echo.invoke` | `v1_llm_public_echo` |
| `project.read` | `v1_llm_public_project_read` |
| `manual.read` | `v1_llm_public_manual_read` |
| `project.write` | `v1_llm_public_project_update` |
| `announcement.read` | `v1_llm_public_announcement_list` |
| `announcement.write` | `v1_llm_public_announcement_create`, `v1_llm_public_announcement_update`, `v1_llm_public_announcement_delete` |

화이트리스트에는 `milestone.*`, `changelog.*` 도 포함되지만, 그 스코프를 **소비하는 공개 RPC는 아직 추가되지 않았습니다.**

---

### 4. 엔드포인트 요약

| RPC | 메서드 | 필요 스코프 | 목적 |
|-----|--------|-------------|------|
| `v1_llm_public_echo` | POST | `echo.invoke` | 토큰·프로젝트 바인딩 검증 + 에코 |
| `v1_llm_public_project_read` | POST | `project.read` | 프로젝트 메타 읽기 |
| `v1_llm_public_manual_read` | POST | `manual.read` | 공개 문서 메타 정보 읽기 |
| `v1_llm_public_project_update` | POST | `project.write` | 프로젝트 텍스트·링크 필드 수정 |
| `v1_llm_public_announcement_list` | POST | `announcement.read` | 공지/업데이트/투표 목록 읽기 |
| `v1_llm_public_announcement_create` | POST | `announcement.write` | 공지/업데이트/투표 생성 |
| `v1_llm_public_announcement_update` | POST | `announcement.write` | 공지/업데이트/투표 수정 |
| `v1_llm_public_announcement_delete` | POST | `announcement.write` | 공지/업데이트 삭제 (soft delete) |

REST 경로 예시:

```http
POST {{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_echo
POST {{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_project_update
POST {{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_announcement_create
```

---

### 5. 공통 실패 형식

HTTP가 200이어도 함수 내부 검증 실패는 아래처럼 `ok: false` 로 반환할 수 있습니다.

```json
{
  "ok": false,
  "error": {
    "code": "INSUFFICIENT_SCOPE",
    "message": "필요 스코프: announcement.write"
  }
}
```

대표 `error.code`:

| code | 의미 |
|------|------|
| `INVALID_ARGUMENT` | `project_id`/`project_key` 조합 오류 |
| `INVALID_PROJECT_KEY` | 공개 키 불일치 또는 없음 |
| `NOT_FOUND` | 프로젝트/포스트 없음 |
| `INVALID_TOKEN` | 형식 오류, 해시 불일치, 만료, 폐기 |
| `INSUFFICIENT_SCOPE` | 필요한 스코프가 없음 |
| `VALIDATION_ERROR` | 제목, 본문, 이미지 개수 등 유효성 실패 |
| `FORBIDDEN` | 다른 프로젝트의 포스트 수정/삭제 시도 |
| `INTERNAL` | 서버 예외 |

---

### 6. 상세 API

#### 6.1 `v1_llm_public_echo`

목적: 토큰·프로젝트 바인딩 검증과 간단한 연결 테스트

필수 스코프: `echo.invoke`

추가 바디:

```json
{
  "p_payload": {
    "message": "hello"
  }
}
```

---

#### 6.2 `v1_llm_public_project_read`

목적: 프로젝트 공개 메타·소개 필드 읽기

필수 스코프: `project.read`

반환 필드 예시:

- `title`
- `short_description`
- `full_description`
- `category`
- `tech_stack`
- `repository_url`
- `demo_url`
- `status`
- `featured`
- `created_at`
- `updated_at`

---

#### 6.3 `v1_llm_public_manual_read`

목적: 공개 매뉴얼 경로와 현재 활성 RPC 목록 확인

필수 스코프: `manual.read`

추가 바디:

```json
{}
```

반환 예시 필드:

- `manual.public_path`
- `manual.settings_access_path`
- `manual.echo_path`
- `manual.available_rpc`

---

#### 6.4 `v1_llm_public_project_update`

목적: 프로젝트의 텍스트·링크 필드 수정

필수 스코프: `project.write`

지원 필드:

- `p_title`
- `p_short_description`
- `p_full_description`
- `p_category`
- `p_tech_stack` (`jsonb` 배열)
- `p_repository_url`
- `p_demo_url`
- `p_android_store_url`
- `p_ios_store_url`
- `p_mac_store_url`

예시:

```json
{
  "p_title": "업데이트된 프로젝트 제목",
  "p_short_description": "짧은 설명",
  "p_full_description": "상세 설명"
}
```

> 이미지 업로드·썸네일 변경은 현재 공개 RPC 범위에 포함되지 않습니다.

---

#### 6.5 `v1_llm_public_announcement_list`

목적: 공지/업데이트/투표 목록 조회

필수 스코프: `announcement.read`

추가 파라미터:

| 이름 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `p_post_type` | text \| null | `null` | `announcement`, `update`, `vote` 중 선택 |
| `p_limit` | integer | `30` | 1~100 |
| `p_offset` | integer | `0` | 페이지네이션 |

예시:

```json
{
  "p_post_type": "announcement",
  "p_limit": 10,
  "p_offset": 0
}
```

---

#### 6.6 `v1_llm_public_announcement_create`

목적: 공지/업데이트/투표 생성

필수 스코프: `announcement.write`

지원 필드:

- `p_post_type` (`announcement` | `update` | `vote`)
- `p_title`
- `p_content`
- `p_images` (`jsonb` 배열, 최대 3)
- `p_link_preview` (`jsonb`, URL만 정규화)
- `p_is_pinned`
- `p_vote_options` (`vote` 타입일 때 2~5개)

**본문(`p_content`)**: 서비스 UI가 Markdown을 렌더링하지 않으면 `**`, `` ` ``, `###` 등을 쓰지 말고 **평문**으로 작성하세요. 구조는 줄바꿈·들여쓰기·`[섹션 제목]` 형태 등으로 표현할 수 있습니다.

예시:

```json
{
  "p_post_type": "announcement",
  "p_title": "새 공지 제목",
  "p_content": "공지 본문",
  "p_is_pinned": false
}
```

---

#### 6.7 `v1_llm_public_announcement_update`

목적: 기존 공지/업데이트/투표 수정

필수 스코프: `announcement.write`

필수 필드:

- `p_post_id`

나머지 필드는 생성 API와 동일하게 부분 수정 형태로 전달합니다.

예시:

```json
{
  "p_post_id": "<post uuid>",
  "p_title": "수정된 제목"
}
```

---

#### 6.8 `v1_llm_public_announcement_delete`

목적: 공지/업데이트 삭제 (`tbl_posts.is_deleted = true`)

필수 스코프: `announcement.write`

예시:

```json
{
  "p_post_id": "<post uuid>"
}
```

---

### 7. cURL 예시

#### 7.1 에코

```bash
curl -sS -X POST "{{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_echo" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: odd" \
  -H "apikey: {{SUPABASE_ANON_KEY}}" \
  -H "Authorization: Bearer {{SUPABASE_ANON_KEY}}" \
  -d '{
    "p_plain_token": "odd_pat_<발급_직후_복사한_평문>",
    "p_project_id": "{{PROJECT_ID}}",
    "p_payload": { "message": "hello" }
  }'
```

#### 7.2 공지 생성

```bash
curl -sS -X POST "{{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_announcement_create" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: odd" \
  -H "apikey: {{SUPABASE_ANON_KEY}}" \
  -H "Authorization: Bearer {{SUPABASE_ANON_KEY}}" \
  -d '{
    "p_plain_token": "odd_pat_<발급_직후_복사한_평문>",
    "p_project_id": "{{PROJECT_ID}}",
    "p_post_type": "announcement",
    "p_title": "새 공지 제목",
    "p_content": "공지 본문"
  }'
```

#### 7.3 프로젝트 수정

```bash
curl -sS -X POST "{{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_project_update" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: odd" \
  -H "apikey: {{SUPABASE_ANON_KEY}}" \
  -H "Authorization: Bearer {{SUPABASE_ANON_KEY}}" \
  -d '{
    "p_plain_token": "odd_pat_<발급_직후_복사한_평문>",
    "p_project_id": "{{PROJECT_ID}}",
    "p_title": "업데이트된 제목"
  }'
```

---

### 8. 관리용 RPC (로그인 세션 전용)

프로젝트 소유자가 설정 UI에서 사용하는 함수:

- `v1_create_project_access_token`
- `v1_fetch_project_access_tokens`
- `v1_revoke_project_access_token`

설정 UI:

- `{{SETTINGS_ACCESS_ABS_URL}}`

---

### 9. 배포·설정

1. 아래 SQL을 순서대로 적용:
   - `docs/sql/067_v1_llm_public_api.sql`
   - `docs/sql/068_v1_llm_project_api.sql`
   - `docs/sql/069_v1_llm_announcement_api.sql`
2. Supabase Dashboard → Project Settings → API → **Exposed schemas** 에 `odd` 포함 확인
3. 토큰 발급 시 필요한 스코프(`project.write`, `announcement.write` 등)를 명시적으로 넣기

---

### 10. 보안

1. 토큰을 Git·채팅·스크린샷에 올리지 말 것
2. 이미 노출된 토큰은 **즉시 폐기 후 재발급**
3. 이 공개 문서는 누구나 볼 수 있으므로, 비밀 값·내부 운영 URL을 넣지 말 것
4. 쓰기 자동화는 최소 권한 토큰으로만 실행할 것

---

*문서 버전: 3 · 스키마 `odd.project_llm_manual.v3`*
