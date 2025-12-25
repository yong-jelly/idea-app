# 프로젝트 초기 설정 가이드

이 문서는 프로젝트를 처음부터 설정하는 완전한 가이드를 제공합니다.

## 1. 사전 요구사항

### 필수 도구 설치

```bash
# Bun.js 설치 (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# 또는 npm을 통해 설치
npm install -g bun

# 설치 확인
bun --version
```

### 권장 도구

- **VS Code** 또는 **Cursor** (에디터)
- **Git** (버전 관리)
- **Supabase CLI** (선택사항, 로컬 개발용)

## 2. 프로젝트 초기화

### 2.1 프로젝트 디렉토리 생성

```bash
mkdir my-project
cd my-project
```

### 2.2 Bun 프로젝트 초기화

```bash
bun init
```

이 명령은 `package.json` 파일을 생성합니다.

### 2.3 기본 디렉토리 구조 생성

```bash
mkdir -p src/{app/{providers,router},pages,entities,features,widgets,shared/{ui,lib,config}}
mkdir -p public
mkdir -p docs/{sql,system}
```

## 3. 필수 패키지 설치

### 3.1 프로덕션 의존성

```bash
bun add react@^19.0.0 react-dom@^19.0.0
bun add react-router@^7.0.2
bun add @supabase/supabase-js@^2.47.10
bun add zustand@^5.0.2
bun add clsx@^2.1.1 tailwind-merge@^2.5.5
bun add tailwindcss-animate@^1.0.7
bun add lucide-react@^0.468.0
bun add @react-hookz/web@^24.0.4
```

### 3.2 개발 의존성

```bash
bun add -d vite@^6.0.3 @vitejs/plugin-react@^4.3.4
bun add -d typescript@^5.7.2
bun add -d @types/react@^19.0.1 @types/react-dom@^19.0.2
bun add -d tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20
bun add -d @types/bun@latest
```

### 3.3 Storybook (선택사항)

```bash
bun add -d storybook@^8.4.7 @storybook/react@^8.4.7 @storybook/react-vite@^8.4.7
bun add -d @storybook/addon-essentials@^8.4.7 @storybook/addon-interactions@^8.4.7 @storybook/addon-links@^8.4.7
bun add -d @storybook/blocks@^8.4.7 @storybook/test@^8.4.7
bun add -d @chromatic-com/storybook@^3.2.3
```

## 4. 설정 파일 생성

### 4.1 package.json

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
    "serve": "bun --hot ./index.ts",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### 4.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["bun-types"]
  },
  "include": ["src", "index.ts", ".storybook"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.3 vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5177,
  },
});
```

### 4.4 tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
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
      boxShadow: {
        "soft-xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "soft-sm": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "soft-md": "0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "soft-lg": "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
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

### 4.5 postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 4.6 index.html

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Project</title>
    <meta name="description" content="Project description" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

### 4.7 src/index.css

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

## 5. 환경 변수 설정

### 5.1 .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
# Supabase 설정 (필수)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (선택사항)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5.2 .env.example 파일 생성

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
```

### 5.3 .gitignore에 추가

```gitignore
# 환경 변수
.env
.env.local
.env.production
```

## 6. 기본 소스 파일 생성

### 6.1 src/main.tsx

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 6.2 src/app/App.tsx

```typescript
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

### 6.3 src/app/index.ts

```typescript
export { App } from "./App";
```

## 7. Supabase 설정

### 7.1 Supabase 클라이언트 생성

`src/shared/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase 클라이언트 생성
 * 
 * 보안 및 안정성을 위한 설정:
 * - autoRefreshToken: Access Token 만료 전 자동 갱신
 * - persistSession: localStorage에 세션 저장 (다중 탭 동기화 필수)
 * - detectSessionInUrl: OAuth 콜백에서 URL의 세션 자동 감지
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'my-project',
    },
  },
})
```

## 8. 개발 서버 실행

```bash
bun run dev
```

브라우저에서 `http://localhost:5177`을 열어 확인합니다.

## 9. 다음 단계

- [프로젝트 구조 가이드](./02_project-structure.md) - FSD 아키텍처 이해
- [백엔드 설정](./03_backend-supabase.md) - Supabase 데이터베이스 설정
- [라우터 설정](./07_authentication.md) - 라우팅 및 인증 구현

