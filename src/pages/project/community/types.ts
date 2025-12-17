// 커뮤니티 페이지 타입 정의

export interface PostComment {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  parentId?: string;
  depth?: number;
  likesCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  images?: string[];
  createdAt: string;
  replies?: PostComment[];
}

export interface VoteOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface DevPost {
  id: string;
  type: "announcement" | "update" | "discussion" | "vote";
  title: string;
  content: string;
  images?: string[]; // 이미지 URL 배열
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role: string;
  };
  isPinned?: boolean;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  createdAt: string;
  comments?: PostComment[];
  // 투표 관련 필드
  voteOptions?: VoteOption[];
  votedOptionId?: string; // 현재 사용자가 투표한 옵션 ID
  totalVotes?: number;
}

export interface UserFeedback {
  id: string; // post_id (라우팅 등에 사용)
  feedbackId?: string; // feedback_id (투표 등에 사용)
  type: "bug" | "feature" | "improvement" | "question";
  title: string;
  content: string;
  images?: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  status: "open" | "in_progress" | "resolved" | "closed";
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface ChangelogChange {
  id: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  description: string;
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: ChangelogChange[];
  releasedAt: string;
  // 링크 정보
  repositoryUrl?: string;
  downloadUrl?: string;
}

export interface TopSupporter {
  rank: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  points: number;
  feedbackCount: number;
  joinedAt: string;
}

export interface ClaimedRewardHistory {
  id: string;
  reward: import("@/entities/project").Reward;
  code?: string;
  claimedAt: string;
  isUsed: boolean;
}

export type TabType = "devfeed" | "feedback" | "rewards" | "milestones" | "changelog";

