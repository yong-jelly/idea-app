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
  techStack: string[];
  author: Pick<User, "id" | "username" | "displayName" | "avatar">;
  thumbnail?: string;
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

export interface Reward {
  id: string;
  projectId: string;
  title: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  claimedCount: number;
  type: "coupon" | "access" | "digital" | "physical";
}

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

