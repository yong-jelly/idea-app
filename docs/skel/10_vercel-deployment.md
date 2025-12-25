# Vercel 배포 설정 가이드

이 문서는 Vercel을 사용한 프로젝트 배포 설정 가이드를 제공합니다.

## 📋 목차

1. [Vercel 프로젝트 생성](#1-vercel-프로젝트-생성)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [빌드 설정](#3-빌드-설정)
4. [vercel.json 설정](#4-verceljson-설정)
5. [도메인 설정](#5-도메인-설정)
6. [트러블슈팅](#6-트러블슈팅)

## 1. Vercel 프로젝트 생성

### 1.1 Vercel CLI 설치

```bash
bun add -g vercel
```

### 1.2 프로젝트 배포

```bash
# Vercel에 로그인
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 1.3 GitHub 연동

1. **Vercel Dashboard** → **Add New Project**
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (또는 프로젝트 루트)
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`

## 2. 환경 변수 설정

### 2.1 Vercel Dashboard에서 설정

1. **Project Settings** → **Environment Variables**
2. 다음 환경 변수 추가:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id (선택)
```

### 2.2 환경별 설정

- **Production**: 프로덕션 환경 변수
- **Preview**: 프리뷰 환경 변수
- **Development**: 개발 환경 변수

### 2.3 환경 변수 확인

배포 후 환경 변수가 제대로 설정되었는지 확인:

```typescript
// 개발 환경에서만 로그 출력
if (import.meta.env.DEV) {
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
}
```

## 3. 빌드 설정

### 3.1 package.json 스크립트

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3.2 Vercel 빌드 설정

**Project Settings** → **General** → **Build & Development Settings**:

- **Framework Preset**: Vite
- **Build Command**: `bun run build`
- **Output Directory**: `dist`
- **Install Command**: `bun install`

### 3.3 빌드 최적화

`vite.config.ts`에서 빌드 최적화 설정:

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
  build: {
    // 청크 크기 경고 임계값 (KB)
    chunkSizeWarningLimit: 1000,
    // 소스맵 생성 (프로덕션에서는 false 권장)
    sourcemap: false,
    // 빌드 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
```

## 4. vercel.json 설정

### 4.1 기본 설정

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4.2 헤더 설정

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 4.3 리다이렉트 설정

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### 4.4 완전한 vercel.json 예시

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

## 5. 도메인 설정

### 5.1 커스텀 도메인 추가

1. **Project Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: `example.com`)
4. DNS 설정 안내에 따라 레코드 추가:
   - **A Record**: `76.76.21.21`
   - **CNAME Record**: `cname.vercel-dns.com`

### 5.2 SSL 인증서

Vercel이 자동으로 SSL 인증서를 발급하고 관리합니다.

### 5.3 환경 변수 업데이트

커스텀 도메인 사용 시 Supabase Redirect URLs 업데이트:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Redirect URLs**에 추가:
   - `https://your-domain.com/auth/callback`

## 6. 트러블슈팅

### 6.1 빌드 실패

**문제**: 빌드가 실패하는 경우

**해결**:
1. 로컬에서 빌드 테스트: `bun run build`
2. 빌드 로그 확인 (Vercel Dashboard)
3. 환경 변수 확인
4. 의존성 버전 확인

### 6.2 환경 변수 미적용

**문제**: 환경 변수가 적용되지 않는 경우

**해결**:
1. 환경 변수 이름 확인 (`VITE_` 접두사 필수)
2. 환경별 설정 확인 (Production/Preview/Development)
3. 배포 후 재빌드

### 6.3 라우팅 문제

**문제**: 새로고침 시 404 에러

**해결**:
`vercel.json`에 `rewrites` 설정 확인:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 6.4 CORS 에러

**문제**: Supabase API 호출 시 CORS 에러

**해결**:
1. Supabase Dashboard에서 도메인 허용 목록 확인
2. `vercel.json`에 CORS 헤더 추가 (필요한 경우)

### 6.5 빌드 시간 초과

**문제**: 빌드가 시간 초과되는 경우

**해결**:
1. 불필요한 의존성 제거
2. 빌드 최적화 설정 확인
3. Vercel Pro 플랜 고려 (더 긴 빌드 시간)

## 7. 모니터링 및 분석

### 7.1 Vercel Analytics

Vercel Analytics를 활성화하여 성능 모니터링:

1. **Project Settings** → **Analytics**
2. **Enable Analytics** 활성화

### 7.2 로그 확인

**Vercel Dashboard** → **Deployments** → 특정 배포 → **Logs**

빌드 및 런타임 로그를 확인할 수 있습니다.

## 8. CI/CD 설정

### 8.1 자동 배포

GitHub 연동 시:
- **main 브랜치** 푸시 → 프로덕션 배포
- **다른 브랜치** 푸시 → 프리뷰 배포

### 8.2 프리뷰 배포

Pull Request 생성 시 자동으로 프리뷰 URL이 생성됩니다.

## 📚 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [프로젝트 초기 설정](./01_project-setup.md)

