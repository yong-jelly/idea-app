import type { User } from "@/entities/user";

export type ProjectCategory = "game" | "web" | "mobile" | "tool" | "opensource" | "ai";
export type ProjectStatus = "funding" | "in_progress" | "completed" | "cancelled";
export type FeatureRequestStatus = "pending" | "reviewing" | "accepted" | "rejected" | "completed";

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  category: ProjectCategory;
  categoryId?: string; // 원본 카테고리 ID (예: devtool, utility 등)
  techStack: string[];
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  thumbnail?: string;
  galleryImages?: string[]; // 갤러리 이미지 배열
  repositoryUrl?: string;
  demoUrl?: string;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  macStoreUrl?: string;
  currentFunding: number;
  targetFunding: number;
  backersCount: number;
  likesCount: number;
  commentsCount: number;
  daysLeft: number;
  status: ProjectStatus;
  featured: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isMyProject?: boolean; // 내가 생성한 프로젝트 여부 (저장한 프로젝트 목록에서 사용)
  createdAt: string;
}

export type MilestoneStatus = "open" | "closed";
export type TaskStatus = "todo" | "done";

export interface MilestoneTask {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  // 좋아요 관련 필드 (테스트용)
  likesCount?: number;
  isLiked?: boolean;
  likedUsers?: Pick<User, "id" | "username" | "displayName" | "avatar">[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate?: string;
  status: MilestoneStatus;
  openIssuesCount: number;
  closedIssuesCount: number;
  tasks?: MilestoneTask[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

// 리워드 유형
export type RewardType = 
  | "redeem_code"      // 리딤코드 (쿠폰)
  | "beta_access"      // 베타 테스트/TestFlight
  | "digital"          // 디지털 상품
  | "physical";        // 실물 상품

export type RewardPlatform = "ios" | "android" | "desktop" | "web";

export interface Reward {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: RewardType;
  pointsRequired: number;
  quantity: number;           // -1: 무제한
  claimedCount: number;
  expiresAt?: string;         // 기간 한정인 경우
  // 리딤코드 전용
  codePrefix?: string;        // 예: "EARLY2024"
  // 베타 액세스 전용
  platform?: RewardPlatform;
  accessUrl?: string;         // TestFlight 링크 등
  isActive: boolean;
  createdAt: string;
}

// 교환된 리워드
export interface ClaimedReward {
  id: string;
  rewardId: string;
  userId: string;
  reward: Reward;
  code?: string;              // 리딤코드인 경우 발급된 코드
  claimedAt: string;
  expiresAt?: string;
  isUsed: boolean;
}

// 포인트 활동 유형
export type PointActivityType = 
  | "feedback_submit"       // 피드백 제출
  | "feedback_accepted"     // 피드백 채택
  | "bug_report"            // 버그 리포트
  | "feature_vote"          // 기능 투표
  | "daily_checkin"         // 일일 출석
  | "weekly_streak"         // 주간 연속 출석
  | "comment"               // 댓글 작성
  | "share";                // 공유

export interface PointRule {
  id: string;
  projectId: string;
  activityType: PointActivityType;
  points: number;
  maxPerDay?: number;         // 일일 최대 횟수
  description: string;
  isActive: boolean;
}

// 포인트 활동 타입 정보
export const POINT_ACTIVITY_INFO: Record<PointActivityType, { label: string; icon: string; description: string }> = {
  feedback_submit: { label: "피드백 제출", icon: "💬", description: "피드백을 제출하면 포인트를 받습니다" },
  feedback_accepted: { label: "피드백 채택", icon: "✅", description: "피드백이 채택되면 추가 포인트를 받습니다" },
  bug_report: { label: "버그 리포트", icon: "🐛", description: "버그를 발견하고 신고하면 포인트를 받습니다" },
  feature_vote: { label: "기능 투표", icon: "👍", description: "기능 요청에 투표하면 포인트를 받습니다" },
  daily_checkin: { label: "일일 출석", icon: "📅", description: "매일 출석하면 포인트를 받습니다" },
  weekly_streak: { label: "주간 연속 출석", icon: "🔥", description: "7일 연속 출석하면 보너스 포인트를 받습니다" },
  comment: { label: "댓글 작성", icon: "💭", description: "댓글을 작성하면 포인트를 받습니다" },
  share: { label: "공유", icon: "📤", description: "프로젝트를 공유하면 포인트를 받습니다" },
};

export interface FeatureRequest {
  id: string;
  projectId: string;
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  title: string;
  description: string;
  votesCount: number;
  isVoted: boolean;
  status: FeatureRequestStatus;
  developerResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIncentives {
  vote: number;
  comment: number;
  share: number;
  externalPromo: number;
  review: number;
}

export const CATEGORY_INFO: Record<ProjectCategory, { name: string; icon: string }> = {
  game: { name: "게임", icon: "🎮" },
  web: { name: "웹서비스", icon: "🌐" },
  mobile: { name: "모바일앱", icon: "📱" },
  tool: { name: "개발도구", icon: "🛠️" },
  opensource: { name: "오픈소스", icon: "📦" },
  ai: { name: "AI/ML", icon: "🤖" },
};

