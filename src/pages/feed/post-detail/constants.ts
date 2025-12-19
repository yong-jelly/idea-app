/**
 * PostDetailPage 관련 상수
 */
import { Clock, Flag, CheckCircle2, Rocket, Megaphone, MessageSquare, Bug, Lightbulb, Sparkles, HelpCircle } from "lucide-react";
import type { PostType, PostTypeConfig } from "./types";

/**
 * 댓글 최대 깊이 (CommentThread 기본값에 맞춤)
 */
export const MAX_COMMENT_DEPTH = 3;

/**
 * 피드 타입별 설정
 */
export const POST_TYPE_CONFIG: Partial<Record<PostType, PostTypeConfig>> = {
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
  project_created: {
    label: "프로젝트 생성",
    icon: Rocket,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
  },
  announcement: {
    label: "공지",
    icon: Megaphone,
    colorClass: "text-primary-600 dark:text-primary-400",
    bgClass: "bg-primary-50 dark:bg-primary-950/30",
  },
  update: {
    label: "업데이트",
    icon: Clock,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  vote: {
    label: "투표",
    icon: MessageSquare,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
  },
  bug: {
    label: "버그",
    icon: Bug,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/30",
  },
  feature: {
    label: "기능 요청",
    icon: Lightbulb,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
  },
  improvement: {
    label: "개선 제안",
    icon: Sparkles,
    colorClass: "text-primary-600 dark:text-primary-400",
    bgClass: "bg-primary-50 dark:bg-primary-950/30",
  },
  question: {
    label: "질문",
    icon: HelpCircle,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
  },
};

