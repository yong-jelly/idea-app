# Bot 시스템

## 개요

시스템 알림 및 자동화를 위한 Bot 계정 시스템입니다. Bot 계정은 사용자 개입 없이 자동으로 피드를 생성할 수 있으며, 프로젝트 생성 알림 등 시스템 이벤트를 사용자에게 전달합니다.

### 주요 기능

- **Bot 계정 관리**: Bot 타입 계정 생성 및 관리
- **Bot 역할 정의**: 시스템 알림, 프로젝트 어시스턴트, 커뮤니티 모더레이터 등
- **자동 피드 생성**: 프로젝트 생성 시 Bot이 자동으로 피드 생성
- **Bot UI 표시**: Bot 작성자 배지 및 특별한 스타일 적용

---

## 데이터베이스 스키마

### 1. 사용자 테이블 확장

`odd.tbl_users` 테이블에 `user_type` 컬럼이 추가되었습니다:

```sql
ALTER TABLE odd.tbl_users 
ADD COLUMN user_type text DEFAULT 'user' NOT NULL 
CHECK (user_type IN ('user', 'bot'));
```

**컬럼 설명**:
- `user_type`: 사용자 타입 (`'user'` 또는 `'bot'`)
- Bot 계정은 `auth_id`가 NULL일 수 있음 (시스템 Bot)

### 2. Bot 역할 코드

`odd.tbl_codes` 테이블에 Bot 역할 코드가 정의되어 있습니다:

| 코드 값 | 라벨 | 설명 |
|---------|------|------|
| `system_notification` | 시스템 알림 | 시스템 알림 봇 (프로젝트 생성 알림 등) |
| `project_assistant` | 프로젝트 어시스턴트 | 프로젝트 관련 자동화 봇 |
| `community_moderator` | 커뮤니티 모더레이터 | 커뮤니티 관리 봇 (향후 확장용) |

### 3. 시스템 Bot 계정

프로젝트 생성 알림 봇 (`@system_project_bot`)이 자동으로 생성됩니다:

- **username**: `system_project_bot`
- **display_name**: `프로젝트 알림 봇`
- **user_type**: `bot`
- **auth_id**: NULL (시스템 Bot)

---

## Bot 피드 생성

### 프로젝트 생성 시 자동 피드 생성

프로젝트가 생성되면 트리거(`trigger_after_project_created`)가 실행되어 Bot이 자동으로 피드를 생성합니다.

**트리거 함수**: `odd.trigger_create_project_feed()`

**피드 생성 함수**: `odd.v1_create_project_feed(project_id)`

**생성되는 피드**:
- **타입**: `project_created`
- **작성자**: `@system_project_bot` (Bot 계정)
- **내용**: 프로젝트 제목 및 설명 포함
- **이미지**: 프로젝트 썸네일

---

## 프론트엔드 타입 정의

### UserType

```typescript
export type UserType = "user" | "bot";
```

### BotRole

```typescript
export type BotRole = 
  | "system_notification"    // 시스템 알림 봇
  | "project_assistant"      // 프로젝트 어시스턴트 봇
  | "community_moderator";    // 커뮤니티 모더레이터 봇
```

### User 인터페이스 확장

```typescript
export interface User {
  // ... 기존 필드
  userType?: UserType;
  botRole?: BotRole;
}
```

### Bot 확인 헬퍼

```typescript
export function isBot(user: User | { userType?: UserType }): boolean {
  return user.userType === "bot";
}
```

---

## Bot UI 컴포넌트

### BotBadge

Bot 작성자를 표시하는 배지 컴포넌트입니다.

**파일**: `src/shared/ui/BotBadge.tsx`

**사용 예시**:
```typescript
import { BotBadge } from "@/shared/ui";

<BotBadge role="system_notification" size="sm" />
```

**역할별 스타일**:
- `system_notification`: 파란색 배지
- `project_assistant`: 초록색 배지
- `community_moderator`: 보라색 배지

### AuthorHeader 자동 Bot 표시

`AuthorHeader` 컴포넌트는 작성자가 Bot인 경우 자동으로 Bot 배지를 표시합니다:

- Bot 작성자 프로필 링크 비활성화
- Bot 배지 자동 표시
- Bot 역할별 색상 및 아이콘

---

## Bot 피드 생성 방법

### 1. 프로젝트 생성 시 자동 생성

프로젝트 생성 시 트리거가 자동으로 실행되어 Bot이 피드를 생성합니다.

**SQL 파일**: `docs/sql/035_v1_create_project_with_feed.sql`

### 2. 수동 생성 (향후 확장)

필요한 경우 다른 이벤트에서도 Bot 피드를 생성할 수 있습니다:

```sql
SELECT odd.v1_create_project_feed('project-uuid-here');
```

---

## Bot UI 표시 규칙

1. **Bot 배지**: Bot 작성자는 역할별 배지가 자동으로 표시됩니다
2. **프로필 링크**: Bot 프로필은 클릭 불가 (비활성화)
3. **아바타**: 시스템 아이콘 또는 기본 아바타 사용
4. **스타일**: Bot 작성자 피드는 일반 사용자와 동일한 스타일이지만 배지로 구분

---

## 관련 파일

- **SQL 스크립트**: `docs/sql/036_create_bot_system.sql`
- **프로젝트 생성 피드**: `docs/sql/035_v1_create_project_with_feed.sql`
- **타입 정의**: `src/entities/user/model/user.types.ts`
- **BotBadge 컴포넌트**: `src/shared/ui/BotBadge.tsx`
- **AuthorHeader**: `src/entities/feed/ui/FeedRowBase.tsx`

---

## 향후 확장

- **다른 Bot 역할 추가**: 필요에 따라 새로운 Bot 역할 추가 가능
- **Bot 설정 관리**: Bot별 설정 및 동작 커스터마이징
- **Bot 대시보드**: Bot 활동 로그 및 관리 인터페이스

