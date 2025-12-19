import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";

/**
 * 보호된 라우트 컴포넌트 Props
 */
interface ProtectedRouteProps {
  /** 보호된 라우트 내부에 렌더링할 컴포넌트 */
  children: React.ReactNode;
  
  /** 비인증 사용자가 접근 시 리다이렉트할 경로 (기본값: "/") */
  redirectTo?: string;
}

/**
 * 보호된 라우트 컴포넌트
 * 
 * 인증이 필요한 페이지에 접근할 때 사용합니다.
 * 비회원이 접근하려고 하면 지정된 경로로 리다이렉트합니다.
 * 
 * 사용 예시:
 * ```tsx
 * <ProtectedRoute redirectTo="/login">
 *   <CreateProjectPage />
 * </ProtectedRoute>
 * ```
 * 
 * @param children - 보호된 라우트 내부에 렌더링할 컴포넌트
 * @param redirectTo - 비인증 시 리다이렉트할 경로
 */
export function ProtectedRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
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
        
        // 세션이 있고 에러가 없으면 유효한 세션으로 간주
        // 주의: getSession()은 클라이언트 저장소 기반이므로 보안 검증의 단일 근거로 사용 불가
        // 최종 보안은 RLS 및 서버 측 검증으로 담보됨
        const valid = !error && !!session?.user;
        setHasValidSession(valid);

        console.log("[PROTECTED_ROUTE] 세션 검증 완료", {
          path: location.pathname,
          hasSession: !!session,
          hasError: !!error,
          isValid: valid,
          userId: user?.id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("[PROTECTED_ROUTE] 세션 검증 중 예외 발생:", err);
        setHasValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [location.pathname, user?.id]);

  // 접근 시도 로깅
  useEffect(() => {
    if (!isCheckingSession) {
      console.log("[PROTECTED_ROUTE] 보호된 라우트 접근 시도", {
        path: location.pathname,
        isAuthenticated,
        hasValidSession,
        userId: user?.id,
        username: user?.username,
        timestamp: new Date().toISOString()
      });
    }
  }, [location.pathname, isAuthenticated, hasValidSession, user, isCheckingSession]);

  // 세션 확인 중일 때 로딩 상태 표시
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-sm text-surface-600 dark:text-surface-400">
            세션 확인 중...
          </p>
        </div>
      </div>
    );
  }

  // 인증되지 않았거나 유효한 세션이 없는 경우 리다이렉트
  // 클라이언트 체크는 UX/편의 목적이며, 보안의 최종 방어선은 RLS 및 서버 측 검증
  if (!isAuthenticated || !hasValidSession) {
    console.warn("[PROTECTED_ROUTE] 인증되지 않은 접근 차단", {
      attemptedPath: location.pathname,
      redirectTo,
      reason: !isAuthenticated ? "스토어에 인증 상태 없음" : "유효한 Supabase 세션 없음",
      timestamp: new Date().toISOString()
    });

    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} // 원래 경로를 state로 전달 (로그인 후 복귀 가능)
        replace // 브라우저 히스토리에 남기지 않음
      />
    );
  }

  // 인증된 경우 정상적으로 컴포넌트 렌더링
  console.log("[PROTECTED_ROUTE] 인증된 사용자 접근 허용", {
    path: location.pathname,
    userId: user?.id,
    username: user?.username,
    timestamp: new Date().toISOString()
  });

  return <>{children}</>;
}
