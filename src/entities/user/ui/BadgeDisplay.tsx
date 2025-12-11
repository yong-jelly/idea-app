import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Info, ChevronRight } from "lucide-react";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { type Badge, type BadgeRarity, BADGE_INFO, BADGE_RARITY_INFO } from "../model/user.types";

interface BadgeDisplayProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  onViewAll?: () => void;
}

export function BadgeDisplay({ badges, maxDisplay = 5, size = "md", showTooltip = true, onViewAll }: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<Badge | null>(null);

  const displayBadges = badges.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, badges.length - maxDisplay);

  const sizeClasses = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-lg",
    lg: "h-10 w-10 text-xl",
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
  };

  if (badges.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {displayBadges.map((badge) => {
          const badgeInfo = BADGE_INFO[badge.type];
          const rarityInfo = BADGE_RARITY_INFO[badge.rarity];
          
          return (
            <div
              key={badge.id}
              className="relative"
              onMouseEnter={() => setHoveredBadge(badge)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              <button
                onClick={() => handleBadgeClick(badge)}
                className={cn(
                  "flex items-center justify-center rounded-full transition-transform hover:scale-110",
                  sizeClasses[size],
                  rarityInfo?.bgColor,
                  "ring-1 ring-inset",
                  badge.rarity === "legendary" && "ring-amber-300 dark:ring-amber-600",
                  badge.rarity === "epic" && "ring-violet-300 dark:ring-violet-600",
                  badge.rarity === "rare" && "ring-blue-300 dark:ring-blue-600",
                  badge.rarity === "common" && "ring-surface-200 dark:ring-surface-700"
                )}
              >
                {badgeInfo?.icon || badge.icon}
              </button>

              {/* 툴팁 */}
              {showTooltip && hoveredBadge?.id === badge.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-surface-900 text-white text-xs whitespace-nowrap z-10 pointer-events-none">
                  {badge.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
                </div>
              )}
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <button
            onClick={onViewAll}
            className={cn(
              "flex items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 font-medium transition-colors hover:bg-surface-200 dark:hover:bg-surface-700",
              sizeClasses[size]
            )}
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {/* 배지 상세 모달 */}
      {selectedBadge && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setSelectedBadge(null)}
          />
          <div className="relative z-50 w-full max-w-xs rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <X className="h-4 w-4 text-surface-400" />
            </button>

            <BadgeCard badge={selectedBadge} size="lg" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// 개별 배지 카드 컴포넌트
interface BadgeCardProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  showProject?: boolean;
}

export function BadgeCard({ badge, size = "md", showProject = true }: BadgeCardProps) {
  const badgeInfo = BADGE_INFO[badge.type];
  const rarityInfo = BADGE_RARITY_INFO[badge.rarity];

  const iconSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <div className="text-center">
      {/* 아이콘 */}
      <div className={cn(
        "mx-auto mb-3 flex items-center justify-center rounded-2xl",
        size === "lg" ? "h-20 w-20" : size === "md" ? "h-16 w-16" : "h-12 w-12",
        rarityInfo?.bgColor,
        "ring-2 ring-inset",
        badge.rarity === "legendary" && "ring-amber-300 dark:ring-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30",
        badge.rarity === "epic" && "ring-violet-300 dark:ring-violet-600 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30",
        badge.rarity === "rare" && "ring-blue-300 dark:ring-blue-600",
        badge.rarity === "common" && "ring-surface-200 dark:ring-surface-700"
      )}>
        <span className={iconSizes[size]}>
          {badgeInfo?.icon || badge.icon}
        </span>
      </div>

      {/* 이름 */}
      <h4 className={cn(
        "font-semibold text-surface-900 dark:text-surface-50",
        size === "lg" ? "text-lg" : "text-base"
      )}>
        {badge.name}
      </h4>

      {/* 희귀도 */}
      <span className={cn(
        "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
        rarityInfo?.color,
        rarityInfo?.bgColor
      )}>
        {rarityInfo?.label}
      </span>

      {/* 설명 */}
      <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
        {badge.description}
      </p>

      {/* 획득일 */}
      {badge.earnedAt && (
        <p className="mt-2 text-xs text-surface-400">
          {formatRelativeTime(badge.earnedAt)}에 획득
        </p>
      )}

      {/* 프로젝트 */}
      {showProject && badge.projectTitle && (
        <p className="mt-1 text-xs text-surface-400">
          {badge.projectTitle}
        </p>
      )}
    </div>
  );
}

// 배지 그리드 컴포넌트 (전체 배지 보기용)
interface BadgeGridProps {
  badges: Badge[];
  emptyMessage?: string;
}

export function BadgeGrid({ badges, emptyMessage = "획득한 배지가 없습니다" }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏅</div>
        <p className="text-surface-500 dark:text-surface-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // 희귀도별 정렬
  const sortedBadges = [...badges].sort((a, b) => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
      {sortedBadges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} size="sm" showProject={false} />
      ))}
    </div>
  );
}

// 컴팩트 배지 목록
interface BadgeListCompactProps {
  badges: Badge[];
  maxShow?: number;
}

export function BadgeListCompact({ badges, maxShow = 3 }: BadgeListCompactProps) {
  const displayBadges = badges.slice(0, maxShow);
  const hasMore = badges.length > maxShow;

  return (
    <div className="flex items-center gap-0.5">
      {displayBadges.map((badge) => {
        const badgeInfo = BADGE_INFO[badge.type];
        const rarityInfo = BADGE_RARITY_INFO[badge.rarity];
        
        return (
          <span
            key={badge.id}
            title={badge.name}
            className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full text-xs",
              rarityInfo?.bgColor
            )}
          >
            {badgeInfo?.icon || badge.icon}
          </span>
        );
      })}
      {hasMore && (
        <span className="text-xs text-surface-400 ml-1">
          +{badges.length - maxShow}
        </span>
      )}
    </div>
  );
}



