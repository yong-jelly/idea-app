import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp?: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToSignUp }: LoginModalProps) {
  const { login } = useUserStore();
  
  const [mode, setMode] = useState<"login" | "forgot" | "sent">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setMode("login");
      setEmail("");
      setPassword("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    // 데모용: 간단한 로그인 처리
    setTimeout(() => {
      // 실제로는 API 호출로 인증 처리
      // 여기서는 데모용으로 임시 사용자 생성
      const demoUser = {
        id: Date.now().toString(),
        username: email.split("@")[0].toLowerCase(),
        displayName: email.split("@")[0],
        avatar: undefined,
        bio: "",
        points: 100,
        level: "bronze" as const,
        subscribedProjectsCount: 3,
        supportedProjectsCount: 5,
        projectsCount: 1,
        createdAt: new Date().toISOString(),
      };
      
      login(demoUser);
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    // 데모용: 비밀번호 재설정 이메일 전송 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      setMode("sent");
    }, 1500);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "로그인";
      case "forgot":
        return "비밀번호 찾기";
      case "sent":
        return "이메일 전송 완료";
    }
  };

  const handleBack = () => {
    if (mode === "forgot" || mode === "sent") {
      setMode("login");
      setError("");
    } else {
      onOpenChange(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* 배경 오버레이 */}
      <div
        className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-[600px] md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
          
          {/* 헤더 */}
          <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                {mode === "login" ? (
                  <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                ) : (
                  <ArrowLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                )}
              </button>
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {getTitle()}
              </h1>
            </div>
          </header>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 md:px-8">
              {mode === "login" && (
                <>
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
                      <span className="px-2 bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-500">
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
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setError("");
                          }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          비밀번호를 잊으셨나요?
                        </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          onSwitchToSignUp?.();
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                      >
                        가입하기
                      </button>
                    </p>
                  </div>
                </>
              )}

              {mode === "forgot" && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
                      가입 시 사용한 이메일을 입력하시면<br />
                      비밀번호 재설정 링크를 보내드립니다.
                    </p>
                  </div>

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                      <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* 이메일 */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                        <Mail className="h-4 w-4" />
                        이메일
                      </label>
                      <Input
                        type="email"
                        placeholder="가입 시 사용한 이메일"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        className="h-12 text-[15px] rounded-xl"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && email.trim()) {
                            handleForgotPassword();
                          }
                        }}
                      />
                    </div>

                    <Button
                      className="w-full h-12 text-[15px] font-semibold rounded-xl"
                      onClick={handleForgotPassword}
                      disabled={!email.trim() || isLoading}
                      isLoading={isLoading}
                    >
                      재설정 링크 보내기
                    </Button>
                  </div>

                  <p className="mt-6 text-xs text-surface-500 dark:text-surface-400 text-center leading-relaxed">
                    Google 계정으로 가입하셨다면<br />
                    Google에서 직접 비밀번호를 재설정해주세요.
                  </p>
                </>
              )}

              {mode === "sent" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-3">
                    이메일을 확인해주세요
                  </h2>
                  
                  <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-2">
                    <span className="font-medium text-surface-900 dark:text-white">{email}</span>
                    으로<br />
                    비밀번호 재설정 링크를 보냈습니다.
                  </p>
                  
                  <p className="text-surface-500 dark:text-surface-500 text-xs mb-8">
                    이메일이 도착하지 않았다면 스팸함을 확인해주세요.
                  </p>

                  <Button
                    className="w-full h-12 text-[15px] font-semibold rounded-xl"
                    onClick={() => setMode("login")}
                  >
                    로그인으로 돌아가기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
