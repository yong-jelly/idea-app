# Tailwind CSS 설정 및 스타일 가이드

이 문서는 Tailwind CSS 설정 및 프로젝트 스타일 가이드를 제공합니다.

## 📋 목차

1. [Tailwind CSS 설치](#1-tailwind-css-설치)
2. [설정 파일](#2-설정-파일)
3. [커스텀 테마](#3-커스텀-테마)
4. [스타일 가이드](#4-스타일-가이드)
5. [다크 모드](#5-다크-모드)
6. [애니메이션](#6-애니메이션)

## 1. Tailwind CSS 설치

### 1.1 패키지 설치

```bash
bun add -d tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20
bun add clsx@^2.1.1 tailwind-merge@^2.5.5 tailwindcss-animate@^1.0.7
```

### 1.2 초기화

```bash
bunx tailwindcss init -p
```

이 명령은 `tailwind.config.ts`와 `postcss.config.js` 파일을 생성합니다.

## 2. 설정 파일

### 2.1 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // 클래스 기반 다크 모드
  theme: {
    extend: {
      // 폰트 설정
      fontFamily: {
        sans: [
          "IBM Plex Sans KR",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      // 색상 팔레트
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        surface: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        accent: {
          blue: "#0ea5e9",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      // 그림자
      boxShadow: {
        "soft-xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "soft-sm": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "soft-md": "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "soft-lg": "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
      },
      // 모서리 둥글기
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      // 애니메이션
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.97)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2.2 postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 2.3 src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 기본 스타일 */
@layer base {
  * {
    @apply border-surface-200;
  }

  html {
    @apply scroll-smooth overflow-y-scroll;
  }

  body {
    @apply min-h-screen bg-white text-surface-900 antialiased;
    font-family: "IBM Plex Sans KR", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
    letter-spacing: -0.01em;
  }

  .dark body {
    @apply bg-surface-950 text-surface-100;
  }

  .dark * {
    @apply border-surface-800;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight text-surface-900;
  }

  .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 {
    @apply text-surface-50;
  }
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  @apply w-1.5;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply rounded-full bg-surface-300/70;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-surface-400;
}

.dark ::-webkit-scrollbar-thumb {
  @apply bg-surface-700/70;
}

.dark ::-webkit-scrollbar-thumb:hover {
  @apply bg-surface-600;
}

/* 포커스 스타일 */
*:focus-visible {
  @apply outline-none ring-2 ring-primary-500/40 ring-offset-2 ring-offset-surface-50;
}

.dark *:focus-visible {
  @apply ring-primary-400/40 ring-offset-surface-950;
}

/* 선택 영역 스타일 */
::selection {
  @apply bg-primary-100 text-primary-900;
}

.dark ::selection {
  @apply bg-primary-900/50 text-primary-100;
}
```

## 3. 커스텀 테마

### 3.1 색상 팔레트

프로젝트는 다음 색상 팔레트를 사용합니다:

- **Primary**: 인디고/네이비 계열 (주요 액션)
- **Surface**: 회색 계열 (배경 및 텍스트)
- **Accent**: 강조 색상 (blue, emerald, amber, rose)

### 3.2 색상 사용 예시

```tsx
// Primary 색상
<button className="bg-primary-500 hover:bg-primary-600 text-white">
  버튼
</button>

// Surface 색상
<div className="bg-surface-50 dark:bg-surface-900">
  <p className="text-surface-900 dark:text-surface-100">텍스트</p>
</div>

// Accent 색상
<span className="text-accent-blue">정보</span>
<span className="text-accent-emerald">성공</span>
<span className="text-accent-amber">경고</span>
<span className="text-accent-rose">에러</span>
```

## 4. 스타일 가이드

### 4.1 유틸리티 함수

`cn` 함수를 사용하여 클래스명을 결합합니다:

```typescript
// src/shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**사용 예시**:
```tsx
import { cn } from "@/shared/lib/utils";

<div className={cn(
  "px-4 py-2",
  isActive && "bg-primary-500",
  className
)} />
```

### 4.2 컴포넌트 스타일 패턴

```tsx
// 기본 스타일 + props로 커스터마이징 가능
interface ButtonProps {
  className?: string;
  variant?: "primary" | "secondary";
}

export function Button({ className, variant = "primary" }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-primary-500 text-white hover:bg-primary-600",
        variant === "secondary" && "bg-surface-200 text-surface-900 hover:bg-surface-300",
        className
      )}
    >
      버튼
    </button>
  );
}
```

### 4.3 반응형 디자인

```tsx
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {/* 컨텐츠 */}
</div>
```

### 4.4 호버 및 포커스 상태

```tsx
<button className="
  px-4 py-2
  bg-primary-500
  hover:bg-primary-600
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  active:scale-95
  transition-all
">
  버튼
</button>
```

## 5. 다크 모드

### 5.1 다크 모드 활성화

`tailwind.config.ts`에서 `darkMode: "class"` 설정:

```typescript
export default {
  darkMode: "class",
  // ...
}
```

### 5.2 다크 모드 토글

```typescript
// src/shared/config/ui.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface UIStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-theme" }
  )
);
```

```tsx
// src/app/providers/index.tsx
import { useEffect } from "react";
import { useUIStore } from "@/shared/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return <>{children}</>;
}
```

### 5.3 다크 모드 스타일

```tsx
<div className="
  bg-white dark:bg-surface-900
  text-surface-900 dark:text-surface-100
  border-surface-200 dark:border-surface-800
">
  컨텐츠
</div>
```

## 6. 애니메이션

### 6.1 사전 정의된 애니메이션

```tsx
// Fade In
<div className="animate-fade-in">컨텐츠</div>

// Slide Up
<div className="animate-slide-up">컨텐츠</div>

// Slide Down
<div className="animate-slide-down">컨텐츠</div>

// Scale In
<div className="animate-scale-in">컨텐츠</div>
```

### 6.2 커스텀 애니메이션

`tailwind.config.ts`에 추가:

```typescript
animation: {
  "spin-slow": "spin 3s linear infinite",
  "bounce-slow": "bounce 2s infinite",
},
```

### 6.3 트랜지션

```tsx
<div className="
  transition-all duration-200 ease-in-out
  hover:scale-105
  active:scale-95
">
  컨텐츠
</div>
```

## 7. 모범 사례

### 7.1 클래스명 순서

1. 레이아웃 (display, position)
2. 크기 (width, height, padding, margin)
3. 스타일 (background, border, text)
4. 상태 (hover, focus, active)
5. 반응형 (md:, lg:)

```tsx
<div className="
  flex items-center justify-between
  w-full h-12 px-4 py-2
  bg-white border border-surface-200 rounded-lg
  hover:bg-surface-50
  md:w-auto
">
```

### 7.2 재사용 가능한 컴포넌트

공통 스타일은 컴포넌트로 추출:

```tsx
// src/shared/ui/Card.tsx
export function Card({ className, children }: CardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-surface-900",
      "border border-surface-200 dark:border-surface-800",
      "rounded-lg p-6",
      "shadow-soft-md",
      className
    )}>
      {children}
    </div>
  );
}
```

### 7.3 일관된 간격

Tailwind의 간격 시스템 사용:

```tsx
// 4px 단위로 일관된 간격
<div className="space-y-4"> {/* 16px */}
  <div className="p-4"> {/* 16px */}
    <p className="mb-2"> {/* 8px */}
```

## 📚 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Tailwind CSS 플러그인](https://tailwindcss.com/docs/plugins)
- [프로젝트 구조 가이드](./02_project-structure.md)

