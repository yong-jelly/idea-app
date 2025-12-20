import type { User, UserType, BotRole } from "@/entities/user";

// ========== 공통 타입 ==========

export interface BaseAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  userType?: UserType;
  botRole?: BotRole;
}

export interface AuthorWithRole extends BaseAuthor {
  role?: string;
}

export interface BaseInteractions {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface ExtendedInteractions extends BaseInteractions {
  bookmarksCount: number;
  isBookmarked: boolean;
}

// ========== 피드 출처 타입 ==========

/**
 * 피드 출처 타입
 * - direct: 메인 피드에서 직접 작성 (기본)
 * - project: 프로젝트 타임라인에서 작성
 * - community: 프로젝트 내 커뮤니티에서 작성
 * - following: 팔로잉 중인 유저의 글
 * - subscribed: 구독/참여 중인 프로젝트/커뮤니티 글
 */
export type FeedSource = "direct" | "project" | "community" | "following" | "subscribed";

export interface FeedSourceInfo {
  type: FeedSource;
  /** 프로젝트/커뮤니티 ID */
  id?: string;
  /** 프로젝트/커뮤니티 이름 */
  name?: string;
  /** 프로젝트/커뮤니티 이모지/아이콘 */
  emoji?: string;
  /** 프로젝트 썸네일 이미지 (프로젝트인 경우) */
  thumbnail?: string;
  /** 내가 참여/팔로우 중인지 여부 */
  isJoined?: boolean;
}

// ========== 일반 피드 타입 ==========

export type GeneralPostType = "text" | "project_update" | "milestone" | "feature_accepted";

export interface TextPost {
  id: string;
  type: "text";
  author: BaseAuthor;
  content: string;
  images?: string[];
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
}

export interface ProjectUpdatePost {
  id: string;
  type: "project_update";
  author: BaseAuthor;
  content: string;
  projectId: string;
  projectTitle: string;
  projectEmoji?: string;
  images?: string[];
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
}

export interface MilestoneAchievedPost {
  id: string;
  type: "milestone";
  author: BaseAuthor;
  content: string;
  projectId: string;
  projectTitle: string;
  milestoneTitle: string;
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
}

export interface FeatureAcceptedPost {
  id: string;
  type: "feature_accepted";
  author: BaseAuthor;
  content: string;
  projectId: string;
  projectTitle: string;
  featureTitle: string;
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
}

export type GeneralPost = TextPost | ProjectUpdatePost | MilestoneAchievedPost | FeatureAcceptedPost;

// ========== 프로젝트 생성 피드 타입 ==========

export interface ProjectCreatedPost {
  id: string;
  type: "project_created";
  author: BaseAuthor;
  content: string;
  projectId: string;
  projectTitle: string;
  projectThumbnail?: string;
  images?: string[];
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
}

// ========== 공지 피드 타입 (확장) ==========

export interface AnnouncementPost {
  id: string;
  type: "announcement" | "update" | "vote";
  title: string;
  content: string;
  author: BaseAuthor;
  projectId?: string;
  projectTitle?: string;
  isPinned?: boolean;
  images?: string[];
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  interactions: ExtendedInteractions;
  createdAt: string;
  // 투표 관련 (vote 타입일 때만)
  voteOptions?: Array<{
    id: string;
    text: string;
    votesCount: number;
    sortOrder: number;
  }>;
  votedOptionId?: string;
  totalVotes?: number;
}

// ========== 피드백 피드 타입 (확장) ==========

export interface FeedbackPostExtended extends FeedbackPost {
  projectId?: string;
  projectTitle?: string;
  /** 피드 출처 정보 */
  source?: FeedSourceInfo;
  /** 인터랙션 정보 */
  interactions: ExtendedInteractions;
  images?: string[];
}

// ========== 통합 피드 타입 ==========

export type UnifiedFeedPost = 
  | GeneralPost 
  | ProjectCreatedPost 
  | AnnouncementPost 
  | FeedbackPostExtended;

// ========== 개발사 피드 타입 ==========

export type DevPostType = "announcement" | "update" | "discussion";

export interface DevPost {
  id: string;
  type: DevPostType;
  title: string;
  content: string;
  author: AuthorWithRole;
  isPinned?: boolean;
  interactions: BaseInteractions;
  createdAt: string;
}

// ========== 피드백 타입 ==========

export type FeedbackType = "bug" | "feature" | "improvement" | "question";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";

export interface FeedbackPost {
  id: string;
  type: FeedbackType;
  title: string;
  content: string;
  author: BaseAuthor;
  status: FeedbackStatus;
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  createdAt: string;
}

// ========== 마일스톤 타입 ==========

export interface MilestoneProgress {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  deliverables: string[];
  isCompleted: boolean;
  completedAt?: string;
  progress: number;
}

// ========== 리워드 타입 ==========

export type RewardType = "digital" | "access" | "physical";

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  claimedCount: number;
  type: RewardType;
}

// ========== 변경사항 타입 ==========

export type ChangeType = "feature" | "improvement" | "fix" | "breaking";

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: {
    type: ChangeType;
    description: string;
  }[];
  releasedAt: string;
}

// ========== 피드 상수 ==========

export const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
  feature: { label: "기능 요청", colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  improvement: { label: "개선 제안", colorClass: "text-primary-500 bg-primary-50 dark:bg-primary-900/20" },
  question: { label: "질문", colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
} as const;

export const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", colorClass: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", colorClass: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", colorClass: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
} as const;

export const CHANGE_TYPE_INFO = {
  feature: { label: "새 기능", colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
  improvement: { label: "개선", colorClass: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400" },
  fix: { label: "수정", colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
  breaking: { label: "주의", colorClass: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400" },
} as const;

export const DEV_POST_TYPE_INFO = {
  announcement: { label: "공지", colorClass: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400" },
  update: { label: "업데이트", colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
  discussion: { label: "토론", colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
} as const;

export const REWARD_TYPE_INFO = {
  digital: { label: "디지털", colorClass: "text-emerald-500" },
  access: { label: "이용권", colorClass: "text-primary-500" },
  physical: { label: "실물", colorClass: "text-amber-500" },
} as const;

