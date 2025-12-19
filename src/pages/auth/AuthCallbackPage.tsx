import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/shared/lib/supabase";
import { useUserStore } from "@/entities/user";

// DB에서 반환되는 사용자 타입
interface DbUser {
  id: number;
  auth_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  points: number;
  level: string;
  subscribed_projects_count: number;
  supported_projects_count: number;
  projects_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const errorParam = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");
        const debugMode = urlParams.get("debug") === "true";

        if (errorParam) {
          setError(`${errorParam}: ${errorDescription}`);
          return;
        }

        let authUser = null;

        if (code) {
          // code를 세션으로 교환
          const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) {
            setError(authError.message);
            return;
          }

          authUser = data.user;
        } else {
          // code가 없으면 현재 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setError(sessionError.message);
            return;
          }

          authUser = session?.user ?? null;
        }

        if (!authUser) {
          setError("인증 정보를 찾을 수 없습니다");
          return;
        }

        // DB에 사용자 정보 저장 (v1_upsert_user 호출)
        const { data: dbUserData, error: dbError } = await supabase
          .schema("odd")
          .rpc("v1_upsert_user", {
            p_auth_id: authUser.id,
            p_email: authUser.email,
            p_display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            p_avatar_url: authUser.user_metadata?.avatar_url || null,
          })
          .single();

        const dbUser = dbUserData as DbUser | null;

        if (dbError || !dbUser) {
          console.error("DB 저장 에러:", dbError);
          setError(dbError?.message || "사용자 정보를 가져올 수 없습니다");
          return;
        }

        const savedUser = dbUser;

        // 스토어에 사용자 정보 저장
        login({
          id: savedUser.id.toString(),
          username: savedUser.username || "",
          displayName: savedUser.display_name || "",
          avatar: savedUser.avatar_url || undefined,
          bio: savedUser.bio || undefined,
          website: savedUser.website || undefined,
          github: savedUser.github || undefined,
          twitter: savedUser.twitter || undefined,
          points: savedUser.points,
          level: savedUser.level as "bronze" | "silver" | "gold" | "platinum",
          subscribedProjectsCount: savedUser.subscribed_projects_count,
          supportedProjectsCount: savedUser.supported_projects_count,
          projectsCount: savedUser.projects_count,
          createdAt: savedUser.created_at,
        });

        // 디버그 모드가 아니면 프로필 페이지로 리다이렉트
        if (!debugMode && savedUser.username) {
          navigate(`/profile/${savedUser.username}`, { replace: true });
        }
      } catch (err) {
        console.error("콜백 처리 에러:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      }
    };

    handleCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <p className="text-rose-600 dark:text-rose-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <p className="text-surface-600 dark:text-surface-400">인증 처리 중...</p>
      </div>
    </div>
  );
}
