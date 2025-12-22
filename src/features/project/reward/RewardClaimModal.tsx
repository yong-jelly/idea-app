import { useState } from "react";
import { X, Check, Copy, ExternalLink, Smartphone, Monitor, Globe, Gift, Ticket, Zap, Download } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, Badge, Card, CardContent } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import type { Reward, RewardType } from "@/entities/project";

// 리워드 타입 정보
const REWARD_TYPE_INFO: Record<RewardType, { label: string; icon: typeof Gift; color: string }> = {
  redeem_code: { label: "리딤코드", icon: Ticket, color: "text-emerald-500" },
  beta_access: { label: "베타 액세스", icon: Zap, color: "text-violet-500" },
  digital: { label: "디지털", icon: Download, color: "text-blue-500" },
  physical: { label: "실물", icon: Gift, color: "text-amber-500" },
};

// 플랫폼 아이콘
const PLATFORM_ICONS: Record<string, typeof Smartphone> = {
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
  web: Globe,
};

interface RewardClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward;
  userPoints: number;
  onClaim: (reward: Reward) => Promise<{ success: boolean; code?: string; accessUrl?: string }>;
}

export function RewardClaimModal({ open, onOpenChange, reward, userPoints, onClaim }: RewardClaimModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; code?: string; accessUrl?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const typeInfo = REWARD_TYPE_INFO[reward.type];
  const TypeIcon = typeInfo?.icon || Gift;
  const canClaim = userPoints >= reward.pointsRequired;
  const PlatformIcon = reward.platform ? PLATFORM_ICONS[reward.platform] : null;

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      const result = await onClaim(reward);
      setClaimResult(result);
    } catch (error) {
      console.error("Failed to claim reward:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (claimResult?.code) {
      navigator.clipboard.writeText(claimResult.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClose = () => {
    setClaimResult(null);
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
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {claimResult?.success ? "교환 완료!" : "리워드 교환"}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {claimResult?.success 
                ? "리워드가 성공적으로 교환되었습니다" 
                : "포인트를 사용하여 리워드를 교환합니다"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        {/* 리워드 정보 카드 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                typeInfo?.color,
                "bg-current/10"
              )}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                  {reward.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {typeInfo?.label}
                  </Badge>
                  {reward.platform && (
                    <Badge variant="outline" className="text-[10px]">
                      {reward.platform.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {reward.description}
            </p>
            
            {reward.type === "beta_access" && reward.platform && !claimResult && (
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 p-2 rounded-lg bg-surface-50 dark:bg-surface-800 mt-3">
                {PlatformIcon && <PlatformIcon className="h-4 w-4" />}
                <span>{reward.platform.toUpperCase()} 플랫폼</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 교환 전 */}
        {!claimResult && (
          <>
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
                canClaim ? "text-primary-700 dark:text-primary-300" : "text-rose-500"
              )}>
                {formatNumber(Math.max(0, userPoints - reward.pointsRequired))} P
              </span>
            </div>

            {!canClaim && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mb-4">
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  포인트가 부족합니다. {formatNumber(reward.pointsRequired - userPoints)} P가 더 필요합니다.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                disabled={!canClaim || isLoading}
                onClick={handleClaim}
              >
                {isLoading ? "처리 중..." : "교환하기"}
              </Button>
            </div>
          </>
        )}

        {/* 교환 완료 */}
        {claimResult?.success && (
          <>
            {/* 리딤코드 결과 */}
            {claimResult.code && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 mb-4">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
                  발급된 코드
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-surface-800 px-4 py-2 rounded-lg">
                    {claimResult.code}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="shrink-0"
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">
                  코드를 복사하여 사용하세요. 교환 내역에서 다시 확인할 수 있습니다.
                </p>
              </div>
            )}

            {/* 베타 액세스 결과 */}
            {claimResult.accessUrl && (
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 mb-4">
                <p className="text-sm text-violet-600 dark:text-violet-400 mb-2">
                  베타 테스트 참여 링크
                </p>
                <a
                  href={claimResult.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  테스트 참여하기
                </a>
                <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-2">
                  링크를 클릭하여 베타 테스트에 참여하세요.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleClose}
            >
              확인
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}








