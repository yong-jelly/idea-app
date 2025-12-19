/**
 * PostDetailPage 관련 타입 정의
 */

/**
 * 원시 댓글 데이터 타입 (API/목 데이터용)
 */
export type RawComment = {
  id: string;
  parentId?: string;
  replyTo?: { username: string; displayName: string };
  depth?: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  isDeleted?: boolean;
  images?: string[];
  replies?: RawComment[];
};

/**
 * 피드 타입 설정
 */
export type PostTypeConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
};

/**
 * 피드 타입 키
 */
export type PostType = 
  | "text" 
  | "project_update" 
  | "milestone" 
  | "feature_accepted"
  | "project_created"
  | "announcement"
  | "update"
  | "vote"
  | "bug"
  | "feature"
  | "improvement"
  | "question";

