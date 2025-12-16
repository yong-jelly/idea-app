import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ChevronLeft, AtSign, User, Lock, Check } from "lucide-react";
import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { LoginModal } from "./LoginModal";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpModal({ open, onOpenChange }: SignUpModalProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { login } = useUserStore();
  
  const [step, setStep] = useState<"email" | "info">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 일치 여부
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;
  const showPasswordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail("");
      setName("");
      setUsername("");
      setPassword("");
      setPasswordConfirm("");
      setIsLoading(false);
    }
  }, [open]);

  const handleEmailSubmit = () => {
    if (email.trim()) {
      setStep("info");
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) return;
    
    setIsLoading(true);
    
    // 데모용: 간단한 사용자 생성
    setTimeout(() => {
      const newUser = {
        id: Date.now().toString(),
        username: username.trim(),
        displayName: name.trim(),
        avatar: undefined,
        bio: "",
        points: 0,
        level: "bronze" as const,
        subscribedProjectsCount: 0,
        supportedProjectsCount: 0,
        projectsCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      login(newUser);
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
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

  // SignUpModal과 LoginModal 둘 다 닫혀있으면 아무것도 렌더링하지 않음
  if (!open && !showLoginModal) return null;

  return (
    <>
      {open && createPortal(
        <div className="fixed inset-0 z-50">
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
                    onClick={() => onOpenChange(false)}
                    className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                  </button>
                  <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {step === "email" ? "가입하기" : "계정 만들기"}
                  </h1>
                </div>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 md:px-8">
                  {/* 폼 컨텐츠 */}
                  {step === "email" ? (
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

                      {/* 이메일 입력 */}
                      <div className="space-y-3">
                        <Input
                          type="email"
                          placeholder="이메일"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-[52px] text-[15px] rounded-full"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && email.trim()) {
                              handleEmailSubmit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          className="w-full h-[52px] text-[15px] font-semibold rounded-full"
                          onClick={handleEmailSubmit}
                          disabled={!email.trim()}
                        >
                          이메일로 가입하기
                        </Button>
                      </div>

                      {/* 약관 동의 */}
                      <p className="text-[11px] text-surface-500 dark:text-surface-500 mt-4 leading-relaxed text-center">
                        가입하면 IndieStart의{" "}
                        <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                          이용약관
                        </Link>
                        ,{" "}
                        <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                          개인정보 처리방침
                        </Link>
                        에 동의하게 됩니다.
                      </p>

                      {/* 로그인 링크 */}
                      <div className="pt-8">
                        <p className="text-[15px] text-surface-900 dark:text-white text-center">
                          이미 계정이 있으신가요?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setShowLoginModal(true);
                              onOpenChange(false);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                          >
                            로그인
                          </button>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 이메일 표시 */}
                      <div className="mb-6 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">가입 이메일</p>
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{email}</p>
                      </div>

                      <div className="space-y-5">
                        {/* 닉네임 */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                            <User className="h-4 w-4" />
                            닉네임
                          </label>
                          <Input
                            type="text"
                            placeholder="프로필에 표시될 이름"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 text-[15px] rounded-xl"
                            autoFocus
                          />
                          <p className="text-xs text-surface-400">다른 사용자에게 보여지는 이름입니다</p>
                        </div>

                        {/* 사용자 ID */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                            <AtSign className="h-4 w-4" />
                            사용자 ID
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-[15px]">@</span>
                            <Input
                              type="text"
                              placeholder="고유한_아이디"
                              value={username}
                              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                              className="h-12 text-[15px] rounded-xl pl-8"
                            />
                            {username.length >= 3 && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Check className="h-4 w-4 text-emerald-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-surface-400">영문, 숫자, 밑줄(_)만 사용 가능</p>
                        </div>

                        {/* 비밀번호 */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                            <Lock className="h-4 w-4" />
                            비밀번호
                          </label>
                          <Input
                            type="password"
                            placeholder="6자 이상 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value.slice(0, 20))}
                            maxLength={20}
                            className="h-12 text-[15px] rounded-xl"
                          />
                          {password.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all",
                                    password.length < 6 ? "w-1/3 bg-rose-500" :
                                    password.length < 10 ? "w-2/3 bg-amber-500" :
                                    "w-full bg-emerald-500"
                                  )}
                                />
                              </div>
                              <span className={cn(
                                "text-xs font-medium",
                                password.length < 6 ? "text-rose-500" :
                                password.length < 10 ? "text-amber-500" :
                                "text-emerald-500"
                              )}>
                                {password.length < 6 ? "약함" : password.length < 10 ? "보통" : "강함"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 비밀번호 확인 */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
                            <Lock className="h-4 w-4" />
                            비밀번호 확인
                          </label>
                          <Input
                            type="password"
                            placeholder="비밀번호를 다시 입력"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value.slice(0, 20))}
                            maxLength={20}
                            className={cn(
                              "h-12 text-[15px] rounded-xl",
                              showPasswordMismatch && "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            )}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && name.trim() && username.length >= 3 && password.length >= 6 && passwordsMatch) {
                                handleSignUp();
                              }
                            }}
                          />
                          {showPasswordMismatch && (
                            <p className="text-xs text-rose-500">비밀번호가 일치하지 않습니다</p>
                          )}
                          {passwordsMatch && (
                            <p className="text-xs text-emerald-500">비밀번호가 일치합니다</p>
                          )}
                        </div>

                        <Button
                          className="w-full h-12 text-[15px] font-semibold rounded-xl mt-2"
                          onClick={handleSignUp}
                          disabled={!name.trim() || username.length < 3 || password.length < 6 || !passwordsMatch || isLoading}
                          isLoading={isLoading}
                        >
                          가입 완료
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 로그인 모달 */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          onOpenChange(true);
        }}
      />
    </>
  );
}

