import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useUserStore } from "@/entities/user";

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
  const { isAuthenticated, sessionToken, user } = useUserStore();
  const location = useLocation();

  // 접근 시도 로깅
  useEffect(() => {
    console.log("[PROTECTED_ROUTE] 보호된 라우트 접근 시도", {
      path: location.pathname,
      isAuthenticated,
      hasSessionToken: !!sessionToken,
      userId: user?.id,
      username: user?.username,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname, isAuthenticated, sessionToken, user]);

  // 인증되지 않은 경우 리다이렉트
  if (!isAuthenticated) {
    console.warn("[PROTECTED_ROUTE] 인증되지 않은 접근 차단", {
      attemptedPath: location.pathname,
      redirectTo,
      reason: "인증되지 않은 사용자",
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
