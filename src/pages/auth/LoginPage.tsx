import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ChevronLeft, Mail, Lock } from "lucide-react";
import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUserStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 사용자 정보를 가져와서 스토어에 저장
        // 실제로는 Supabase에서 사용자 프로필 정보를 가져와야 함
        const demoUser = {
          id: data.user.id,
          username: data.user.email?.split("@")[0].toLowerCase() || "user",
          displayName: data.user.email?.split("@")[0] || "사용자",
          avatar: undefined,
          bio: "",
          points: 100,
          level: "bronze" as const,
          subscribedProjectsCount: 0,
          supportedProjectsCount: 0,
          projectsCount: 0,
          createdAt: data.user.created_at,
        };

        login(demoUser);
        navigate("/");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-12">
        {/* 헤더 - 뒤로 가기 버튼 */}
        <header className="mb-6 md:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
        </header>

        {/* 폼 컨텐츠 */}
        <div className="mx-auto max-w-lg">
          <h1 className="text-[31px] font-bold leading-9 text-surface-900 dark:text-white mb-8 text-center">
            IndieStart에 로그인하기
          </h1>

          {/* 구글 로그인 버튼 */}
          <Button
            className={cn(
              "w-full h-[52px] text-[15px] font-semibold mb-3 rounded-full",
              "bg-white border border-surface-300 text-surface-900",
              "hover:bg-surface-50 hover:border-surface-400",
              "dark:bg-black dark:border-surface-800 dark:text-white",
              "dark:hover:bg-surface-900 dark:hover:border-surface-700"
            )}
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>

          {/* 구분선 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-surface-950 text-surface-500 dark:text-surface-500">
                또는
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {/* 로그인 폼 */}
          <div className="space-y-5">
            {/* 이메일 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                <Mail className="h-4 w-4" />
                이메일
              </label>
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-12 text-[15px] rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim() && password.trim()) {
                    handleLogin();
                  }
                }}
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                <Lock className="h-4 w-4" />
                비밀번호
              </label>
              <Input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-12 text-[15px] rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email.trim() && password.trim()) {
                    handleLogin();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            <Button
              className="w-full h-12 text-[15px] font-semibold rounded-xl mt-2"
              onClick={handleLogin}
              disabled={!email.trim() || !password.trim() || isLoading}
              isLoading={isLoading}
            >
              로그인
            </Button>
          </div>

          {/* 가입 링크 */}
          <div className="pt-8">
            <p className="text-[15px] text-surface-900 dark:text-white text-center">
              계정이 없으신가요?{" "}
              <Link
                to="/signup"
                className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
              >
                가입하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

