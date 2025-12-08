import { Card, CardContent, Badge, Button, Progress } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import type { Reward, RewardType } from "../../model/feed.types";
import { REWARD_TYPE_INFO } from "../../model/feed.types";

// 미니멀 아이콘들
const GiftIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M6 6V5a3 3 0 013-3 3 3 0 012.83 4H14a2 2 0 012 2v1a1 1 0 01-1 1H3a1 1 0 01-1-1V8a2 2 0 012-2h2.17A3 3 0 019 2a3 3 0 013 3v1h2V5a3 3 0 00-3-3 3 3 0 00-2.83 4H6zM9 6V5a1 1 0 00-1-1 1 1 0 00-1 1v1h2zm2 0h2V5a1 1 0 00-1-1 1 1 0 00-1 1v1z"/>
    <path d="M3 11v6a2 2 0 002 2h10a2 2 0 002-2v-6H3z"/>
  </svg>
);

const TicketIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/>
  </svg>
);

const BoxIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2L2 6v8l8 4 8-4V6l-8-4zM4 8.236l5 2.5v5.528l-5-2.5V8.236zm6 8.028V10.736l5-2.5v5.528l-5 2.5zM10 9L5.236 6.618 10 4.236l4.764 2.382L10 9z"/>
  </svg>
);

const TrophyIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a2 2 0 00-2 2v1h-.5A1.5 1.5 0 001 7.5v1A2.5 2.5 0 003.5 11H4a4 4 0 003 3.874V17H5a1 1 0 100 2h10a1 1 0 100-2h-2v-2.126A4 4 0 0016 11h.5A2.5 2.5 0 0019 8.5v-1A1.5 1.5 0 0017.5 6H17V5a2 2 0 00-2-2H5z"/>
  </svg>
);

const REWARD_ICONS: Record<RewardType, () => JSX.Element> = {
  digital: GiftIcon,
  access: TicketIcon,
  physical: BoxIcon,
};

export interface RewardRowProps {
  reward: Reward;
  userPoints?: number;
  onClaim?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * 리워드 Row
 * 
 * 프로젝트 리워드를 표시합니다.
 * 필요 포인트, 남은 수량, 교환 버튼 등을 보여줍니다.
 */
export function RewardRow({
  reward,
  userPoints = 0,
  onClaim,
  onClick,
  className,
}: RewardRowProps) {
  const remaining = reward.quantity - reward.claimedCount;
  const progress = (reward.claimedCount / reward.quantity) * 100;
  const canClaim = userPoints >= reward.pointsRequired && remaining > 0;
  
  const RewardIcon = REWARD_ICONS[reward.type];
  const typeInfo = REWARD_TYPE_INFO[reward.type];

  return (
    <Card 
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className={typeInfo.colorClass}><TrophyIcon /></span>
          <Badge variant="secondary" className="text-[10px] rounded-full">
            {typeInfo.label}
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
          {reward.title}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
          {reward.description}
        </p>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-surface-500 mb-1">
            <span>남은 수량</span>
            <span className="tabular-nums">{remaining} / {reward.quantity}</span>
          </div>
          <Progress value={progress} size="sm" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary-600 dark:text-primary-400 tabular-nums">
            {formatNumber(reward.pointsRequired)} P
          </span>
          <Button
            size="sm"
            disabled={!canClaim}
            variant={canClaim ? "primary" : "outline"}
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.();
            }}
          >
            {remaining === 0 ? "품절" : canClaim ? "교환하기" : "포인트 부족"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== 컴팩트 버전 ==========

export interface RewardRowCompactProps {
  reward: Reward;
  onClick?: () => void;
  className?: string;
}

export function RewardRowCompact({
  reward,
  onClick,
  className,
}: RewardRowCompactProps) {
  const remaining = reward.quantity - reward.claimedCount;
  const RewardIcon = REWARD_ICONS[reward.type];
  const typeInfo = REWARD_TYPE_INFO[reward.type];

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        "bg-white dark:bg-surface-900 shadow-sm",
        typeInfo.colorClass
      )}>
        <RewardIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
          {reward.title}
        </h4>
        <p className="text-xs text-surface-500 tabular-nums">
          {formatNumber(reward.pointsRequired)} P · 남은 {remaining}개
        </p>
      </div>
    </div>
  );
}
