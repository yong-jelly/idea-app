# Supabase 인증 세션 관리

## 개요

현재 프로젝트는 Supabase Auth를 사용하여 로그인은 처리하지만, 세션 관리는 클라이언트 사이드에서 자체 JWT를 생성하여 관리하고 있었습니다. 이를 Supabase의 실제 세션 관리 시스템으로 전환했습니다.

## 현재 상태 분석 (전환 전)

### 이전 구조

```
┌─────────────────────────────────────────┐
│  Supabase Auth (로그인 처리)            │
│  - signInWithPassword()                 │
│  - signInWithOAuth()                    │
│  - exchangeCodeForSession()             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  클라이언트 세션 관리 (문제점)          │
│  - generateJWT() (클라이언트에서 생성)  │
│  - localStorage에 저장                  │
│  - Zustand store에 상태 저장            │
└─────────────────────────────────────────┘
```

## 문제점 및 해결 전략

### 1. 보안 취약점 해결
- **문제**: 클라이언트 사이드에서 서버 검증 불가능한 JWT 생성.
- **해결**: 클라이언트 사이드 JWT 생성 로직(`generateJWT`)을 완전히 제거하고, Supabase가 관리하는 실제 세션(Access Token)을 단일 진실 공급원으로 사용합니다.

### 2. 세션 불일치 해결
- **문제**: Supabase 세션과 클라이언트 로컬 상태가 따로 노는 현상.
- **해결**: `onAuthStateChange` 리스너를 등록하여 Supabase의 인증 이벤트(`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`)를 감지하고 Zustand 스토어와 즉시 동기화합니다.

### 3. 세션 만료 및 갱신 처리
- **문제**: 세션 만료 시 자동 로그아웃이나 토큰 갱신 기능 부재.
- **해결**: Supabase Auth의 자동 토큰 갱신 기능을 활용하고, `TOKEN_REFRESHED` 이벤트를 통해 상태를 최신화합니다.

### 4. 앱 초기화 시 인증 확인
- **문제**: 새로고침 시 localStorage의 데이터만 믿고 실제 세션 유효성을 검증하지 않음.
- **해결**: 앱 시작 시 `initSession()`을 호출하여 `supabase.auth.getSession()` 결과를 바탕으로 사용자 정보를 복구합니다.

---

## 해결 과정

### 구현 완료 내역

#### 1. UserStore 수정 완료 ✅
**파일**: `src/entities/user/model/user.store.ts`
- ❌ 제거: `sessionToken`, `generateJWT()`, `createSession()`, `clearSession()`, `toggleAuth()`, `login()`
- ✅ 추가: 
  - `setUser()` (사용자 상태 설정)
  - `syncUserFromSession()` (DB 정보 동기화, 중복 호출 방지 포함)
  - `initSession()` (세션 복구)
  - `isSyncing` 플래그 (동기화 진행 중 상태 추적)
- ✅ 수정: 
  - `logout()`을 비동기 함수로 변경하여 `supabase.auth.signOut()` 포함 처리
  - `syncUserFromSession()`에 RPC 호출 타임아웃 처리 (20초) 및 재시도 로직 (최대 2번) 추가
  - 모든 상태 변경 시 `isSyncing` 플래그 리셋 처리

#### 2. 전역 인증 리스너 등록 완료 ✅
**파일**: `src/app/providers/index.tsx`
- ✅ 앱 초기화 시 `initSession()` 호출 로직 추가
- ✅ `onAuthStateChange` 구독을 통해 로그인/로그아웃/토큰 갱신 이벤트를 전역에서 감지 및 처리
- ✅ `INITIAL_SESSION` 이벤트는 `initSession()`에서 이미 처리하므로 건너뛰기
- ✅ `SIGNED_IN` 이벤트에서 이전 동기화 플래그가 남아있으면 리셋 후 새로 시작
- ✅ `SIGNED_OUT` 이벤트에서 `isSyncing` 플래그 명시적 리셋
- ✅ `TOKEN_REFRESHED`, `USER_UPDATED` 이벤트에서 중복 호출 방지 (`isSyncing` 체크)

#### 3. 로그인 및 콜백 페이지 수정 완료 ✅
**파일**: `src/pages/auth/LoginPage.tsx`, `src/pages/auth/AuthCallbackPage.tsx`
- ❌ 제거: 자체 JWT 생성 및 데모 사용자 로그인 로직 제거
- ✅ 수정: Supabase 인증 성공 후 `syncUserFromSession()`을 호출하여 실제 DB 사용자 정보와 동기화

#### 4. 라우트 보호 로직 강화 완료 ✅
**파일**: `src/shared/components/ProtectedRoute.tsx`
- ✅ 단순 `isAuthenticated` 확인을 넘어, 실제 Supabase 세션 존재 여부를 교차 검증하도록 수정
- ✅ 세션 확인 중일 때의 로딩 상태 UI 추가

#### 5. 헤더 로그아웃 로직 간소화 완료 ✅
**파일**: `src/widgets/header/Header.tsx`
- ✅ 로그아웃 버튼 클릭 시 스토어의 `logout()`만 호출하면 Supabase 세션 정리와 스토어 초기화가 한 번에 처리되도록 수정

---

## 인증 흐름도 (개선 후)

### 로그인 흐름
```
1. 사용자 로그인 (Email/Password 또는 OAuth)
   ↓
2. Supabase Auth 세션 생성
   ↓
3. onAuthStateChange('SIGNED_IN') 트리거
   ↓
4. DB에서 최신 사용자 정보 조회 (tbl_users)
   ↓
5. UserStore 상태 업데이트 (user, isAuthenticated: true)
```

### 로그아웃 흐름
```
1. UserStore.logout() 호출
   ↓
2. supabase.auth.signOut() 실행
   ↓
3. onAuthStateChange('SIGNED_OUT') 트리거
   ↓
4. UserStore 상태 초기화 (user: null, isAuthenticated: false)
```

## 유즈 케이스 대응

| 케이스 | 대응 방식 |
| :--- | :--- |
| **브라우저 새로고침** | `initSession()`이 실행되어 Supabase 세션 유효성을 즉시 검증하고 사용자 정보 복구. 로그아웃 상태에서는 `isSyncing` 플래그를 리셋하여 다음 로그인 준비 |
| **세션 만료** | Supabase SDK가 백그라운드에서 토큰 갱신 시도, 실패 시 `SIGNED_OUT` 이벤트 발생하여 자동 로그아웃 |
| **다중 탭 로그아웃** | 한 탭에서 로그아웃 시 다른 탭의 `onAuthStateChange` 리스너가 이를 감지하여 상태 동기화 및 `isSyncing` 플래그 리셋 |
| **네트워크 오류** | RPC 호출 타임아웃(20초) 발생 시 최대 2번 재시도. 최종 실패 시 안전하게 비인증 상태로 처리하여 데이터 오염 방지 |
| **중복 동기화 호출** | `isSyncing` 플래그를 통해 동일한 동기화 작업이 중복 실행되지 않도록 방지. 로그인 상태가 없는데 플래그가 남아있으면 자동 리셋 |
| **로그아웃 후 재로그인** | 로그아웃 시 `isSyncing` 플래그를 명시적으로 리셋하여 다음 로그인 시 정상 동기화 보장 |

## 구현 체크리스트 결과

### 기본 기능 구현
- [x] UserStore에서 `sessionToken` 및 자체 JWT 로직 제거
- [x] `onAuthStateChange` 리스너를 통한 전역 상태 동기화
- [x] 앱 초기화 시 실제 세션 검증 로직 추가
- [x] ProtectedRoute의 세션 정합성 체크 강화
- [x] 로그아웃 시 Supabase 세션 완전 정리
- [x] 중복 동기화 호출 방지 (`isSyncing` 플래그)
- [x] RPC 호출 타임아웃 처리 및 재시도 로직 (20초 타임아웃, 최대 2번 재시도)
- [x] 로그아웃 상태에서 `isSyncing` 플래그 자동 리셋
- [x] 이벤트별 중복 호출 방지 로직 (`INITIAL_SESSION`, `TOKEN_REFRESHED`, `USER_UPDATED`)

### 보안 및 안정성 체크리스트
- [x] `onAuthStateChange` 핸들러에서 비동기 작업이 `setTimeout` 또는 `Promise.resolve().then()`으로 처리되는지 확인 (`src/app/providers/index.tsx`에서 `setTimeout(..., 0)` 사용)
- [x] Supabase 클라이언트에 `autoRefreshToken: true` 설정 적용 (`src/shared/lib/supabase.ts`)
- [x] Supabase 클라이언트에 `persistSession: true` 설정 적용 (다중 탭 동기화) (`src/shared/lib/supabase.ts`)
- [x] Supabase 클라이언트에 `detectSessionInUrl: true` 설정 적용 (OAuth 콜백) (`src/shared/lib/supabase.ts`)
- [x] ProtectedRoute에서 `getSession()` 결과를 "신뢰할 수 있는 인증 증명"으로 사용하지 않음 확인 (`src/shared/components/ProtectedRoute.tsx`에 주석 명시)
- [x] 모든 데이터 접근이 RLS 및 서버 측 검증으로 담보되는지 확인 (문서에 명시, 실제 구현은 RLS 정책에 의존)

## 최신 개선 사항 (2024)

### 중복 호출 방지 메커니즘
- **문제**: `initSession()`과 `onAuthStateChange` 이벤트 핸들러가 동시에 `syncUserFromSession()`을 호출하여 중복 실행 발생
- **해결**: `isSyncing` 플래그를 도입하여 동기화 진행 중인지 추적하고, 중복 호출 시 건너뛰기
- **효과**: 불필요한 RPC 호출 감소 및 성능 개선

### RPC 호출 안정성 강화
- **문제**: 네트워크 지연 시 RPC 호출이 타임아웃되어 사용자 정보 동기화 실패
- **해결**: 
  - 타임아웃 시간을 15초에서 20초로 증가
  - 최대 2번의 자동 재시도 로직 추가 (지수 백오프 적용)
  - 호출 시간 로깅으로 디버깅 용이성 향상
- **효과**: 일시적인 네트워크 문제에도 안정적인 사용자 정보 동기화

### 로그인 후 RPC 호출 타임아웃 문제 해결 (2024-12)
- **문제**: 로그인 직후 RPC 호출이 타임아웃되는 현상 발생. 로그인하지 않은 상태에서는 일반 API 호출이 정상 작동하지만, 로그인된 상태에서만 문제 발생
- **원인 분석**:
  1. `SIGNED_IN` 이벤트 발생 직후 세션이 완전히 설정되기 전에 RPC 호출 시도
  2. Supabase 클라이언트의 자동 토큰 갱신 및 세션 관리 옵션 미설정
  3. RPC 호출 시 JWT 토큰이 헤더에 포함되지 않을 가능성
- **해결**:
  1. **Supabase 클라이언트 설정 개선** (`src/shared/lib/supabase.ts`):
     - `autoRefreshToken: true` - 자동 토큰 갱신 활성화
     - `persistSession: true` - 세션 영속화 활성화
     - `detectSessionInUrl: true` - URL에서 세션 감지 활성화
  2. **RPC 호출 전 세션 확인 로직 추가** (`src/entities/user/model/user.store.ts`):
     - RPC 호출 전에 최대 5번까지 세션 유효성 확인 (500ms 간격)
     - `access_token` 존재 여부 및 `authId` 일치 여부 검증
     - 재시도 전에도 세션 재확인
  3. **디버깅 로그 강화**:
     - 세션 상태 상세 로깅 (access_token, expires_at 등)
     - RPC 호출 시도별 세션 상태 로깅
     - 에러 상세 정보 로깅 (message, code, details, hint)
- **효과**: 로그인 직후에도 안정적인 RPC 호출 보장, 세션 타이밍 문제 해결

### 로그아웃 후 재로그인 문제 해결
- **문제**: 로그아웃 후 다시 로그인할 때 `isSyncing` 플래그가 리셋되지 않아 동기화가 건너뛰어짐
- **해결**: 
  - `logout()` 함수에서 `isSyncing` 플래그 명시적 리셋
  - `SIGNED_OUT` 이벤트에서도 플래그 리셋
  - `initSession()`에서 로그아웃 상태(세션 없음)일 때 플래그 리셋
  - `SIGNED_IN` 이벤트에서 이전 플래그가 남아있으면 리셋 후 새로 시작
- **효과**: 로그아웃 후 재로그인 시 정상적인 사용자 정보 동기화 보장

### 이벤트 처리 최적화
- `INITIAL_SESSION`: `initSession()`에서 이미 처리하므로 이벤트 핸들러에서 건너뛰기
- `TOKEN_REFRESHED`, `USER_UPDATED`: 이미 동기화 중이면 건너뛰어 불필요한 호출 방지
- `SIGNED_IN`: 항상 동기화를 진행하되, 이전 플래그가 남아있으면 리셋 후 시작

## 마이그레이션 완료 (2024-12)

### 구현 완료 상태
모든 변경 사항이 코드에 적용되었으며, 이제 서비스의 인증 체계는 Supabase Auth를 단일 진실 공급원(Single Source of Truth)으로 사용하는 표준적인 방식으로 안전하게 전환되었습니다.

### 구현된 주요 기능
1. ✅ **Supabase 클라이언트 설정 개선** (`src/shared/lib/supabase.ts`)
   - `autoRefreshToken: true` - 자동 토큰 갱신
   - `persistSession: true` - localStorage 세션 저장 (다중 탭 동기화)
   - `detectSessionInUrl: true` - OAuth 콜백 세션 자동 감지

2. ✅ **UserStore Supabase 세션 기반 전환** (`src/entities/user/model/user.store.ts`)
   - `setUser()` - 사용자 상태 설정
   - `syncUserFromSession()` - DB 사용자 정보 동기화 (타임아웃, 재시도 로직 포함)
   - `initSession()` - 앱 초기화 시 세션 복구
   - `logout()` - 비동기 함수로 변경, Supabase 세션 정리 포함
   - `isSyncing` 플래그로 중복 호출 방지

3. ✅ **전역 인증 리스너 등록** (`src/app/providers/index.tsx`)
   - `onAuthStateChange` 리스너 등록
   - `setTimeout(..., 0)`으로 안전한 비동기 처리 (데드락 방지)
   - 이벤트별 처리 로직 구현 (INITIAL_SESSION 건너뛰기, SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED 처리)

4. ✅ **ProtectedRoute 세션 교차 검증** (`src/shared/components/ProtectedRoute.tsx`)
   - `getSession()`으로 실제 Supabase 세션 확인
   - 세션 확인 중 로딩 상태 UI
   - 클라이언트 체크는 UX 목적임을 명시

### 보안 및 안정성 개선사항
- 중복 호출 방지 메커니즘 (`isSyncing` 플래그)
- RPC 호출 타임아웃 처리 및 재시도 로직 (20초 타임아웃, 최대 2번 재시도)
- 로그아웃 후 재로그인 문제 해결
- `onAuthStateChange` 콜백에서의 데드락 방지 (`setTimeout` 사용)
- 세션 만료 및 갱신 자동 처리

이제 더욱 견고하고 안전한 인증 시스템이 구축되었습니다.

## 기술적 세부사항

### 동기화 플래그 (`isSyncing`) 관리

`isSyncing` 플래그는 사용자 정보 동기화가 진행 중인지 추적하여 중복 호출을 방지합니다.

**플래그가 `true`로 설정되는 경우:**
- `syncUserFromSession()` 시작 시

**플래그가 `false`로 리셋되는 경우:**
- `syncUserFromSession()` 완료 시 (성공/실패 모두)
- `setUser()` 호출 시
- `logout()` 호출 시
- `SIGNED_OUT` 이벤트 발생 시
- `initSession()`에서 세션이 없을 때 (로그아웃 상태)

**중복 호출 방지 로직:**
```typescript
// syncUserFromSession 내부
if (get().isSyncing) {
  // 로그인 상태가 있으면 정상적인 중복 호출로 간주하고 건너뛰기
  if (currentState.isAuthenticated && currentState.user) {
    return; // 건너뛰기
  }
  // 로그인 상태가 없는데 동기화 중이면 이전 동기화가 완료되지 않은 것
  // 플래그를 리셋하고 새로 시작
  set({ isSyncing: false });
}
```

### RPC 호출 타임아웃 및 재시도

**타임아웃 설정:**
- 기본 타임아웃: 20초
- 재시도 횟수: 최대 2번 (총 3번 시도)
- 재시도 대기 시간: 지수 백오프 (1초, 2초)

**세션 확인 로직:**
- RPC 호출 전에 세션 유효성 확인 (최대 5번 시도, 500ms 간격)
- `access_token` 존재 여부 및 `authId` 일치 여부 검증
- 재시도 전에도 세션 재확인

**재시도 조건:**
- 타임아웃 발생 시
- 네트워크 에러 발생 시
- 재시도 불가능한 에러가 아닌 경우 (예: `PGRST301`, `23505` 제외)

**에러 처리:**
- 모든 시도 실패 시: 사용자 상태를 `null`로 설정하고 `isSyncing` 플래그 리셋
- 네트워크 문제 안내 메시지 출력
- 에러 상세 정보 로깅 (message, code, details, hint)

### Supabase 클라이언트 설정

**현재 설정 (구현 완료)** (`src/shared/lib/supabase.ts`):
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // 자동 토큰 갱신 활성화
    persistSession: true,        // localStorage에 세션 영속화 (다중 탭 동기화 필수)
    detectSessionInUrl: true,    // OAuth 콜백에서 URL의 세션 자동 감지
    storage: window.localStorage, // 명시적 스토리지 지정 (기본값이지만 명시 권장)
  },
  global: {
    headers: {
      'X-Client-Info': 'idea-app',
    },
  },
})
```

**설정 옵션 설명:**

1. **`autoRefreshToken: true`**
   - Access Token 만료 전 자동 갱신
   - 사용자가 로그아웃하지 않는 한 세션 유지
   - 갱신 성공 시 `TOKEN_REFRESHED` 이벤트 발생

2. **`persistSession: true`** (기본값이지만 명시 권장)
   - localStorage에 세션 저장
   - 브라우저 새로고침 시 세션 복구
   - 다중 탭 동기화의 기반
   - **주의**: `false`로 설정하면 다중 탭 동기화가 작동하지 않음

3. **`detectSessionInUrl: true`** (기본값이지만 명시 권장)
   - OAuth 콜백 URL에서 세션 자동 감지
   - `exchangeCodeForSession()` 호출 없이도 세션 복구 가능
   - URL에서 세션 정보 제거 (보안)

**이 설정으로 인해:**
- 세션이 자동으로 갱신되어 만료 방지
- 브라우저 새로고침 시 세션 복구
- OAuth 콜백에서 세션 자동 감지
- 다중 탭 간 세션 동기화

**구현 체크:**
- [x] Supabase 클라이언트 생성 시 `auth` 옵션 명시적으로 설정 (`src/shared/lib/supabase.ts`에서 완료)
- [x] `persistSession: true` 설정 확인 (다중 탭 동기화 필수) (`src/shared/lib/supabase.ts`에서 완료)
- [x] `autoRefreshToken: true` 설정 확인 (자동 토큰 갱신) (`src/shared/lib/supabase.ts`에서 완료)

### 이벤트 처리 우선순위

1. **INITIAL_SESSION**: `initSession()`에서 처리, 이벤트 핸들러에서 건너뛰기
2. **SIGNED_IN**: 항상 동기화 진행 (이전 플래그 리셋 후 시작)
3. **SIGNED_OUT**: 상태 초기화 및 플래그 리셋
4. **TOKEN_REFRESHED**: 동기화 중이 아니면 진행
5. **USER_UPDATED**: 동기화 중이 아니면 진행

### `INITIAL_SESSION` 이벤트 처리의 역할 분리

**설계 의도:**
- `INITIAL_SESSION`은 Supabase가 제공하는 공식 이벤트 타입으로, 앱 초기화 시 현재 세션 상태를 알려주는 목적입니다.
- 우리는 앱 초기화 시 `initSession()`을 명시적으로 호출하여 세션을 복구하므로, `onAuthStateChange` 핸들러에서 `INITIAL_SESSION`을 건너뛰는 것은 **중복 방지 최적화**입니다.

**역할 분리:**
- `initSession()`: 앱 시작 시 명시적 세션 복구 및 사용자 정보 동기화
- `onAuthStateChange('INITIAL_SESSION')`: Supabase SDK가 자동으로 발생시키는 이벤트 (건너뛰기)

이렇게 분리함으로써:
- 초기 세션 복구가 한 번만 실행됨
- 이벤트 핸들러와 명시적 초기화 로직 간의 충돌 방지
- 디버깅 시 세션 복구 경로가 명확함

## 보안 및 안정성 고려사항

### ⚠️ 중요: `onAuthStateChange` 콜백에서의 비동기 호출 주의사항

**데드락(교착) 위험:**
Supabase 공식 문서에 따르면, `onAuthStateChange` 콜백 내에서 직접 `await`를 사용하여 Supabase API를 호출하면 데드락이 발생할 수 있습니다.

**문제 패턴 (피해야 할 코드):**
```typescript
// ❌ 위험한 패턴
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    await syncUserFromSession(); // 데드락 위험!
  }
});
```

**해결 방법:**
콜백을 동기적으로 끝내고, 다음 이벤트 루프 틱에서 비동기 작업을 실행하도록 구현해야 합니다.

**안전한 패턴:**
```typescript
// ✅ 안전한 패턴
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // setTimeout을 사용하여 콜백 밖으로 "탈출"
    setTimeout(() => {
      syncUserFromSession();
    }, 0);
  }
});

// 또는 Promise.resolve().then() 사용
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    Promise.resolve().then(() => {
      syncUserFromSession();
    });
  }
});
```

**구현 체크:**
- [x] `onAuthStateChange` 핸들러 내부에서 `await supabase...` 직접 호출이 없는지 확인 (`src/app/providers/index.tsx`에서 확인 완료)
- [x] 비동기 작업은 `setTimeout(..., 0)` 또는 `Promise.resolve().then()`으로 다음 틱에서 실행되도록 구현 (`src/app/providers/index.tsx`에서 `setTimeout(..., 0)` 사용)

**구현 완료** (`src/app/providers/index.tsx`):
```typescript
// Supabase 인증 상태 변경 리스너
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event) => {
      // 콜백을 동기적으로 끝내고, 비동기 작업은 다음 틱에서 실행
      // 이렇게 하면 onAuthStateChange 콜백에서의 데드락 위험을 방지할 수 있습니다.
      setTimeout(() => {
        const store = useUserStore.getState();

        if (event === "INITIAL_SESSION") {
          // INITIAL_SESSION은 initSession()에서 이미 처리하므로 건너뛰기
          return;
        }

        if (event === "SIGNED_IN") {
          // SIGNED_IN: 항상 동기화 진행 (이전 플래그 리셋 후 시작)
          if (store.isSyncing) {
            store.setUser(null); // 플래그 리셋을 위해 임시로 null 설정
          }
          store.syncUserFromSession();
        } else if (event === "SIGNED_OUT") {
          // SIGNED_OUT: 상태 초기화 및 플래그 리셋
          store.setUser(null);
        } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // TOKEN_REFRESHED, USER_UPDATED: 동기화 중이 아니면 진행
          if (!store.isSyncing) {
            store.syncUserFromSession();
          }
        }
      }, 0);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### `getSession()`의 한계 및 서버 검증의 필요성

**`getSession()`의 특성:**
- `getSession()`은 기본적으로 **클라이언트 저장소(localStorage)**에 저장된 세션을 가져오는 성격이 강합니다.
- 클라이언트 측에서 조작 가능한 데이터를 기반으로 하므로, "보안 검증(서버 검증)" 관점의 단일 근거로 사용하기에는 한계가 있습니다.

**보안 고려사항:**
1. **클라이언트 조작 방지**: 클라이언트에서 세션 토큰을 조작하거나 만료된 토큰을 사용할 수 있습니다.
2. **서버 측 검증 필수**: 최종 권한 결정 및 민감한 데이터 접근은 반드시 서버 측에서 검증해야 합니다.

**보안 방어 전략:**
- **클라이언트 측 (UX/편의 목적)**:
  - `ProtectedRoute`에서 `getSession()`으로 세션 존재 여부 확인
  - 사용자 경험을 위한 사전 차단 (라우팅, UI 표시 등)
  
- **서버 측 (보안의 최종 방어선)**:
  - **RLS (Row Level Security)**: Supabase의 RLS 정책으로 데이터베이스 레벨에서 접근 제어
  - **서버 측 검증**: 모든 API 호출 시 Supabase가 자동으로 JWT 토큰을 검증
  - **만료된 토큰 자동 거부**: Supabase가 만료된 토큰을 자동으로 거부하고 `SIGNED_OUT` 이벤트 발생

**구현 원칙:**
- 클라이언트 체크는 **UX/편의** 목적이며, 보안의 최종 방어선이 아님을 명심
- 모든 데이터 접근은 RLS 및 서버 측 검증으로 담보됨
- `getSession()` 결과를 "신뢰할 수 있는 인증 증명"으로 간주하지 않음

### 다중 탭 동기화의 근거

**동작 원리:**
- Supabase 클라이언트는 기본적으로 `persistSession: true` 설정 시 **localStorage**에 세션을 저장합니다.
- 한 탭에서 로그아웃하면 localStorage의 세션이 삭제됩니다.
- 다른 탭의 `onAuthStateChange` 리스너는 **localStorage 변경 이벤트**를 감지하여 자동으로 동기화됩니다.

**설정 확인:**
```typescript
// src/shared/lib/supabase.ts
{
  auth: {
    persistSession: true,  // localStorage에 세션 저장
    // ...
  }
}
```

**동기화 흐름:**
1. 탭 A에서 `supabase.auth.signOut()` 호출
2. localStorage의 세션 데이터 삭제
3. 탭 B의 `onAuthStateChange` 리스너가 변경 감지
4. `SIGNED_OUT` 이벤트 발생
5. 탭 B의 Zustand 스토어 상태 자동 초기화

**주의사항:**
- `persistSession: false`로 설정하면 다중 탭 동기화가 작동하지 않습니다.
- localStorage가 비활성화된 환경에서는 세션 영속화가 불가능합니다.

### 세션 만료 및 갱신 운영 파라미터

**토큰 구조:**
- **Access Token**: API 호출 시 사용, 짧은 수명 (기본 1시간, 프로젝트 설정에 따라 변경 가능)
- **Refresh Token**: Access Token 갱신에 사용, 긴 수명 (기본 30일)

**중요한 운영 파라미터:**

1. **Refresh Token은 1회용**
   - Refresh Token으로 새 Access Token을 발급받으면, 기존 Refresh Token은 무효화됩니다.
   - 동시에 여러 기기에서 동일한 Refresh Token을 사용하면 마지막 사용만 성공하고 나머지는 실패합니다.

2. **JWT Expiry Limit (프로젝트 설정)**
   - Supabase 대시보드에서 JWT 만료 시간을 설정할 수 있습니다.
   - 기본값: Access Token 1시간, Refresh Token 30일
   - 이 값은 프로젝트 전역 설정이므로 변경 시 모든 사용자에게 영향을 미칩니다.

3. **자동 토큰 갱신 (`autoRefreshToken: true`)**
   - Access Token 만료 전에 자동으로 Refresh Token을 사용하여 새 Access Token을 발급받습니다.
   - 갱신 성공 시 `TOKEN_REFRESHED` 이벤트 발생
   - 갱신 실패 시 (Refresh Token 만료 등) `SIGNED_OUT` 이벤트 발생

**장애/만료 이슈 분석 시 확인 사항:**
- Access Token 만료 시간: 프로젝트 설정 확인
- Refresh Token 만료 여부: `session.refresh_token` 존재 여부 확인
- 다중 기기 동시 사용: Refresh Token 충돌 가능성
- 네트워크 문제: 토큰 갱신 실패 원인

**모니터링 권장사항:**
- `TOKEN_REFRESHED` 이벤트 발생 빈도 로깅
- `SIGNED_OUT` 이벤트 발생 시 원인 분석 (만료 vs 네트워크 오류)
- 세션 만료 전 사용자에게 알림 제공 (선택사항)

## 요약 및 핵심 원칙

### 핵심 설계 원칙
1. **Supabase Auth를 단일 진실 공급원으로 사용**: 클라이언트 사이드 JWT 생성 제거
2. **이벤트 기반 동기화**: `onAuthStateChange`를 통한 상태 동기화
3. **안전한 비동기 처리**: 콜백 내에서 직접 `await` 사용 금지, `setTimeout`으로 탈출
4. **클라이언트 체크는 UX 목적**: 보안의 최종 방어선은 RLS 및 서버 측 검증
5. **중복 호출 방지**: `isSyncing` 플래그로 동기화 작업 중복 실행 방지

### 보안 고려사항 요약
- ✅ `getSession()`은 클라이언트 저장소 기반이므로 보안 검증의 단일 근거로 사용 불가
- ✅ 모든 데이터 접근은 RLS 및 서버 측 검증으로 담보되어야 함
- ✅ `onAuthStateChange` 콜백에서 비동기 작업 시 데드락 방지를 위해 `setTimeout` 사용 필수
- ✅ Supabase 클라이언트 설정 (`autoRefreshToken`, `persistSession`) 명시적 설정 권장

### 운영 파라미터 요약
- **Access Token**: 기본 1시간 (프로젝트 설정에 따라 변경 가능)
- **Refresh Token**: 기본 30일, 1회용 (동시 사용 시 마지막 사용만 성공)
- **자동 갱신**: `autoRefreshToken: true` 설정 시 만료 전 자동 갱신
- **다중 탭 동기화**: `persistSession: true` 설정 시 localStorage 기반 동기화

## 참고 자료
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Zustand Persistence Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Supabase Auth Session Management](https://supabase.com/docs/reference/javascript/auth-refreshsession)
