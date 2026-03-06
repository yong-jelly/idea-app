/**
 * 리워드 탭 컴포넌트
 * 
 * 프로젝트 서포터를 위한 리워드 시스템을 제공하는 탭입니다.
 * - 포인트 적립 및 리워드 교환
 * - 포인트 적립 방법 안내
 * - 교환 내역 조회
 * - 서포터 순위 확인
 * - 리워드 관리 (프로젝트 소유자만)
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  Gift,
  Trophy,
  Coins,
  Ticket,
  Settings,
  Clock,
  ChevronRight,
  X,
  Copy,
  Check,
  Crown,
  Medal,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react";
import { Button, Avatar, Badge, Progress, Card, CardContent } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { POINT_ACTIVITY_INFO, type PointRule } from "@/entities/project";
import type { Reward, TopSupporter, ClaimedRewardHistory } from "@/entities/project";
import { REWARD_TYPE_INFO, PLATFORM_ICONS } from "../constants";

interface RewardsTabProps {
  rewards: Reward[];
  pointRules: PointRule[];
  topSupporters: TopSupporter[];
  claimedRewards: ClaimedRewardHistory[];
  projectId: string;
  isOwner?: boolean;
}

export function RewardsTab({ 
  rewards, 
  pointRules, 
  topSupporters, 
  claimedRewards, 
  projectId, 
  isOwner 
}: RewardsTabProps) {
  const { user } = useUserStore();
  const [activeSection, setActiveSection] = useState<"rewards" | "earn" | "history" | "leaderboard">("rewards");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const userPoints = user?.points || 0;
  const userLevel = user?.level || "bronze";

  // 레벨 정보 (브론즈 → 실버 → 골드 → 플래티넘)
  const LEVEL_INFO = {
    bronze: { label: "브론즈", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30", nextLevel: "silver", pointsRequired: 500 },
    silver: { label: "실버", color: "text-surface-500", bgColor: "bg-surface-200 dark:bg-surface-700", nextLevel: "gold", pointsRequired: 1500 },
    gold: { label: "골드", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", nextLevel: "platinum", pointsRequired: 5000 },
    platinum: { label: "플래티넘", color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", nextLevel: null, pointsRequired: null },
  };

  const currentLevelInfo = LEVEL_INFO[userLevel];
  const progressToNextLevel = currentLevelInfo.pointsRequired 
    ? Math.min((userPoints / currentLevelInfo.pointsRequired) * 100, 100)
    : 100;

  /**
   * 리워드 교환 모달 열기
   */
  const handleClaimReward = (reward: Reward) => {
    setSelectedReward(reward);
    setIsClaimModalOpen(true);
  };

  /**
   * 리딤 코드 복사 핸들러
   */
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 섹션 목록
  const sections = [
    { id: "rewards" as const, label: "리워드", icon: Gift },
    { id: "earn" as const, label: "포인트 적립", icon: Coins },
    { id: "history" as const, label: "교환 내역", icon: Ticket },
    { id: "leaderboard" as const, label: "서포터 순위", icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* 포인트 현황 카드 */}
      <Card className="bg-gradient-to-br from-primary-50 via-violet-50 to-primary-100 dark:from-primary-950/50 dark:via-violet-950/30 dark:to-primary-900/30 border-primary-200 dark:border-primary-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/30 dark:bg-primary-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-200/30 dark:bg-violet-700/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-5 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-lg">
                <Coins className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-primary-600 dark:text-primary-400 mb-0.5">내 포인트</p>
                <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                  {formatNumber(userPoints)} <span className="text-lg font-medium">P</span>
                </p>
              </div>
            </div>
            
            {/* 레벨 진행률 */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", currentLevelInfo.color)}>
                    {currentLevelInfo.label}
                  </span>
                  {currentLevelInfo.nextLevel && (
                    <>
                      <ChevronRight className="h-3 w-3 text-surface-400" />
                      <span className="text-sm text-surface-500">
                        {LEVEL_INFO[currentLevelInfo.nextLevel as keyof typeof LEVEL_INFO].label}
                      </span>
                    </>
                  )}
                </div>
                {currentLevelInfo.pointsRequired && (
                  <span className="text-xs text-surface-500">
                    {formatNumber(userPoints)} / {formatNumber(currentLevelInfo.pointsRequired)}
                  </span>
                )}
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 섹션 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                activeSection === section.id
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
        
        {/* 관리 버튼 (프로젝트 소유자만) */}
        {isOwner && (
          <Link
            to={`/project/${projectId}/community/rewards/manage`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-surface-900 text-white hover:bg-surface-800 dark:bg-surface-100 dark:text-surface-900 dark:hover:bg-surface-200 transition-all whitespace-nowrap ml-auto"
          >
            <Settings className="h-4 w-4" />
            관리
          </Link>
        )}
      </div>

      {/* 리워드 목록 섹션 */}
      {activeSection === "rewards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              교환 가능한 리워드
            </h3>
            <span className="text-sm text-surface-500">
              총 {rewards.filter(r => r.isActive).length}개
            </span>
          </div>

          {/* 리워드 목록 */}
          <div className="space-y-3">
            {rewards.filter(r => r.isActive).map((reward) => {
              const typeInfo = REWARD_TYPE_INFO[reward.type];
              const isUnlimited = reward.quantity === -1;
              const remaining = isUnlimited ? Infinity : reward.quantity - reward.claimedCount;
              const progress = isUnlimited ? 100 : Math.round((reward.claimedCount / reward.quantity) * 100);
              const canClaim = userPoints >= reward.pointsRequired && remaining > 0;
              const isSoldOut = remaining === 0;

              return (
                <Card 
                  key={reward.id} 
                  className={cn(
                    "transition-colors",
                    isSoldOut && "opacity-50"
                  )}
                >
                  <CardContent className="p-0">
                    <div 
                      className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                      onClick={() => !isSoldOut && handleClaimReward(reward)}
                    >
                      <div className="flex items-start gap-4">
                        {/* 포인트 표시 */}
                        <div
                          className={cn(
                            "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors",
                            canClaim
                              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                              : isSoldOut
                                ? "bg-surface-100 text-surface-400 dark:bg-surface-800"
                                : "bg-surface-100 text-surface-500 dark:bg-surface-800"
                          )}
                        >
                          <span className="text-sm font-bold">{formatNumber(reward.pointsRequired)}</span>
                          <span className="text-[10px]">P</span>
                        </div>

                        {/* 리워드 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                              {reward.title}
                            </h4>
                            <Badge variant="secondary" className="text-[10px]">
                              {typeInfo?.label}
                            </Badge>
                            {reward.platform && (
                              <span className="text-[10px] text-surface-400">
                                {reward.platform.toUpperCase()}
                              </span>
                            )}
                            {isSoldOut && (
                              <Badge className="bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400 text-[10px]">
                                품절
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-surface-400 ml-auto shrink-0" />
                          </div>
                          
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mb-2">
                            {reward.description}
                          </p>

                          {/* 하단 정보 */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                            {/* 수량 진행률 */}
                            {!isUnlimited && (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-surface-400 dark:bg-surface-500 transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                                <span>
                                  {remaining}개 남음
                                </span>
                              </>
                            )}
                            {isUnlimited && (
                              <span className="text-surface-400">무제한</span>
                            )}
                            {reward.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(reward.expiresAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}까지
                              </span>
                            )}
                            <span className="text-surface-400">
                              {formatNumber(reward.claimedCount)}명 교환
                            </span>
                          </div>
                        </div>

                        {/* 교환 버튼 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant={canClaim ? "primary" : "outline"}
                            size="sm"
                            disabled={!canClaim}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimReward(reward);
                            }}
                            className="h-8 text-xs"
                          >
                            {isSoldOut ? "품절" : canClaim ? "교환" : "부족"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 포인트 적립 방법 섹션 */}
      {activeSection === "earn" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            포인트 적립 방법
          </h3>
          
          {/* 포인트 적립 규칙 목록 */}
          <div className="grid gap-3 md:grid-cols-2">
            {pointRules.filter(r => r.isActive).map((rule) => {
              const activityInfo = POINT_ACTIVITY_INFO[rule.activityType];
              return (
                <Card key={rule.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-2xl shrink-0">
                      {activityInfo?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-surface-900 dark:text-surface-50">
                          {activityInfo?.label}
                        </h4>
                        <span className="font-bold text-primary-600 dark:text-primary-400 shrink-0">
                          +{rule.points} P
                        </span>
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                        {rule.description}
                      </p>
                      {rule.maxPerDay && (
                        <p className="text-xs text-surface-400 mt-0.5">
                          일일 최대 {rule.maxPerDay}회
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 출석 체크 버튼 */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white text-xl">
                    📅
                  </div>
                  <div>
                    <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
                      오늘의 출석체크
                    </h4>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
                      매일 출석하고 포인트를 받으세요
                    </p>
                  </div>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Check className="h-4 w-4 mr-1" />
                  출석하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 교환 내역 섹션 */}
      {activeSection === "history" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            내 교환 내역
          </h3>

          {claimedRewards.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                <p className="text-surface-500 dark:text-surface-400">
                  아직 교환한 리워드가 없습니다
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveSection("rewards")}
                >
                  리워드 둘러보기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {claimedRewards.map((claimed) => {
                const typeInfo = REWARD_TYPE_INFO[claimed.reward.type];
                return (
                  <Card key={claimed.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            claimed.isUsed ? "bg-surface-100 dark:bg-surface-800" : "bg-primary-100 dark:bg-primary-900/30"
                          )}>
                            {typeInfo?.icon && <typeInfo.icon className={cn("h-5 w-5", claimed.isUsed ? "text-surface-400" : typeInfo.color)} />}
                          </div>
                          <div>
                            <h4 className={cn(
                              "font-medium",
                              claimed.isUsed ? "text-surface-500" : "text-surface-900 dark:text-surface-50"
                            )}>
                              {claimed.reward.title}
                            </h4>
                            <p className="text-xs text-surface-500">
                              {formatRelativeTime(claimed.claimedAt)}에 교환
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* 리딤 코드 표시 및 복사 */}
                          {claimed.code && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                              <code className="text-sm font-mono text-surface-700 dark:text-surface-300">
                                {claimed.code}
                              </code>
                              <button
                                onClick={() => handleCopyCode(claimed.code!)}
                                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                              >
                                {copiedCode === claimed.code ? (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                          <Badge variant={claimed.isUsed ? "secondary" : "default"}>
                            {claimed.isUsed ? "사용완료" : "미사용"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 서포터 순위 섹션 */}
      {activeSection === "leaderboard" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            이번 달 서포터 순위
          </h3>

          <div className="space-y-2">
            {topSupporters.map((supporter) => {
              const isTop3 = supporter.rank <= 3;
              const rankColors = {
                1: "text-amber-500",
                2: "text-surface-400",
                3: "text-amber-700",
              };
              const rankIcons = {
                1: Crown,
                2: Medal,
                3: Medal,
              };
              const RankIcon = rankIcons[supporter.rank as keyof typeof rankIcons];
              
              return (
                <Card 
                  key={supporter.user.id}
                  className={cn(
                    isTop3 && "ring-1",
                    supporter.rank === 1 && "ring-amber-300 dark:ring-amber-700 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20",
                    supporter.rank === 2 && "ring-surface-300 dark:ring-surface-600",
                    supporter.rank === 3 && "ring-amber-200 dark:ring-amber-800"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* 순위 아이콘 */}
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
                        isTop3 ? rankColors[supporter.rank as keyof typeof rankColors] : "text-surface-400",
                        isTop3 && "bg-current/10"
                      )}>
                        {RankIcon ? <RankIcon className="h-5 w-5" /> : supporter.rank}
                      </div>
                      
                      {/* 유저 정보 */}
                      <Avatar
                        src={supporter.user.avatar}
                        fallback={supporter.user.displayName}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/profile/${supporter.user.username}`}
                          className="font-medium text-surface-900 dark:text-surface-50 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {supporter.user.displayName}
                        </Link>
                        <p className="text-xs text-surface-500">
                          피드백 {supporter.feedbackCount}개
                        </p>
                      </div>
                      
                      {/* 포인트 */}
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          isTop3 ? "text-primary-600 dark:text-primary-400" : "text-surface-600 dark:text-surface-400"
                        )}>
                          {formatNumber(supporter.points)} P
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 리워드 교환 모달 */}
      {isClaimModalOpen && selectedReward && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsClaimModalOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  리워드 교환
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  포인트를 사용하여 리워드를 교환합니다
                </p>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>

            {/* 리워드 정보 */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {REWARD_TYPE_INFO[selectedReward.type]?.icon && (
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      REWARD_TYPE_INFO[selectedReward.type].color,
                      "bg-current/10"
                    )}>
                      {(() => {
                        const Icon = REWARD_TYPE_INFO[selectedReward.type].icon;
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                      {selectedReward.title}
                    </h4>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {REWARD_TYPE_INFO[selectedReward.type]?.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                  {selectedReward.description}
                </p>
                
                {/* 플랫폼 정보 (베타 액세스인 경우) */}
                {selectedReward.type === "beta_access" && selectedReward.platform && (
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                    {PLATFORM_ICONS[selectedReward.platform] && (
                      (() => {
                        const PlatformIcon = PLATFORM_ICONS[selectedReward.platform!];
                        return <PlatformIcon className="h-4 w-4" />;
                      })()
                    )}
                    <span>{selectedReward.platform.toUpperCase()} 플랫폼</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 포인트 정보 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
              <span className="text-surface-600 dark:text-surface-400">필요 포인트</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {formatNumber(selectedReward.pointsRequired)} P
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-950/30 mb-4">
              <span className="text-primary-700 dark:text-primary-300">교환 후 잔여 포인트</span>
              <span className="font-bold text-primary-700 dark:text-primary-300">
                {formatNumber(userPoints - selectedReward.pointsRequired)} P
              </span>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsClaimModalOpen(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                disabled={userPoints < selectedReward.pointsRequired}
              >
                교환하기
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}








