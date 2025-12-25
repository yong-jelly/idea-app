# 패키지 관리 및 필수 패키지 가이드

이 문서는 프로젝트에 필요한 필수 패키지와 각 패키지의 역할을 설명합니다.

## 📦 필수 패키지 목록

### 핵심 프레임워크

```bash
# React 및 DOM
bun add react@^19.0.0 react-dom@^19.0.0

# 라우팅
bun add react-router@^7.0.2

# 상태 관리
bun add zustand@^5.0.2
```

### 백엔드 및 인증

```bash
# Supabase 클라이언트
bun add @supabase/supabase-js@^2.47.10
```

### 스타일링

```bash
# Tailwind CSS 유틸리티
bun add clsx@^2.1.1 tailwind-merge@^2.5.5

# Tailwind 애니메이션
bun add tailwindcss-animate@^1.0.7
```

### UI 컴포넌트 및 아이콘

```bash
# 아이콘 라이브러리
bun add lucide-react@^0.468.0

# React 훅 유틸리티
bun add @react-hookz/web@^24.0.4
```

### 개발 도구

```bash
# 빌드 도구
bun add -d vite@^6.0.3 @vitejs/plugin-react@^4.3.4

# TypeScript
bun add -d typescript@^5.7.2
bun add -d @types/react@^19.0.1 @types/react-dom@^19.0.2
bun add -d @types/bun@latest

# Tailwind CSS
bun add -d tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20

# Storybook (선택사항)
bun add -d storybook@^8.4.7 @storybook/react@^8.4.7 @storybook/react-vite@^8.4.7
bun add -d @storybook/addon-essentials@^8.4.7 @storybook/addon-interactions@^8.4.7
bun add -d @storybook/addon-links@^8.4.7 @storybook/blocks@^8.4.7 @storybook/test@^8.4.7
bun add -d @chromatic-com/storybook@^3.2.3
```

## 📋 패키지 상세 설명

### React 19

**역할**: UI 라이브러리

**주요 기능**:
- 컴포넌트 기반 UI 개발
- 가상 DOM 및 효율적인 렌더링
- Hooks API

**사용 예시**:
```typescript
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### React Router v7

**역할**: 클라이언트 사이드 라우팅

**주요 기능**:
- SPA 라우팅
- 중첩 라우트 지원
- 프로그래밍 방식 네비게이션

**사용 예시**:
```typescript
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/about", element: <AboutPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### Zustand

**역할**: 경량 상태 관리 라이브러리

**주요 기능**:
- 간단한 API
- TypeScript 지원
- 미들웨어 지원 (persist 등)

**사용 예시**:
```typescript
import { create } from "zustand";

interface CounterStore {
  count: number;
  increment: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Supabase JS

**역할**: Supabase 백엔드 클라이언트

**주요 기능**:
- 데이터베이스 쿼리
- 인증 관리
- 실시간 구독
- Storage 관리

**사용 예시**:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

// 데이터 조회
const { data } = await supabase.from("tbl_users").select("*");

// RPC 호출
const { data } = await supabase.rpc("v1_fetch_projects");
```

### clsx & tailwind-merge

**역할**: 클래스명 유틸리티

**주요 기능**:
- 조건부 클래스명 생성
- Tailwind 클래스 충돌 해결

**사용 예시**:
```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 사용
<div className={cn("px-4", isActive && "bg-blue-500")} />
```

### tailwindcss-animate

**역할**: Tailwind CSS 애니메이션 플러그인

**주요 기능**:
- 사전 정의된 애니메이션
- 키프레임 애니메이션

**사용 예시**:
```typescript
// tailwind.config.ts
plugins: [require("tailwindcss-animate")]

// 사용
<div className="animate-fade-in">Content</div>
```

### lucide-react

**역할**: 아이콘 라이브러리

**주요 기능**:
- 1000+ 아이콘
- Tree-shaking 지원
- 커스터마이징 가능

**사용 예시**:
```typescript
import { Heart, Star, User } from "lucide-react";

<Heart className="w-5 h-5" fill="red" />
```

### @react-hookz/web

**역할**: React 훅 유틸리티 라이브러리

**주요 기능**:
- `useAsync` - 비동기 작업 관리
- `useDebounce` - 디바운스
- `useLocalStorage` - 로컬 스토리지 관리

**사용 예시**:
```typescript
import { useAsync } from "@react-hookz/web";

const { execute, status, result } = useAsync(async () => {
  return await fetchData();
});
```

## 🔧 추가 권장 패키지

### 폼 관리 (선택사항)

```bash
# React Hook Form
bun add react-hook-form@^7.53.0
bun add -d @hookform/resolvers@^3.9.0 zod@^3.23.8

# 또는 Formik
bun add formik@^2.4.5
```

### 날짜 처리 (선택사항)

```bash
# date-fns
bun add date-fns@^3.6.0

# 또는 dayjs
bun add dayjs@^1.11.13
```

### 이미지 최적화 (선택사항)

```bash
# react-image
bun add react-image@^4.1.1
```

### 차트 (선택사항)

```bash
# recharts
bun add recharts@^2.12.7
```

### 모니터링 (선택사항)

```bash
# Sentry
bun add @sentry/react@^8.0.0
```

## 📝 package.json 예시

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@react-hookz/web": "^24.0.4",
    "@supabase/supabase-js": "^2.47.10",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.2",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^3.2.3",
    "@storybook/addon-essentials": "^8.4.7",
    "@storybook/addon-interactions": "^8.4.7",
    "@storybook/addon-links": "^8.4.7",
    "@storybook/blocks": "^8.4.7",
    "@storybook/react": "^8.4.7",
    "@storybook/react-vite": "^8.4.7",
    "@storybook/test": "^8.4.7",
    "@types/bun": "latest",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "storybook": "^8.4.7",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.3"
  }
}
```

## 🔄 패키지 업데이트

### 버전 확인

```bash
# 설치된 패키지 버전 확인
bun pm ls

# 최신 버전 확인
bun pm outdated
```

### 업데이트

```bash
# 특정 패키지 업데이트
bun update package-name

# 모든 패키지 업데이트
bun update
```

### 보안 업데이트

```bash
# 보안 취약점 확인
bun audit

# 보안 업데이트
bun update --security
```

## 🚫 제외할 패키지

다음 패키지들은 Bun.js와 호환성 문제가 있거나 불필요합니다:

- ❌ `node-fetch` - Bun에 내장됨
- ❌ `cross-env` - Bun에서 불필요
- ❌ `rimraf` - Bun에 내장됨
- ❌ `dotenv` - Vite에서 `import.meta.env` 사용

## 📚 참고 자료

- [Bun 공식 문서](https://bun.sh/docs)
- [React 공식 문서](https://react.dev)
- [Supabase JS 문서](https://supabase.com/docs/reference/javascript/introduction)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

