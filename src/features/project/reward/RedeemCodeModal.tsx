import { useState } from "react";
import { X, Check, Copy, Ticket, Clock, AlertCircle, Gift } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, Badge, Card, CardContent } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import type { Reward } from "@/entities/project";

interface RedeemCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward;
  userPoints: number;
  onRedeem: (reward: Reward) => Promise<{ success: boolean; code: string; expiresAt?: string }>;
}

export function RedeemCodeModal({ open, onOpenChange, reward, userPoints, onRedeem }: RedeemCodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; expiresAt?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const canRedeem = userPoints >= reward.pointsRequired;
  const isUnlimited = reward.quantity === -1;
  const remaining = isUnlimited ? Infinity : reward.quantity - reward.claimedCount;
  const isAlmostGone = !isUnlimited && remaining <= 5 && remaining > 0;

  const handleRedeem = async () => {
    setIsLoading(true);
    try {
      const response = await onRedeem(reward);
      if (response.success) {
        setResult(response);
      }
    } catch (error) {
      console.error("Failed to redeem code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px] animate-fade-in"
        onClick={handleClose}
      />
      <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800 animate-scale-in">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                {result ? "코드 발급 완료!" : "리딤코드 교환"}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {result ? "코드가 성공적으로 발급되었습니다" : "포인트로 리딤코드를 교환합니다"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        {/* 리워드 정보 */}
        {!result && (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                    {reward.title}
                  </h4>
                  {isAlmostGone && (
                    <Badge className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[10px]">
                      품절 임박
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                  {reward.description}
                </p>

                {/* 코드 프리픽스 미리보기 */}
                {reward.codePrefix && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                    <span className="text-xs text-surface-500">코드 형식:</span>
                    <code className="text-sm font-mono text-surface-700 dark:text-surface-300">
                      {reward.codePrefix}-XXXXXX
                    </code>
                  </div>
                )}

                {/* 만료일 */}
                {reward.expiresAt && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(reward.expiresAt).toLocaleDateString('ko-KR')}까지 사용 가능</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 수량 정보 */}
            {!isUnlimited && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
                <span className="text-surface-600 dark:text-surface-400">남은 수량</span>
                <span className={cn(
                  "font-bold",
                  isAlmostGone ? "text-rose-500" : "text-surface-700 dark:text-surface-300"
                )}>
                  {remaining}개
                </span>
              </div>
            )}

            {/* 포인트 정보 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
              <span className="text-surface-600 dark:text-surface-400">필요 포인트</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {formatNumber(reward.pointsRequired)} P
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-950/30 mb-4">
              <span className="text-primary-700 dark:text-primary-300">교환 후 잔여 포인트</span>
              <span className={cn(
                "font-bold",
                canRedeem ? "text-primary-700 dark:text-primary-300" : "text-rose-500"
              )}>
                {formatNumber(Math.max(0, userPoints - reward.pointsRequired))} P
              </span>
            </div>

            {!canRedeem && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    포인트가 부족합니다. {formatNumber(reward.pointsRequired - userPoints)} P가 더 필요합니다.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                취소
              </Button>
              <Button 
                className="flex-1" 
                disabled={!canRedeem || remaining === 0 || isLoading}
                onClick={handleRedeem}
              >
                {isLoading ? "처리 중..." : remaining === 0 ? "품절" : "교환하기"}
              </Button>
            </div>
          </>
        )}

        {/* 교환 완료 */}
        {result && (
          <>
            {/* 성공 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
            </div>

            {/* 발급된 코드 */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 mb-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2 text-center">
                발급된 리딤코드
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <code className="text-xl font-mono font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                  {result.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    copiedCode 
                      ? "bg-emerald-200 dark:bg-emerald-800" 
                      : "hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  )}
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-emerald-600" />
                  )}
                </button>
              </div>
              {copiedCode && (
                <p className="text-xs text-emerald-500 text-center">
                  클립보드에 복사되었습니다!
                </p>
              )}
            </div>

            {/* 만료일 안내 */}
            {result.expiresAt && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {new Date(result.expiresAt).toLocaleDateString('ko-KR')}까지 사용 가능
                </span>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
              <p className="text-sm text-surface-600 dark:text-surface-400 text-center">
                코드를 복사하여 사용하세요.<br />
                교환 내역에서 다시 확인할 수 있습니다.
              </p>
            </div>

            <Button className="w-full" onClick={handleClose}>
              확인
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}







