# 코드 패턴 및 주석 가이드

이 문서는 프로젝트에서 사용하는 코드 패턴과 주석 작성 가이드를 제공합니다.

## 📋 목차

1. [코드 패턴](#1-코드-패턴)
2. [주석 가이드](#2-주석-가이드)
3. [타입 정의](#3-타입-정의)
4. [함수 작성](#4-함수-작성)
5. [컴포넌트 작성](#5-컴포넌트-작성)

## 1. 코드 패턴

### 1.1 파일 구조 패턴

#### 엔티티 구조

```
entities/
└── user/
    ├── api/
    │   └── user.api.ts        # API 함수
    ├── model/
    │   ├── user.types.ts      # 타입 정의
    │   └── user.store.ts      # 상태 관리
    ├── ui/
    │   ├── UserAvatar.tsx     # UI 컴포넌트
    │   └── BadgeDisplay.tsx
    └── index.ts               # Public API
```

#### Public API 패턴

```typescript
// src/entities/user/index.ts
export { useUserStore } from "./model/user.store";
export type { User } from "./model/user.types";
export { UserAvatar } from "./ui/UserAvatar";
export { BadgeDisplay } from "./ui/BadgeDisplay";
```

### 1.2 Import 순서

1. React 및 외부 라이브러리
2. 내부 절대 경로 import (`@/`)
3. 상대 경로 import
4. 타입 import

```typescript
// 1. React 및 외부 라이브러리
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { create } from "zustand";

// 2. 내부 절대 경로
import { Button } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";

// 3. 상대 경로
import { UserAvatar } from "./UserAvatar";

// 4. 타입 import
import type { User } from "@/entities/user";
```

### 1.3 네이밍 규칙

#### 컴포넌트
- **PascalCase**: `UserAvatar`, `FeedTimeline`
- 파일명과 컴포넌트명 일치

#### 함수 및 변수
- **camelCase**: `fetchUser`, `isLoading`
- Boolean 변수는 `is`, `has`, `should` 접두사 사용

#### 상수
- **UPPER_SNAKE_CASE**: `MAX_ITEMS`, `API_BASE_URL`

#### 타입 및 인터페이스
- **PascalCase**: `User`, `Project`, `UserStore`

#### 파일명
- 컴포넌트: `PascalCase.tsx` (예: `UserAvatar.tsx`)
- 유틸리티: `camelCase.ts` 또는 `kebab-case.ts` (예: `user.api.ts`, `utils.ts`)

## 2. 주석 가이드

### 2.1 파일 헤더 주석

```typescript
/**
 * 사용자 아바타 컴포넌트
 * 
 * 사용자의 프로필 이미지를 표시하는 컴포넌트입니다.
 * 이미지가 없을 경우 사용자명의 첫 글자를 표시합니다.
 * 
 * @file UserAvatar.tsx
 * @author Your Name
 * @since 2024-01-01
 */
```

### 2.2 함수 주석

```typescript
/**
 * 사용자 정보를 조회합니다.
 * 
 * @param userId - 조회할 사용자 ID
 * @returns 사용자 정보 또는 null
 * @throws {ApiError} API 요청 실패 시
 * 
 * @example
 * ```typescript
 * const user = await fetchUser("123");
 * if (user) {
 *   console.log(user.displayName);
 * }
 * ```
 */
export async function fetchUser(userId: string): Promise<User | null> {
  // 구현
}
```

### 2.3 컴포넌트 주석

```typescript
/**
 * 사용자 아바타 컴포넌트
 * 
 * 사용자의 프로필 이미지를 표시합니다. 이미지가 없을 경우
 * 사용자명의 첫 글자를 표시하는 폴백을 제공합니다.
 * 
 * @param props - 컴포넌트 props
 * @param props.username - 사용자명 (필수)
 * @param props.displayName - 표시 이름
 * @param props.avatar - 프로필 이미지 URL (선택)
 * @param props.size - 아바타 크기 ("sm" | "md" | "lg")
 * 
 * @example
 * ```tsx
 * <UserAvatar
 *   username="johndoe"
 *   displayName="John Doe"
 *   avatar="https://example.com/avatar.jpg"
 *   size="md"
 * />
 * ```
 */
export function UserAvatar({
  username,
  displayName,
  avatar,
  size = "md",
}: UserAvatarProps) {
  // 구현
}
```

### 2.4 복잡한 로직 주석

```typescript
// 세션 동기화 중 중복 호출 방지
if (store.isSyncing) {
  return;
}

// 현재 사용자의 인증 ID로 DB 사용자 조회
const { data: dbUser } = await supabase
  .schema("odd")
  .from("tbl_users")
  .select("*")
  .eq("auth_id", authUser.id)
  .single();

// 사용자가 없으면 인증 상태 초기화
if (!dbUser) {
  set({ user: null, isAuthenticated: false });
  return;
}
```

### 2.5 TODO 주석

```typescript
// TODO: 에러 처리 로직 개선 필요
// FIXME: 메모리 누수 가능성 확인
// NOTE: 이 부분은 성능 최적화가 필요함
// HACK: 임시 해결책, 추후 리팩토링 필요
```

## 3. 타입 정의

### 3.1 인터페이스 정의

```typescript
/**
 * 사용자 정보 인터페이스
 */
export interface User {
  /** 사용자 고유 ID */
  id: string;
  
  /** 사용자명 (고유) */
  username: string;
  
  /** 표시 이름 */
  displayName: string;
  
  /** 프로필 이미지 URL (선택) */
  avatar?: string;
  
  /** 자기소개 */
  bio?: string;
  
  /** 웹사이트 URL */
  website?: string;
  
  /** GitHub 사용자명 */
  github?: string;
  
  /** Twitter 사용자명 */
  twitter?: string;
  
  /** 포인트 */
  points: number;
  
  /** 레벨 */
  level: "bronze" | "silver" | "gold" | "platinum";
  
  /** 생성일시 */
  createdAt: string;
}
```

### 3.2 타입 유틸리티

```typescript
// Partial 타입
type PartialUser = Partial<User>;

// Pick 타입
type UserBasic = Pick<User, "id" | "username" | "displayName">;

// Omit 타입
type UserWithoutId = Omit<User, "id">;

// 유니온 타입
type Status = "pending" | "approved" | "rejected";

// 제네릭 타입
interface ApiResponse<T> {
  data: T;
  error: null;
}

interface ApiError {
  data: null;
  error: {
    message: string;
    code: string;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;
```

## 4. 함수 작성

### 4.1 순수 함수

```typescript
/**
 * 두 숫자를 더합니다.
 * 
 * @param a - 첫 번째 숫자
 * @param b - 두 번째 숫자
 * @returns 두 숫자의 합
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

### 4.2 비동기 함수

```typescript
/**
 * 사용자 목록을 조회합니다.
 * 
 * @param params - 조회 파라미터
 * @param params.limit - 조회할 최대 개수 (기본값: 20)
 * @param params.offset - 건너뛸 개수 (기본값: 0)
 * @returns 사용자 목록
 * @throws {ApiError} API 요청 실패 시
 */
export async function fetchUsers(params: {
  limit?: number;
  offset?: number;
}): Promise<User[]> {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_fetch_users", {
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    
  if (error) {
    throw new ApiError(error.message, error.code);
  }
  
  return data.map(transformUser);
}
```

### 4.3 에러 처리

```typescript
/**
 * API 에러 클래스
 */
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

/**
 * 에러를 처리하고 ApiError로 변환합니다.
 */
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
  
  throw new ApiError(error?.message || "알 수 없는 오류가 발생했습니다");
}
```

## 5. 컴포넌트 작성

### 5.1 기본 컴포넌트 구조

```typescript
import { type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 버튼 컴포넌트 Props
 */
interface ButtonProps {
  /** 버튼 내용 */
  children: ReactNode;
  
  /** 버튼 스타일 변형 */
  variant?: "primary" | "secondary" | "danger";
  
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  
  /** 비활성화 상태 */
  disabled?: boolean;
  
  /** 클릭 이벤트 핸들러 */
  onClick?: () => void;
  
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 재사용 가능한 버튼 컴포넌트
 * 
 * 다양한 스타일 변형과 크기를 지원합니다.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className,
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-medium rounded-lg transition-colors",
        variant === "primary" && "bg-primary-500 text-white hover:bg-primary-600",
        variant === "secondary" && "bg-surface-200 text-surface-900 hover:bg-surface-300",
        variant === "danger" && "bg-accent-rose text-white hover:bg-red-600",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 5.2 커스텀 훅

```typescript
/**
 * 사용자 데이터를 조회하는 커스텀 훅
 * 
 * @param userId - 조회할 사용자 ID
 * @returns 사용자 데이터 및 로딩/에러 상태
 * 
 * @example
 * ```tsx
 * const { user, isLoading, error } = useUser("123");
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * return <UserProfile user={user} />;
 * ```
 */
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchUser(userId);
        
        if (!cancelled) {
          setUser(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, isLoading, error };
}
```

### 5.3 Zustand 스토어

```typescript
/**
 * 사용자 스토어 인터페이스
 */
interface UserStore {
  /** 현재 사용자 정보 */
  user: User | null;
  
  /** 인증 상태 */
  isAuthenticated: boolean;
  
  /** 로딩 상태 */
  isLoading: boolean;
  
  /** 사용자 설정 */
  setUser: (user: User | null) => void;
  
  /** 사용자 정보 조회 */
  loadUser: (userId: string) => Promise<void>;
  
  /** 로그아웃 */
  logout: () => void;
}

/**
 * 사용자 스토어
 * 
 * 전역 사용자 상태를 관리합니다.
 */
export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
  
  loadUser: async (userId: string) => {
    set({ isLoading: true });
    
    try {
      const user = await fetchUser(userId);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("[loadUser] 에러:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
```

## 6. 모범 사례

### 6.1 일관성 유지

- 동일한 패턴을 프로젝트 전체에 적용
- 팀 내 코딩 컨벤션 준수
- 린터 및 포매터 사용

### 6.2 가독성

- 의미 있는 변수명 사용
- 복잡한 로직은 함수로 분리
- 적절한 주석 추가

### 6.3 성능

- 불필요한 리렌더링 방지 (`useMemo`, `useCallback`)
- 큰 리스트는 가상화 (`react-window` 등)
- 이미지 최적화

### 6.4 접근성

- 시맨틱 HTML 사용
- 키보드 네비게이션 지원
- ARIA 속성 사용

## 📚 참고 자료

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [React 공식 문서](https://react.dev)
- [프로젝트 구조 가이드](./02_project-structure.md)

