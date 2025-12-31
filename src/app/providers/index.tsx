import { type ReactNode, useEffect } from "react";
import { useUIStore } from "@/shared/config";
import { supabase } from "@/shared/lib/supabase";
import { useUserStore } from "@/entities/user";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { theme } = useUIStore();

  // 테마 초기화
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

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const { theme } = useUIStore.getState();
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // 앱 초기화 시 세션 복구
  useEffect(() => {
    useUserStore.getState().initSession();
  }, []);

  // Supabase 인증 상태 변경 리스너
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // 콜백을 동기적으로 끝내고, 비동기 작업은 다음 틱에서 실행
        // 이렇게 하면 onAuthStateChange 콜백에서의 데드락 위험을 방지할 수 있습니다.
        setTimeout(() => {
          const store = useUserStore.getState();

          if (event === "INITIAL_SESSION") {
            // INITIAL_SESSION은 initSession()에서 이미 처리하므로 건너뛰기
            return;
          }

          if (event === "SIGNED_IN") {
            // SIGNED_IN: 항상 동기화 진행
            store.syncUserFromSession();
          } else if (event === "SIGNED_OUT") {
            // SIGNED_OUT: 상태 초기화 및 플래그 리셋
            store.setUser(null);
          } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            // TOKEN_REFRESHED, USER_UPDATED: 동기화 중이 아니면 진행
            if (!store.isSyncing) {
              store.syncUserFromSession();
            }
          }
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

