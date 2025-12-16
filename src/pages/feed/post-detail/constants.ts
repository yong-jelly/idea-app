/**
 * PostDetailPage 관련 상수
 */
import { Clock, Flag, CheckCircle2 } from "lucide-react";
import type { PostType, PostTypeConfig } from "./types";

/**
 * 댓글 최대 깊이 (CommentThread 기본값에 맞춤)
 */
export const MAX_COMMENT_DEPTH = 3;

/**
 * 피드 타입별 설정
 */
export const POST_TYPE_CONFIG: Record<PostType, PostTypeConfig | null> = {
  text: null,
  project_update: {
    label: "프로젝트 업데이트",
    icon: Clock,
    colorClass: "text-primary-600 dark:text-primary-400",
    bgClass: "bg-primary-50 dark:bg-primary-950/30",
  },
  milestone: {
    label: "마일스톤 달성",
    icon: Flag,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  feature_accepted: {
    label: "기능 수락",
    icon: CheckCircle2,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
  },
};

