import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ChevronLeft, Gift, Coins, Users, Award, Settings } from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, type Reward, type PointRule, POINT_ACTIVITY_INFO } from "@/entities/project";
import { useUserStore, type ProjectRole, PROJECT_ROLE_INFO } from "@/entities/user";
import { RewardManagePanel, PointRuleManagePanel, UserRoleManager } from "@/features/project";

// 더미 리워드 데이터
const dummyRewards: Reward[] = [
  {
    id: "r1",
    projectId: "1",
    title: "얼리버드 서포터 쿠폰",
    description: "프로젝트 초기 지원자를 위한 20% 할인 쿠폰",
    pointsRequired: 100,
    quantity: 500,
    claimedCount: 342,
    type: "redeem_code",
    codePrefix: "EARLY2024",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "r2",
    projectId: "1",
    title: "iOS 베타 테스트 참여권",
    description: "TestFlight를 통해 앱을 미리 체험해보세요",
    pointsRequired: 300,
    quantity: 50,
    claimedCount: 23,
    type: "beta_access",
    platform: "ios",
    accessUrl: "https://testflight.apple.com/join/xxxxx",
    isActive: true,
    createdAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "r3",
    projectId: "1",
    title: "프리미엄 1개월 이용권",
    description: "프리미엄 기능을 1개월간 무료로 이용",
    pointsRequired: 500,
    quantity: 100,
    claimedCount: 78,
    type: "redeem_code",
    codePrefix: "PREMIUM",
    expiresAt: "2025-03-31T23:59:59Z",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "r4",
    projectId: "1",
    title: "Android 베타 테스트",
    description: "Play Store 내부 테스트 프로그램 참여",
    pointsRequired: 300,
    quantity: -1,
    claimedCount: 156,
    type: "beta_access",
    platform: "android",
    accessUrl: "https://play.google.com/apps/testing/xxxxx",
    isActive: true,
    createdAt: "2024-06-15T00:00:00Z",
  },
  {
    id: "r5",
    projectId: "1",
    title: "한정판 굿즈 세트",
    description: "스티커, 티셔츠, 머그컵 등 굿즈 세트",
    pointsRequired: 2000,
    quantity: 50,
    claimedCount: 48,
    type: "physical",
    isActive: false,
    createdAt: "2024-02-01T00:00:00Z",
  },
];

// 더미 포인트 규칙 데이터
const dummyPointRules: PointRule[] = [
  { id: "pr1", projectId: "1", activityType: "daily_checkin", points: 10, maxPerDay: 1, description: "매일 출석체크", isActive: true },
  { id: "pr2", projectId: "1", activityType: "weekly_streak", points: 50, description: "7일 연속 출석 보너스", isActive: true },
  { id: "pr3", projectId: "1", activityType: "feedback_submit", points: 30, maxPerDay: 3, description: "피드백 제출", isActive: true },
  { id: "pr4", projectId: "1", activityType: "feedback_accepted", points: 100, description: "피드백 채택 시 추가 보너스", isActive: true },
  { id: "pr5", projectId: "1", activityType: "bug_report", points: 50, maxPerDay: 5, description: "버그 신고", isActive: true },
  { id: "pr6", projectId: "1", activityType: "feature_vote", points: 5, maxPerDay: 10, description: "기능 투표", isActive: true },
  { id: "pr7", projectId: "1", activityType: "comment", points: 5, maxPerDay: 10, description: "댓글 작성", isActive: true },
  { id: "pr8", projectId: "1", activityType: "share", points: 20, maxPerDay: 3, description: "SNS 공유", isActive: true },
];

// 더미 멤버 데이터
interface ProjectMember {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: ProjectRole;
  assignedAt: string;
  points?: number;
  feedbackCount?: number;
}

const dummyMembers: ProjectMember[] = [
  { userId: "u1", username: "indiemaker", displayName: "인디메이커", role: "owner", assignedAt: "2024-01-01T00:00:00Z", points: 5000, feedbackCount: 0 },
  { userId: "u2", username: "designer_kim", displayName: "김디자이너", role: "team_member", assignedAt: "2024-02-15T00:00:00Z", points: 1200, feedbackCount: 5 },
  { userId: "u3", username: "power_user", displayName: "파워유저", role: "official_supporter", assignedAt: "2024-05-01T00:00:00Z", points: 2850, feedbackCount: 45 },
  { userId: "u4", username: "bug_master", displayName: "버그마스터", role: "beta_tester", assignedAt: "2024-06-01T00:00:00Z", points: 2340, feedbackCount: 38 },
  { userId: "u5", username: "feedback_king", displayName: "피드백킹", role: "contributor", assignedAt: "2024-03-20T00:00:00Z", points: 1890, feedbackCount: 52 },
];

type ManageTab = "rewards" | "points" | "members" | "badges";

export function RewardManagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { user } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<ManageTab>("rewards");
  const [rewards, setRewards] = useState<Reward[]>(dummyRewards);
  const [pointRules, setPointRules] = useState<PointRule[]>(dummyPointRules);
  const [members, setMembers] = useState<ProjectMember[]>(dummyMembers);

  const project = projects[0];
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  // 프로젝트 소유자인지 확인 (실제로는 백엔드에서 확인해야 함)
  const isOwner = true; // 데모용

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Settings className="h-12 w-12 text-surface-300 mb-4" />
        <p className="text-surface-500 mb-4">프로젝트 관리 권한이 없습니다.</p>
        <Button variant="outline" onClick={() => navigate(`/project/${id}/community/rewards`)}>
          리워드 페이지로 돌아가기
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "rewards" as ManageTab, label: "리워드 관리", icon: Gift, count: rewards.length },
    { id: "points" as ManageTab, label: "포인트 규칙", icon: Coins, count: pointRules.length },
    { id: "members" as ManageTab, label: "멤버 관리", icon: Users, count: members.length },
    { id: "badges" as ManageTab, label: "배지 수여", icon: Award, count: 0 },
  ];

  // 리워드 핸들러
  const handleAddReward = async (reward: Omit<Reward, "id" | "claimedCount" | "createdAt">) => {
    const newReward: Reward = {
      ...reward,
      id: `r${Date.now()}`,
      claimedCount: 0,
      createdAt: new Date().toISOString(),
    };
    setRewards([newReward, ...rewards]);
  };

  const handleEditReward = async (id: string, updates: Partial<Reward>) => {
    setRewards(rewards.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteReward = async (id: string) => {
    setRewards(rewards.filter(r => r.id !== id));
  };

  const handleToggleRewardActive = async (id: string, isActive: boolean) => {
    setRewards(rewards.map(r => r.id === id ? { ...r, isActive } : r));
  };

  // 포인트 규칙 핸들러
  const handleUpdatePointRule = async (id: string, updates: Partial<PointRule>) => {
    setPointRules(pointRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleTogglePointRuleActive = async (id: string, isActive: boolean) => {
    setPointRules(pointRules.map(r => r.id === id ? { ...r, isActive } : r));
  };

  // 멤버 핸들러
  const handleAddMember = async (userId: string, role: ProjectRole) => {
    // 실제로는 API 호출 후 사용자 정보를 가져와야 함
    const newMember: ProjectMember = {
      userId,
      username: `user_${userId}`,
      displayName: `사용자 ${userId}`,
      role,
      assignedAt: new Date().toISOString(),
      points: 0,
      feedbackCount: 0,
    };
    setMembers([...members, newMember]);
  };

  const handleUpdateMemberRole = async (userId: string, role: ProjectRole) => {
    setMembers(members.map(m => m.userId === userId ? { ...m, role } : m));
  };

  const handleRemoveMember = async (userId: string) => {
    setMembers(members.filter(m => m.userId !== userId));
  };

  const handleSearchUsers = async (query: string) => {
    // 더미 검색 결과
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: "u10", username: "new_user1", displayName: "새로운 유저 1", points: 500 },
      { id: "u11", username: "new_user2", displayName: "새로운 유저 2", points: 300 },
      { id: "u12", username: "active_supporter", displayName: "활발한 서포터", points: 1500 },
    ].filter(u => 
      u.username.toLowerCase().includes(query.toLowerCase()) || 
      u.displayName.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/project/${id}/community/rewards`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            리워드로 돌아가기
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 text-3xl dark:bg-surface-800">
              {categoryInfo?.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {project.title} 리워드 관리
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                리워드, 포인트 규칙, 멤버를 관리합니다
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {tab.count}
                  </Badge>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {/* 리워드 관리 */}
          {activeTab === "rewards" && (
            <RewardManagePanel
              rewards={rewards}
              projectId={id || "1"}
              onAdd={handleAddReward}
              onEdit={handleEditReward}
              onDelete={handleDeleteReward}
              onToggleActive={handleToggleRewardActive}
            />
          )}

          {/* 포인트 규칙 */}
          {activeTab === "points" && (
            <PointRuleManagePanel
              rules={pointRules}
              projectId={id || "1"}
              onUpdate={handleUpdatePointRule}
              onToggleActive={handleTogglePointRuleActive}
            />
          )}

          {/* 멤버 관리 */}
          {activeTab === "members" && (
            <UserRoleManager
              members={members}
              projectId={id || "1"}
              onAddMember={handleAddMember}
              onUpdateRole={handleUpdateMemberRole}
              onRemoveMember={handleRemoveMember}
              searchUsers={handleSearchUsers}
            />
          )}

          {/* 배지 수여 */}
          {activeTab === "badges" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  배지 수여
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  특별한 서포터에게 배지를 수여합니다
                </p>
              </div>

              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
                  <p className="text-surface-500 dark:text-surface-400 mb-2">
                    배지 수여 기능 준비 중
                  </p>
                  <p className="text-sm text-surface-400 dark:text-surface-500">
                    곧 특별 배지를 서포터에게 직접 수여할 수 있습니다
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

