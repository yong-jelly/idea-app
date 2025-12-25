# 프로젝트 구조 가이드 (FSD 아키텍처)

이 프로젝트는 **Feature-Sliced Design (FSD)** 아키텍처를 따릅니다. 이는 확장 가능하고 유지보수하기 쉬운 코드 구조를 제공합니다.

## 📁 전체 구조

```
src/
├── app/                    # 앱 초기화 레이어
│   ├── App.tsx            # 루트 컴포넌트
│   ├── index.ts           # Public API
│   ├── providers/         # 전역 프로바이더
│   │   └── index.tsx      # 테마, 인증 등 전역 상태
│   └── router/            # 라우팅 설정
│       └── index.tsx      # React Router 설정
│
├── pages/                 # 페이지 레이어
│   ├── feed/              # 피드 페이지
│   ├── explore/           # 탐색 페이지
│   ├── project/           # 프로젝트 관련 페이지
│   ├── profile/           # 프로필 페이지
│   └── auth/              # 인증 페이지
│
├── widgets/               # 위젯 레이어
│   ├── header/            # 헤더 위젯
│   ├── sidebar/           # 사이드바 위젯
│   └── feed-timeline/     # 피드 타임라인 위젯
│
├── features/              # 기능 레이어
│   ├── feed/              # 피드 관련 기능
│   │   ├── compose-post/  # 포스트 작성 기능
│   │   └── feed-actions/  # 피드 액션 기능
│   └── project/           # 프로젝트 관련 기능
│       ├── project-create/# 프로젝트 생성 기능
│       └── support-project/# 프로젝트 후원 기능
│
├── entities/              # 엔티티 레이어
│   ├── user/              # 사용자 엔티티
│   │   ├── api/           # API 함수
│   │   ├── model/         # 타입 및 스토어
│   │   └── ui/            # UI 컴포넌트
│   ├── post/              # 포스트 엔티티
│   └── project/           # 프로젝트 엔티티
│
└── shared/                # 공유 레이어
    ├── ui/                # 공용 UI 컴포넌트
    ├── lib/               # 유틸리티 함수
    └── config/            # 설정 (스토어 등)
```

## 🏗 레이어 설명

### 1. app/ - 앱 초기화 레이어

**목적**: 앱의 진입점, 전역 설정, 프로바이더 설정

**규칙**:
- 다른 레이어를 import할 수 있음
- 다른 레이어에서 import되지 않음 (public API만 export)
- 라우팅, 프로바이더, 전역 설정만 포함

**예시**:
```typescript
// src/app/App.tsx
import { Providers } from "./providers";
import { AppRouter } from "./router";

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
```

### 2. pages/ - 페이지 레이어

**목적**: 라우트에 매핑되는 페이지 컴포넌트

**규칙**:
- `app/`, `widgets/`, `features/`, `entities/`, `shared/`를 import 가능
- 다른 페이지를 import하지 않음
- 비즈니스 로직은 포함하지 않고, 위젯과 기능을 조합

**예시**:
```typescript
// src/pages/feed/FeedPage.tsx
import { FeedTimeline } from "@/widgets/feed-timeline";
import { Header } from "@/widgets/header";

export function FeedPage() {
  return (
    <div>
      <Header />
      <FeedTimeline />
    </div>
  );
}
```

### 3. widgets/ - 위젯 레이어

**목적**: 독립적인 UI 블록 (헤더, 사이드바, 피드 등)

**규칙**:
- `features/`, `entities/`, `shared/`를 import 가능
- 다른 위젯을 import하지 않음
- 페이지별로 독립적으로 동작하는 복합 컴포넌트

**예시**:
```typescript
// src/widgets/feed-timeline/FeedTimeline.tsx
import { useFeedActions } from "@/features/feed/feed-actions";
import { TextPostRow } from "@/entities/feed";

export function FeedTimeline() {
  const { feed, isLoading } = useFeedActions();
  
  return (
    <div>
      {feed.map(post => (
        <TextPostRow key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 4. features/ - 기능 레이어

**목적**: 사용자 시나리오를 구현하는 기능

**규칙**:
- `entities/`, `shared/`를 import 가능
- 다른 기능을 import하지 않음
- 특정 사용자 액션을 완전히 구현

**예시**:
```typescript
// src/features/feed/compose-post/PostComposer.tsx
import { usePostStore } from "@/entities/post";
import { Button } from "@/shared/ui";

export function PostComposer() {
  const { createPost } = usePostStore();
  
  const handleSubmit = async () => {
    await createPost({ content: "..." });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea />
      <Button type="submit">게시</Button>
    </form>
  );
}
```

### 5. entities/ - 엔티티 레이어

**목적**: 비즈니스 엔티티 (User, Post, Project 등)

**구조**:
```
entities/
└── user/
    ├── api/           # API 함수
    │   └── user.api.ts
    ├── model/         # 타입 및 스토어
    │   ├── user.types.ts
    │   └── user.store.ts
    ├── ui/            # UI 컴포넌트
    │   ├── UserAvatar.tsx
    │   └── BadgeDisplay.tsx
    └── index.ts       # Public API
```

**규칙**:
- `shared/`만 import 가능
- 다른 엔티티를 import하지 않음
- 엔티티별로 독립적으로 동작

**예시**:
```typescript
// src/entities/user/model/user.types.ts
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

// src/entities/user/model/user.store.ts
import { create } from "zustand";
import type { User } from "./user.types";

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// src/entities/user/index.ts
export { useUserStore } from "./model/user.store";
export type { User } from "./model/user.types";
export { UserAvatar } from "./ui/UserAvatar";
```

### 6. shared/ - 공유 레이어

**목적**: 프로젝트 전역에서 사용하는 공용 코드

**구조**:
```
shared/
├── ui/              # 공용 UI 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── lib/             # 유틸리티 함수
│   ├── utils.ts
│   └── supabase.ts
└── config/          # 설정
    └── ui.store.ts
```

**규칙**:
- 다른 레이어를 import하지 않음
- 순수 함수, 유틸리티, 공용 컴포넌트만 포함

**예시**:
```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/shared/ui/Button.tsx
import { cn } from "@/shared/lib/utils";

interface ButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function Button({ className, children }: ButtonProps) {
  return (
    <button className={cn("px-4 py-2", className)}>
      {children}
    </button>
  );
}
```

## 📝 파일 명명 규칙

### 컴포넌트 파일
- PascalCase: `UserAvatar.tsx`, `FeedTimeline.tsx`
- 컴포넌트 이름과 파일 이름 일치

### 유틸리티 파일
- kebab-case: `user.api.ts`, `feed.types.ts`
- 또는 camelCase: `utils.ts`, `supabase.ts`

### 인덱스 파일
- 각 레이어/슬라이스에 `index.ts` 파일로 Public API 제공
- 내부 구조를 숨기고 필요한 것만 export

**예시**:
```typescript
// src/entities/user/index.ts
export { useUserStore } from "./model/user.store";
export type { User } from "./model/user.types";
export { UserAvatar } from "./ui/UserAvatar";
export { BadgeDisplay } from "./ui/BadgeDisplay";

// 사용 시
import { useUserStore, UserAvatar } from "@/entities/user";
```

## 🔄 Import 규칙

### 절대 경로 사용
- `@/` 별칭을 사용하여 절대 경로로 import
- 상대 경로는 같은 디렉토리 내에서만 사용

**예시**:
```typescript
// ✅ 좋은 예
import { Button } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { FeedTimeline } from "@/widgets/feed-timeline";

// ❌ 나쁜 예
import { Button } from "../../../shared/ui";
```

### 레이어 간 Import 규칙

```
app → 모든 레이어
pages → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared
entities → shared
shared → 없음
```

## 🎯 모범 사례

### 1. Public API 패턴
각 슬라이스는 `index.ts`를 통해 Public API를 제공합니다.

```typescript
// src/entities/user/index.ts
export { useUserStore } from "./model/user.store";
export type { User } from "./model/user.types";
export { UserAvatar } from "./ui/UserAvatar";
```

### 2. 타입 정의
엔티티의 타입은 `model/` 디렉토리에 정의합니다.

```typescript
// src/entities/user/model/user.types.ts
export interface User {
  id: string;
  username: string;
  displayName: string;
}
```

### 3. 스토어 관리
Zustand를 사용하여 상태를 관리합니다.

```typescript
// src/entities/user/model/user.store.ts
import { create } from "zustand";
import type { User } from "./user.types";

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### 4. API 함수
엔티티의 API 함수는 `api/` 디렉토리에 정의합니다.

```typescript
// src/entities/user/api/user.api.ts
import { supabase } from "@/shared/lib/supabase";
import type { User } from "../model/user.types";

export async function fetchUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .schema("odd")
    .from("tbl_users")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error) throw error;
  return data;
}
```

## 📚 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [프로젝트 구조 예시](./02_project-structure.md)
- [코드 패턴 가이드](./09_code-patterns.md)

