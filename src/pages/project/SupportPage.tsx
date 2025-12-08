import { useParams, Link } from "react-router";
import { ArrowLeft, Coins, Users, Calendar, Target } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Avatar } from "@/shared/ui";
import { cn, formatCurrency, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useProjectStore, type ProjectIncentives, type Reward } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { SupportActions } from "@/features/project";

// 데모용 리워드 데이터
const demoRewards: Reward[] = [
  {
    id: "1",
    projectId: "1",
    title: "베타 테스터 권한",
    description: "출시 전 베타 버전을 먼저 사용해볼 수 있는 권한",
    pointsRequired: 100,
    quantity: 50,
    claimedCount: 23,
    type: "access",
  },
  {
    id: "2",
    projectId: "1",
    title: "프리미엄 계정 1개월",
    description: "정식 출시 후 프리미엄 기능을 1개월간 무료로 사용",
    pointsRequired: 200,
    quantity: 30,
    claimedCount: 12,
    type: "coupon",
  },
  {
    id: "3",
    projectId: "1",
    title: "개발자와 1:1 멘토링",
    description: "프로젝트 개발자와 30분간 1:1 멘토링 세션",
    pointsRequired: 500,
    quantity: 10,
    claimedCount: 3,
    type: "digital",
  },
];

// 최근 활동 데모
const recentActivity = [
  { user: "박개발", action: "프로젝트에 좋아요", points: 5, time: "2분 전" },
  { user: "김프론트", action: "상세 리뷰 작성", points: 25, time: "15분 전" },
  { user: "이백엔드", action: "소셜 미디어 공유", points: 15, time: "1시간 전" },
  { user: "최풀스택", action: "댓글 작성", points: 10, time: "2시간 전" },
];

export function SupportPage() {
  const { id } = useParams<{ id: string }>();
  const { getProject } = useProjectStore();
  const { user, addPoints } = useUserStore();

  const project = getProject(id || "");

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          프로젝트를 찾을 수 없습니다
        </h1>
        <Link to="/explore">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            탐색으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const incentives: ProjectIncentives = {
    vote: 5,
    comment: 10,
    share: 15,
    externalPromo: 20,
    review: 25,
  };

  const fundingProgress = Math.round((project.currentFunding / project.targetFunding) * 100);

  const handleActionComplete = (actionId: string, points: number) => {
    addPoints(points);
  };

  const handleClaimReward = (reward: Reward) => {
    if (!user || user.points < reward.pointsRequired) return;
    // 리워드 클레임 로직
    console.log("Claim reward:", reward.id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/project/${project.id}`}
          className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          프로젝트로 돌아가기
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {project.title} 후원하기
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              다양한 방법으로 프로젝트를 후원하고 포인트를 획득하세요
            </p>
          </div>
          {user && (
            <Card className="px-6 py-3 text-center">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {user.points.toLocaleString()}P
                </span>
              </div>
              <span className="text-xs text-slate-500">보유 포인트</span>
            </Card>
          )}
        </div>
      </div>

      {/* Project Summary */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <Target className="h-5 w-5" />
                {formatCurrency(project.currentFunding)}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">현재 펀딩액</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fundingProgress}%
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">달성률</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <Users className="h-5 w-5" />
                {formatNumber(project.backersCount)}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">후원자</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <Calendar className="h-5 w-5" />
                {project.daysLeft}
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">남은 일수</span>
            </div>
          </div>
          <Progress value={fundingProgress} className="mt-4" size="lg" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="support">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="support" className="flex-1">
            후원 활동
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1">
            리워드 교환
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="space-y-6">
          <SupportActions
            projectId={project.id}
            incentives={incentives}
            onComplete={handleActionComplete}
          />

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>다른 사용자들의 최근 후원 활동입니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" fallback={activity.user} />
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activity.user}님이 {activity.action}했습니다
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">+{activity.points}P</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {demoRewards.map((reward) => {
              const canClaim = user && user.points >= reward.pointsRequired;
              const isAvailable = reward.claimedCount < reward.quantity;
              const remaining = reward.quantity - reward.claimedCount;

              return (
                <Card
                  key={reward.id}
                  className={cn(
                    "transition-all",
                    canClaim && isAvailable && "ring-2 ring-primary-500"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {reward.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {reward.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline">
                        <Coins className="mr-1 h-3 w-3" />
                        {reward.pointsRequired}P
                      </Badge>
                      <Badge variant="secondary">{remaining}개 남음</Badge>
                    </div>

                    <Progress
                      value={(reward.claimedCount / reward.quantity) * 100}
                      className="mb-3"
                      size="sm"
                    />

                    <Button
                      onClick={() => handleClaimReward(reward)}
                      disabled={!canClaim || !isAvailable}
                      className="w-full"
                      variant={canClaim && isAvailable ? "primary" : "outline"}
                    >
                      {!isAvailable
                        ? "품절"
                        : !canClaim
                        ? "포인트 부족"
                        : "교환하기"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

