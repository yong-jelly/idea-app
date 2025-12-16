import { LogIn, UserPlus, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Button } from "./Button";

export interface SignUpPromptModalProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 열림/닫힘 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 회원가입 페이지 경로 */
  signUpPath?: string;
  /** 로그인 페이지 경로 */
  loginPath?: string;
}

/**
 * 비회원 사용자에게 회원 가입을 유도하는 모달 컴포넌트
 * 
 * 좋아요, 북마크, 리포스트 등 회원 전용 기능을 사용하려고 할 때 표시됩니다.
 */
export function SignUpPromptModal({
  open,
  onOpenChange,
  signUpPath = "/signup",
  loginPath = "/login",
}: SignUpPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <DialogTitle>회원 가입이 필요합니다</DialogTitle>
          </div>
          <DialogDescription>
            이 기능을 사용하려면 회원 가입이 필요합니다. 지금 가입하고 더 많은 기능을 이용해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-3">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50 mb-2">
              회원 가입 시 이용 가능한 기능
            </p>
            <ul className="space-y-1.5 text-sm text-surface-600 dark:text-surface-400">
              <li className="flex items-center gap-2">
                <span className="text-primary-500">•</span>
                포스트 좋아요 및 북마크
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-500">•</span>
                댓글 작성 및 답글
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-500">•</span>
                프로젝트 서포트 및 리워드
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-500">•</span>
                커뮤니티 참여 및 활동
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = loginPath;
            }}
          >
            <LogIn className="h-4 w-4 mr-1.5" />
            로그인
          </Button>
          <Button
            onClick={() => {
              window.location.href = signUpPath;
            }}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            회원 가입
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

