// 사용자 타입
export type UserType = "user" | "bot";

// Bot 역할 타입
export type BotRole = 
  | "system_notification"    // 시스템 알림 봇
  | "project_assistant"      // 프로젝트 어시스턴트 봇
  | "community_moderator";    // 커뮤니티 모더레이터 봇

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  subscribedProjectsCount: number;
  supportedProjectsCount: number;
  projectsCount: number;
  badges?: Badge[];
  createdAt: string;
  // Bot 관련 필드
  userType?: UserType;
  botRole?: BotRole;
}

// Bot 작성자 확인 헬퍼 함수
export function isBot(user: User | { userType?: UserType }): boolean {
  return user.userType === "bot";
}

export interface UserProfile extends User {
  isOwnProfile: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 프로젝트 역할
export type ProjectRole = 
  | "owner"              // 프로젝트 소유자
  | "team_member"        // 팀원
  | "official_supporter" // 공식 서포터
  | "beta_tester"        // 베타 테스터
  | "contributor";       // 기여자

export interface UserProjectRole {
  userId: string;
  projectId: string;
  projectTitle: string;
  role: ProjectRole;
  assignedAt: string;
  assignedBy: string;
}

// 역할 정보
export const PROJECT_ROLE_INFO: Record<ProjectRole, { label: string; icon: string; color: string; description: string }> = {
  owner: { label: "소유자", icon: "👑", color: "text-amber-500", description: "프로젝트 소유자" },
  team_member: { label: "팀원", icon: "👥", color: "text-primary-500", description: "프로젝트 팀 멤버" },
  official_supporter: { label: "공식 서포터", icon: "⭐", color: "text-emerald-500", description: "공식 서포터로 선정됨" },
  beta_tester: { label: "베타 테스터", icon: "🧪", color: "text-violet-500", description: "베타 테스트 참여자" },
  contributor: { label: "기여자", icon: "🤝", color: "text-blue-500", description: "프로젝트에 기여함" },
};

// 배지 유형
export type BadgeType = 
  | "early_supporter"      // 얼리 서포터
  | "bug_hunter"           // 버그 헌터
  | "top_contributor"      // 탑 기여자
  | "beta_tester"          // 베타 테스터
  | "streak_7"             // 7일 연속
  | "streak_30"            // 30일 연속
  | "feedback_master"      // 피드백 마스터
  | "team_member"          // 팀원
  | "first_feedback"       // 첫 피드백
  | "helpful_comment";     // 도움되는 댓글

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  earnedAt?: string;
  projectId?: string;       // 프로젝트 특정 배지인 경우
  projectTitle?: string;
}

// 배지 정보
export const BADGE_INFO: Record<BadgeType, { name: string; icon: string; rarity: BadgeRarity; description: string }> = {
  early_supporter: { name: "얼리 서포터", icon: "🌟", rarity: "rare", description: "프로젝트 초기에 서포트" },
  bug_hunter: { name: "버그 헌터", icon: "🐛", rarity: "epic", description: "10개 이상의 버그 발견" },
  top_contributor: { name: "탑 기여자", icon: "🏆", rarity: "legendary", description: "상위 기여자로 선정" },
  beta_tester: { name: "베타 테스터", icon: "🧪", rarity: "rare", description: "베타 테스트 참여" },
  streak_7: { name: "7일 연속", icon: "🔥", rarity: "common", description: "7일 연속 출석" },
  streak_30: { name: "30일 연속", icon: "💎", rarity: "epic", description: "30일 연속 출석" },
  feedback_master: { name: "피드백 마스터", icon: "💬", rarity: "epic", description: "50개 이상의 피드백 작성" },
  team_member: { name: "팀원", icon: "👥", rarity: "legendary", description: "프로젝트 팀원으로 선정" },
  first_feedback: { name: "첫 피드백", icon: "✨", rarity: "common", description: "첫 번째 피드백 작성" },
  helpful_comment: { name: "도움되는 댓글", icon: "💡", rarity: "rare", description: "댓글이 많은 좋아요를 받음" },
};

// 배지 희귀도 정보
export const BADGE_RARITY_INFO: Record<BadgeRarity, { label: string; color: string; bgColor: string }> = {
  common: { label: "일반", color: "text-surface-500", bgColor: "bg-surface-100 dark:bg-surface-800" },
  rare: { label: "희귀", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/30" },
  epic: { label: "영웅", color: "text-violet-500", bgColor: "bg-violet-50 dark:bg-violet-900/30" },
  legendary: { label: "전설", color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/30" },
};

