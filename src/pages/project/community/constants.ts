// 커뮤니티 페이지 상수 정의
import {
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquareText,
  Trophy,
  Ticket,
  Zap,
  Download,
  Gift,
  Smartphone,
  Monitor,
  Globe,
  Megaphone,
  ThumbsUp,
} from "lucide-react";

// 피드백 타입 정보
export const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", icon: Bug, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
  feature: { label: "기능 요청", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  improvement: { label: "개선 제안", icon: Sparkles, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20" },
  question: { label: "질문", icon: MessageSquareText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
};

export const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", color: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
};

// 포스트 타입 정보
export const POST_TYPE_INFO = {
  announcement: { label: "공지", icon: Megaphone, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20", borderColor: "border-primary-300 dark:border-primary-700" },
  update: { label: "업데이트", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-emerald-300 dark:border-emerald-700" },
  vote: { label: "투표", icon: ThumbsUp, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-300 dark:border-amber-700" },
};

// 리워드 타입 정보
export const REWARD_TYPE_INFO: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
  redeem_code: { label: "리딤코드", icon: Ticket, color: "text-emerald-500" },
  beta_access: { label: "베타 액세스", icon: Zap, color: "text-violet-500" },
  digital: { label: "디지털", icon: Download, color: "text-blue-500" },
  physical: { label: "실물", icon: Gift, color: "text-amber-500" },
};

// 플랫폼 아이콘
export const PLATFORM_ICONS: Record<string, typeof Smartphone> = {
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
  web: Globe,
};

// 변경사항 타입 정보
export const CHANGE_TYPE_INFO = {
  feature: { label: "새 기능", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
  improvement: { label: "개선", color: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400" },
  fix: { label: "수정", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
  breaking: { label: "주의", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400" },
};

export const MAX_VISIBLE_CHANGES = 5;

// URL에서 도메인 추출 유틸리티
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}







