# 인증 처리 및 라우트 보호 가이드

이 문서는 Supabase Auth를 사용한 인증 시스템 구현 가이드를 제공합니다.

## 📋 목차

1. [Supabase Auth 설정](#1-supabase-auth-설정)
2. [인증 상태 관리](#2-인증-상태-관리)
3. [로그인/로그아웃](#3-로그인로그아웃)
4. [라우트 보호](#4-라우트-보호)
5. [OAuth 인증](#5-oauth-인증)
6. [인증 콜백 처리](#6-인증-콜백-처리)

## 1. Supabase Auth 설정

### 1.1 Supabase 클라이언트 설정

```typescript
// src/shared/lib/supabase.ts
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

### 1.2 Supabase Dashboard 설정

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:5177` (개발)
   - **Redirect URLs**: 
     - `http://localhost:5177/auth/callback`
     - `https://your-domain.vercel.app/auth/callback`

2. **Authentication** → **Providers**:
   - 원하는 인증 방법 활성화 (Email, Google OAuth 등)

## 2. 인증 상태 관리

### 2.1 사용자 타입 정의

```typescript
// src/entities/user/model/user.types.ts
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  subscribedProjectsCount: number;
  supportedProjectsCount: number;
  projectsCount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 2.2 사용자 스토어

```typescript
// src/entities/user/model/user.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./user.types";
import { supabase } from "@/shared/lib/supabase";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  
  // 세션 관리
  initSession: () => Promise<void>;
  syncUserFromSession: () => Promise<void>;
  
  // 사용자 상태 업데이트
  setUser: (user: User | null) => void;
  
  // 로그인/로그아웃
  login: (user: User) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSyncing: false,
  
  initSession: async () => {
    set({ isLoading: true });
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[initSession] 에러:", error);
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      if (session?.user) {
        await get().syncUserFromSession();
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("[initSession] 예외:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  syncUserFromSession: async () => {
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        set({ user: null, isAuthenticated: false, isSyncing: false });
        return;
      }
      
      // DB에서 사용자 정보 조회
      const { data: dbUser, error: dbError } = await supabase
        .schema("odd")
        .from("tbl_users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();
      
      if (dbError || !dbUser) {
        console.error("[syncUserFromSession] DB 조회 실패:", dbError);
        set({ user: null, isAuthenticated: false, isSyncing: false });
        return;
      }
      
      // User 타입으로 변환
      const user: User = {
        id: dbUser.id.toString(),
        username: dbUser.username || "",
        displayName: dbUser.display_name || "",
        avatar: dbUser.avatar_url || undefined,
        bio: dbUser.bio || undefined,
        website: dbUser.website || undefined,
        github: dbUser.github || undefined,
        twitter: dbUser.twitter || undefined,
        points: dbUser.points || 0,
        level: dbUser.level as User["level"],
        subscribedProjectsCount: dbUser.subscribed_projects_count || 0,
        supportedProjectsCount: dbUser.supported_projects_count || 0,
        projectsCount: dbUser.projects_count || 0,
        createdAt: dbUser.created_at,
      };
      
      set({ user, isAuthenticated: true, isLoading: false, isSyncing: false });
    } catch (error) {
      console.error("[syncUserFromSession] 예외:", error);
      set({ user: null, isAuthenticated: false, isLoading: false, isSyncing: false });
    }
  },
  
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
  
  login: (user) => {
    set({ user, isAuthenticated: true });
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
```

### 2.3 전역 프로바이더 설정

```typescript
// src/app/providers/index.tsx
import { useEffect } from "react";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";

export function Providers({ children }: { children: React.ReactNode }) {
  // 앱 초기화 시 세션 복구
  useEffect(() => {
    useUserStore.getState().initSession();
  }, []);

  // Supabase 인증 상태 변경 리스너
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const store = useUserStore.getState();

        if (event === "INITIAL_SESSION") {
          // initSession()에서 이미 처리하므로 건너뛰기
          return;
        }

        if (event === "SIGNED_IN") {
          // 로그인 시 사용자 정보 동기화
          if (store.isSyncing) {
            store.setUser(null); // 플래그 리셋
          }
          await store.syncUserFromSession();
        } else if (event === "SIGNED_OUT") {
          // 로그아웃 시 상태 초기화
          store.setUser(null);
        } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // 토큰 갱신 또는 사용자 정보 업데이트 시 동기화
          if (!store.isSyncing) {
            await store.syncUserFromSession();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
```

## 3. 로그인/로그아웃

### 3.1 이메일 로그인

```typescript
// src/entities/user/api/user.api.ts
import { supabase } from "@/shared/lib/supabase";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}
```

### 3.2 OAuth 로그인 (Google)

```typescript
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) throw error;
  return data;
}
```

### 3.3 로그아웃

```typescript
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### 3.4 로그인 컴포넌트 예시

```tsx
// src/pages/auth/LoginPage.tsx
import { useState } from "react";
import { signInWithGoogle } from "@/entities/user/api/user.api";
import { useUserStore } from "@/entities/user";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { syncUserFromSession } = useUserStore();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // 리다이렉트되므로 여기서는 처리하지 않음
    } catch (error) {
      console.error("로그인 실패:", error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? "로그인 중..." : "Google로 로그인"}
      </button>
    </div>
  );
}
```

## 4. 라우트 보호

### 4.1 ProtectedRoute 컴포넌트

```typescript
// src/shared/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/" 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useUserStore();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Supabase 세션 교차 검증
  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        const valid = !error && !!session?.user;
        setHasValidSession(valid);
      } catch (err) {
        console.error("[ProtectedRoute] 세션 검증 중 예외:", err);
        setHasValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [location.pathname, user?.id]);

  // 세션 확인 중일 때 로딩 상태 표시
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-sm text-surface-600">세션 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았거나 유효한 세션이 없는 경우 리다이렉트
  if (!isAuthenticated || !hasValidSession) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
```

### 4.2 라우터에 적용

```typescript
// src/app/router/index.tsx
import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { FeedPage } from "@/pages/feed";
import { CreateProjectPage } from "@/pages/project";

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

export { router };
```

## 5. OAuth 인증

### 5.1 Google OAuth 설정

1. **Google Cloud Console**에서 OAuth 2.0 클라이언트 ID 생성
2. **승인된 리디렉션 URI** 추가:
   - `https://your-project.supabase.co/auth/v1/callback`
3. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:
   - Client ID와 Secret 입력

### 5.2 OAuth 로그인 구현

```typescript
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  
  if (error) throw error;
  return data;
}
```

## 6. 인증 콜백 처리

### 6.1 콜백 페이지

```typescript
// src/pages/auth/AuthCallbackPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/shared/lib/supabase";
import { useUserStore } from "@/entities/user";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { syncUserFromSession } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");

        if (errorParam) {
          setError(errorParam);
          return;
        }

        if (code) {
          // code를 세션으로 교환
          const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) {
            setError(authError.message);
            return;
          }

          // DB에 사용자 정보 저장/업데이트
          if (data.user) {
            const { error: dbError } = await supabase
              .schema("odd")
              .rpc("v1_upsert_user", {
                p_auth_id: data.user.id,
                p_email: data.user.email,
                p_display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
                p_avatar_url: data.user.user_metadata?.avatar_url || null,
              });
            
            if (dbError) {
              console.error("DB 저장 에러:", dbError);
            }
          }
        }

        // 사용자 정보 동기화
        await syncUserFromSession();

        // 메인 페이지로 리다이렉트
        navigate("/", { replace: true });
      } catch (err) {
        console.error("콜백 처리 중 에러:", err);
        setError("인증 처리 중 오류가 발생했습니다");
      }
    };

    handleCallback();
  }, [navigate, syncUserFromSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">에러: {error}</p>
          <button onClick={() => navigate("/")}>홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-sm text-surface-600">인증 처리 중...</p>
      </div>
    </div>
  );
}
```

### 6.2 라우터에 콜백 경로 추가

```typescript
const router = createBrowserRouter([
  // ...
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
]);
```

## 📚 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [백엔드 구조 가이드](./03_backend-supabase.md)
- [프로젝트 구조 가이드](./02_project-structure.md)

