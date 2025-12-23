import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Flame, Calendar, Info } from "lucide-react";
import { Button, Card, CardContent, Badge, Progress } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { type PointRule, type PointActivityType, POINT_ACTIVITY_INFO } from "@/entities/project";

interface PointEarnRulesProps {
  rules: PointRule[];
  projectId: string;
  userStreak?: number;
  lastCheckinDate?: string;
  onCheckin?: () => Promise<{ success: boolean; points: number }>;
  compact?: boolean;
}

export function PointEarnRules({ 
  rules, 
  projectId, 
  userStreak = 0, 
  lastCheckinDate,
  onCheckin,
  compact = false 
}: PointEarnRulesProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ success: boolean; points: number } | null>(null);

  const activeRules = rules.filter(r => r.isActive);
  
  // 오늘 출석 체크 여부
  const today = new Date().toDateString();
  const hasCheckedInToday = lastCheckinDate && new Date(lastCheckinDate).toDateString() === today;

  // 다음 주간 보너스까지 남은 일수
  const daysToWeeklyBonus = 7 - (userStreak % 7);

  const handleCheckin = async () => {
    if (!onCheckin || hasCheckedInToday) return;
    
    setIsCheckingIn(true);
    try {
      const result = await onCheckin();
      setCheckinResult(result);
      setTimeout(() => setCheckinResult(null), 3000);
    } catch (error) {
      console.error("Checkin failed:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 컴팩트 모드
  if (compact && !isExpanded) {
    return (
      <Card className="cursor-pointer" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                포인트 적립 방법
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-surface-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      {compact && (
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(false)}
        >
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            포인트 적립 방법
          </h3>
          <ChevronUp className="h-4 w-4 text-surface-400" />
        </div>
      )}

      {/* 출석 체크 카드 */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white text-xl shadow-md">
                📅
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
                  오늘의 출석체크
                </h4>
                <div className="flex items-center gap-2 text-sm text-emerald-600/70 dark:text-emerald-400/70">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{userStreak}일 연속 출석 중</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 주간 보너스 진행률 */}
              <div className="hidden sm:block">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 text-right">
                  주간 보너스까지 {daysToWeeklyBonus}일
                </div>
                <div className="w-24">
                  <Progress 
                    value={((7 - daysToWeeklyBonus) / 7) * 100} 
                    className="h-1.5 bg-emerald-200 dark:bg-emerald-800"
                  />
                </div>
              </div>

              <Button 
                className={cn(
                  "shadow-md",
                  hasCheckedInToday 
                    ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300 cursor-default" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
                disabled={hasCheckedInToday || isCheckingIn}
                onClick={handleCheckin}
              >
                {hasCheckedInToday ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    출석 완료
                  </>
                ) : isCheckingIn ? (
                  "처리 중..."
                ) : (
                  "출석하기"
                )}
              </Button>
            </div>
          </div>

          {/* 출석 체크 결과 토스트 */}
          {checkinResult?.success && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-center">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                +{checkinResult.points} P 획득!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 적립 규칙 목록 */}
      <div className="grid gap-3 md:grid-cols-2">
        {activeRules.map((rule) => {
          const activityInfo = POINT_ACTIVITY_INFO[rule.activityType];
          if (!activityInfo) return null;

          return (
            <Card key={rule.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-2xl shrink-0">
                  {activityInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-surface-900 dark:text-surface-50">
                      {activityInfo.label}
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

      {/* 추가 안내 */}
      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-surface-400 mt-0.5 shrink-0" />
          <div className="text-sm text-surface-500 dark:text-surface-400">
            <p>포인트는 프로젝트 활동에 따라 자동으로 적립됩니다.</p>
            <p className="mt-1">적립된 포인트로 다양한 리워드를 교환할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}









