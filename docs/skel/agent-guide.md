# LLM을 위한 에이전트 문서

이 문서는 LLM 에이전트가 프로젝트를 이해하고 코드를 작성하는 데 필요한 정보를 제공합니다.

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처 패턴](#2-아키텍처-패턴)
3. [코딩 컨벤션](#3-코딩-컨벤션)
4. [파일 구조 규칙](#4-파일-구조-규칙)
5. [API 패턴](#5-api-패턴)
6. [상태 관리 패턴](#6-상태-관리-패턴)
7. [스타일링 규칙](#7-스타일링-규칙)
8. [에러 처리 패턴](#8-에러-처리-패턴)

## 1. 프로젝트 개요

### 기술 스택
- **런타임**: Bun.js
- **프레임워크**: React 19
- **라우팅**: React Router v7
- **상태관리**: Zustand
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **스타일링**: Tailwind CSS 3.x
- **빌드 도구**: Vite
- **배포**: Vercel
- **문서화**: Storybook

### 아키텍처
- **Feature-Sliced Design (FSD)** 아키텍처 사용
- 레이어: `app` → `pages` → `widgets` → `features` → `entities` → `shared`

## 2. 아키텍처 패턴

### 레이어 구조

```
app/          # 앱 초기화, 라우터, 프로바이더
pages/        # 페이지 컴포넌트
widgets/      # 독립적 UI 블록
features/     # 사용자 시나리오 기능
entities/     # 비즈니스 엔티티
shared/       # 공용 코드
```

### Import 규칙

- `app` → 모든 레이어 import 가능
- `pages` → `widgets`, `features`, `entities`, `shared` import 가능
- `widgets` → `features`, `entities`, `shared` import 가능
- `features` → `entities`, `shared` import 가능
- `entities` → `shared` import 가능
- `shared` → 다른 레이어 import 불가

### 절대 경로 사용

모든 import는 `@/` 별칭을 사용:

```typescript
import { Button } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { FeedTimeline } from "@/widgets/feed-timeline";
```

## 3. 코딩 컨벤션

### 네이밍 규칙

- **컴포넌트**: PascalCase (`UserAvatar`, `FeedTimeline`)
- **함수/변수**: camelCase (`fetchUser`, `isLoading`)
- **상수**: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **타입/인터페이스**: PascalCase (`User`, `Project`)
- **파일명**: 컴포넌트는 PascalCase, 유틸은 camelCase/kebab-case

### 주석 패턴

```typescript
/**
 * 함수 설명
 * 
 * 상세 설명 (필요한 경우)
 * 
 * @param param1 - 파라미터 설명
 * @returns 반환값 설명
 * @throws {Error} 에러 설명
 */
export function functionName(param1: string): ReturnType {
  // 구현
}
```

### 타입 정의

모든 타입은 명시적으로 정의:

```typescript
interface ComponentProps {
  /** prop 설명 */
  propName: string;
  optionalProp?: number;
}
```

## 4. 파일 구조 규칙

### 엔티티 구조

```
entities/
└── user/
    ├── api/
    │   └── user.api.ts        # API 함수
    ├── model/
    │   ├── user.types.ts      # 타입 정의
    │   └── user.store.ts      # Zustand 스토어
    ├── ui/
    │   └── UserAvatar.tsx     # UI 컴포넌트
    └── index.ts               # Public API
```

### Public API 패턴

각 슬라이스는 `index.ts`로 Public API 제공:

```typescript
// src/entities/user/index.ts
export { useUserStore } from "./model/user.store";
export type { User } from "./model/user.types";
export { UserAvatar } from "./ui/UserAvatar";
```

## 5. API 패턴

### Supabase RPC 호출

```typescript
// src/entities/user/api/user.api.ts
import { supabase } from "@/shared/lib/supabase";
import type { User } from "../model/user.types";

export async function fetchUser(userId: string): Promise<User> {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_fetch_user", {
      p_user_id: userId,
    })
    .single();
    
  if (error) throw error;
  return transformUser(data);
}
```

### 에러 처리

```typescript
try {
  const user = await fetchUser("123");
} catch (error) {
  console.error("[fetchUser] 에러:", error);
  // 에러 처리 로직
}
```

### 타입 변환

DB 응답을 클라이언트 타입으로 변환:

```typescript
function transformUser(data: any): User {
  return {
    id: data.id.toString(),
    username: data.username,
    displayName: data.display_name,
    // ...
  };
}
```

## 6. 상태 관리 패턴

### Zustand 스토어

```typescript
// src/entities/user/model/user.store.ts
import { create } from "zustand";
import type { User } from "./user.types";

interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  loadUser: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  loadUser: async (userId) => {
    set({ isLoading: true });
    try {
      const user = await fetchUser(userId);
      set({ user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },
}));
```

### 커스텀 훅

```typescript
export function useUser(userId: string) {
  const { user, isLoading, loadUser } = useUserStore();
  
  useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  return { user, isLoading };
}
```

## 7. 스타일링 규칙

### Tailwind CSS 사용

```tsx
import { cn } from "@/shared/lib/utils";

<div className={cn(
  "px-4 py-2 rounded-lg",
  isActive && "bg-primary-500",
  className
)} />
```

### 유틸리티 함수

```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 다크 모드

```tsx
<div className="
  bg-white dark:bg-surface-900
  text-surface-900 dark:text-surface-100
">
  컨텐츠
</div>
```

## 8. 에러 처리 패턴

### API 에러 클래스

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

### 에러 처리 함수

```typescript
export function handleApiError(error: any): never {
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error?.code) {
    throw new ApiError(
      error.message || "API 요청 실패",
      error.code,
      error.details
    );
  }
  
  throw new ApiError(error?.message || "알 수 없는 오류");
}
```

## 9. 컴포넌트 작성 패턴

### 기본 컴포넌트 구조

```tsx
import { type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface ComponentProps {
  children: ReactNode;
  className?: string;
}

export function Component({ children, className }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

### Props 타입 정의

```typescript
interface ButtonProps {
  /** 버튼 내용 */
  children: ReactNode;
  
  /** 버튼 스타일 변형 */
  variant?: "primary" | "secondary";
  
  /** 비활성화 상태 */
  disabled?: boolean;
  
  /** 클릭 이벤트 핸들러 */
  onClick?: () => void;
}
```

## 10. 라우팅 패턴

### 라우터 설정

```typescript
// src/app/router/index.tsx
import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <FeedPage />,
  },
  {
    path: "/create-project",
    element: (
      <ProtectedRoute>
        <CreateProjectPage />
      </ProtectedRoute>
    ),
  },
]);
```

### 보호된 라우트

```typescript
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

<ProtectedRoute redirectTo="/login">
  <ProtectedPage />
</ProtectedRoute>
```

## 11. 데이터베이스 패턴

### 스키마 및 테이블

- 모든 테이블은 `odd` 스키마에 생성
- 테이블명은 `tbl_` 접두사 사용
- RPC 함수는 `v1_*`, `v2_*` 형식으로 버전 관리

### RPC 함수 호출

```typescript
const { data, error } = await supabase
  .schema("odd")
  .rpc("v1_fetch_projects", {
    p_limit: 20,
    p_offset: 0,
  });
```

## 12. 코드 작성 체크리스트

새 코드를 작성할 때 다음을 확인:

- [ ] FSD 아키텍처 규칙 준수
- [ ] 절대 경로 (`@/`) 사용
- [ ] 타입 정의 명시
- [ ] 주석 작성 (복잡한 로직)
- [ ] 에러 처리 구현
- [ ] Public API (`index.ts`) export
- [ ] Tailwind CSS 클래스 사용
- [ ] 다크 모드 지원
- [ ] 접근성 고려 (시맨틱 HTML, ARIA)

## 13. 자주 사용하는 패턴

### 로딩 상태

```tsx
const { isLoading, data } = useQuery();

if (isLoading) {
  return <LoadingSpinner />;
}

return <Content data={data} />;
```

### 에러 상태

```tsx
const { error, data } = useQuery();

if (error) {
  return <ErrorMessage error={error} />;
}

return <Content data={data} />;
```

### 조건부 렌더링

```tsx
{isAuthenticated ? (
  <AuthenticatedContent />
) : (
  <LoginPrompt />
)}
```

## 14. 참고 문서

- [프로젝트 구조 가이드](./02_project-structure.md)
- [코드 패턴 가이드](./09_code-patterns.md)
- [API 설계 가이드](./04_api-design.md)
- [백엔드 구조 가이드](./03_backend-supabase.md)

## 15. 주의사항

1. **절대 경로 사용**: 상대 경로는 같은 디렉토리 내에서만 사용
2. **레이어 규칙 준수**: 하위 레이어는 상위 레이어를 import 불가
3. **타입 안정성**: 모든 함수와 컴포넌트에 타입 정의
4. **에러 처리**: 모든 비동기 작업에 에러 처리 구현
5. **성능**: 불필요한 리렌더링 방지 (`useMemo`, `useCallback`)

