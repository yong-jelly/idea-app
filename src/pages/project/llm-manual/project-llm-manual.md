## Odd 프로젝트 LLM·에이전트 연동 사양 (공개)

> **문서 성격**: 이 블록은 **인증 없이** 공유 가능한 **프로젝트별 매뉴얼**입니다.  
> **비밀 값**: **액세스 토큰 평문은 문서에 포함하지 마세요.** 설정 화면에서만 발급·복사합니다.

---

### LLM·도구용 메타 (파싱용)

```json
{
  "schema": "odd.project_llm_manual.v2",
  "project_id": "{{PROJECT_ID}}",
  "project_key": "{{PROJECT_KEY}}",
  "manual_public_url": "{{MANUAL_ABS_URL}}",
  "settings_access_url": "{{SETTINGS_ACCESS_ABS_URL}}",
  "echo_page_url": "{{ECHO_ABS_URL}}",
  "supabase_url": "{{SUPABASE_URL}}",
  "supabase_anon_key": "{{SUPABASE_ANON_KEY}}",
  "public_rpc": ["v1_llm_public_echo", "v1_llm_public_project_read"],
  "token_prefix": "odd_pat_"
}
```

| 필드 | 설명 |
|------|------|
| `supabase_url` | Supabase 프로젝트 URL (REST·RPC 베이스). |
| `supabase_anon_key` | 브라우저에 포함되는 **Publishable(anon) 키**. 비밀 호출용이 아님. |
| `public_rpc` | **로그인 없이** `odd` 스키마에서 호출 가능한 함수 이름. |

---

### 1. 식별자

| 이름 | 형식 | 비밀? |
|------|------|--------|
| `project_id` | UUID (`{{PROJECT_ID}}`) | 아님 |
| `project_key` | `prj_xxxxxxxx_yyyyyyyy` (`{{PROJECT_KEY}}`) | 아님 (공개 핸들) |
| `access_token` | `odd_pat_` + 48 hex | **예** (Bearer에 해당) |

`project_key`는 `project_id`에서 앱과 동일한 규칙으로 **결정적 파생**됩니다.

---

### 2. 인증 모델 (공개 API)

**전제**: Supabase **PostgREST** `rpc` 호출. 세션 JWT 없이 **anon 키**만 사용합니다.  
**비밀**은 HTTP 헤더가 아니라 **RPC 본문**의 `p_plain_token`으로 전달합니다 (HTTPS 전제).

| 항목 | 값 |
|------|-----|
| Base URL | `{{SUPABASE_URL}}` |
| 스키마 | `odd` → 헤더 `Accept-Profile: odd` 필수 |
| API 키 | `apikey: {{SUPABASE_ANON_KEY}}`, `Authorization: Bearer {{SUPABASE_ANON_KEY}}` |
| 프로젝트 식별 | `p_project_id` **또는** `p_project_key` 중 하나 이상 (둘 다 주면 일치해야 함) |

---

### 3. 스코프 ↔ 엔드포인트

| RPC | 필요 스코프 | 설명 |
|-----|-------------|------|
| `v1_llm_public_echo` | `echo.invoke` | 요청 JSON을 그대로 되돌리는 헬스·연동 확인. |
| `v1_llm_public_project_read` | `project.read` | 프로젝트 메타·소개 필드 요약 조회. |

발급 시 토큰에 위 스코프가 **포함**되어 있어야 합니다. 그 외 스코프(`project.write`, `announcement.*` 등)는 **향후** 별도 RPC로 확장할 수 있습니다.

**전체 화이트리스트** (발급 시): `project.read`, `project.write`, `announcement.read`, `announcement.write`, `milestone.read`, `milestone.write`, `changelog.read`, `changelog.write`, `manual.read`, `echo.invoke`.

---

### 4. 공통 요청 형식 (REST)

**엔드포인트 (예시)**

```http
POST {{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_echo
POST {{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_project_read
```

**공통 헤더**

```http
Content-Type: application/json
Accept-Profile: odd
apikey: {{SUPABASE_ANON_KEY}}
Authorization: Bearer {{SUPABASE_ANON_KEY}}
```

---

### 5. `v1_llm_public_echo`

**목적**: 토큰·스코프·프로젝트 바인딩 검증 + 임의 JSON 에코.

**필요 스코프**: `echo.invoke`

**파라미터 (JSON body)**

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `p_plain_token` | string | 예 | `odd_pat_…` 평문 |
| `p_project_id` | uuid \| null | 조건 | `p_project_key`와 동시 생략 불가 |
| `p_project_key` | string \| null | 조건 | `prj_…` |
| `p_payload` | object | 아니오 | 기본 `{}` |

**성공 응답 (200, jsonb)**

```json
{
  "ok": true,
  "project_id": "{{PROJECT_ID}}",
  "project_key": "{{PROJECT_KEY}}",
  "echo": {
    "received": { },
    "server_time": "2026-03-21T12:00:00.000Z"
  },
  "token": {
    "id": "<uuid>",
    "prefix": "odd_pat_…",
    "scopes": ["echo.invoke", "project.read"]
  }
}
```

**실패 응답 (200, jsonb)** — HTTP는 200이어도 `ok: false` 일 수 있음.

```json
{
  "ok": false,
  "error": {
    "code": "INSUFFICIENT_SCOPE",
    "message": "필요 스코프: echo.invoke",
    "required_scopes": ["echo.invoke"],
    "token_scopes": ["project.read"]
  }
}
```

**`error.code` 목록 (대표)**

| code | 의미 |
|------|------|
| `INVALID_ARGUMENT` | `project_id` / `project_key` 조합 오류 |
| `INVALID_PROJECT_KEY` | 키에 해당하는 프로젝트 없음 |
| `NOT_FOUND` | `project_id` 없음 |
| `INVALID_TOKEN` | 해시 불일치·형식 오류·만료·폐기 |
| `INSUFFICIENT_SCOPE` | 토큰에 필요 스코프 없음 |
| `INTERNAL` | 서버 예외 |

---

### 6. `v1_llm_public_project_read`

**목적**: 공개 가능한 수준의 프로젝트 필드 반환.

**필요 스코프**: `project.read`

**파라미터**

| 이름 | 타입 | 필수 |
|------|------|------|
| `p_plain_token` | string | 예 |
| `p_project_id` | uuid \| null | 조건 |
| `p_project_key` | string \| null | 조건 |

**성공 시 `project` 객체 필드 (예시)**  
`title`, `short_description`, `full_description`, `category`, `tech_stack`, `repository_url`, `demo_url`, `status`, `featured`, `created_at`, `updated_at`

---

### 7. cURL 예시

**에코**

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

**프로젝트 읽기**

```bash
curl -sS -X POST "{{SUPABASE_URL}}/rest/v1/rpc/v1_llm_public_project_read" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: odd" \
  -H "apikey: {{SUPABASE_ANON_KEY}}" \
  -H "Authorization: Bearer {{SUPABASE_ANON_KEY}}" \
  -d '{
    "p_plain_token": "odd_pat_<…>",
    "p_project_id": "{{PROJECT_ID}}"
  }'
```

---

### 8. 관리용 RPC (로그인 세션 전용)

토큰 **발급·목록·폐기**는 Supabase Auth가 있는 세션에서만:

- `v1_create_project_access_token`
- `v1_fetch_project_access_tokens`
- `v1_revoke_project_access_token`

엔드포인트: `{{SETTINGS_ACCESS_ABS_URL}}` (브라우저 UI).

---

### 9. LLM 시스템 프롬프트 (복사용)

```text
- project_id = {{PROJECT_ID}}
- project_key = {{PROJECT_KEY}}
- Supabase: {{SUPABASE_URL}}, 스키마 odd, anon 키는 클라이언트와 동일.
- 공개 RPC: v1_llm_public_echo (echo.invoke), v1_llm_public_project_read (project.read).
- 토큰은 환경 변수로만 보관하고 로그에 남기지 마라.
```

---

### 10. 보안

1. 토큰을 저장소·채팅에 올리지 말 것.  
2. 공개 매뉴얼 URL만으로는 **쓰기 불가** — `odd_pat_` 가 있어야 함.  
3. `067_v1_llm_public_api.sql` 미적용 시 RPC는 404/권한 오류가 난다.

---

### 11. 배포·설정

1. **SQL**: `docs/sql/067_v1_llm_public_api.sql` 을 DB에 적용한다.  
2. **Supabase 대시보드** → Project Settings → API → **Exposed schemas** 에 `odd` 가 포함되어 있어야 PostgREST가 `odd` RPC를 노출한다. (이미 `odd` RPC를 쓰고 있다면 동일.)

---

*문서 버전: 2 · 스키마 `odd.project_llm_manual.v2`*
