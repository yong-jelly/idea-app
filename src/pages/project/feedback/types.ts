export type FeedbackType = "bug" | "feature" | "improvement" | "question";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
export type FeedbackPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

export interface FeedbackComment {
  id: string;
  author: FeedbackAuthor;
  content: string;
  images?: string[];
  likesCount: number;
  isLiked: boolean;
  depth: number;
  parentId?: string;
  replies?: FeedbackComment[];
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface FeedbackHistory {
  id: string;
  type: "status_change" | "type_change" | "priority_change" | "assignee_change" | "response_added";
  actor: FeedbackAuthor;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority?: FeedbackPriority;
  title: string;
  content: string;
  images?: string[];
  author: FeedbackAuthor;
  assignee?: FeedbackAuthor;
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  comments?: FeedbackComment[];
  developerResponse?: string;
  isPinned?: boolean;
  history?: FeedbackHistory[];
  createdAt: string;
  updatedAt?: string;
}

