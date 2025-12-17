import {
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquareText,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import type {
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackHistory,
} from "./types";

export const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", icon: Bug, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20", borderColor: "border-rose-200 dark:border-rose-800" },
  feature: { label: "기능 요청", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800" },
  improvement: { label: "개선 제안", icon: Sparkles, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20", borderColor: "border-primary-200 dark:border-primary-800" },
  question: { label: "질문", icon: MessageSquareText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
};

export const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", icon: AlertCircle, color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", icon: Clock, color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", icon: X, color: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
};

export const FEEDBACK_PRIORITY_INFO = {
  low: { label: "낮음", color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  medium: { label: "보통", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "높음", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  critical: { label: "긴급", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

// 댓글 기본 설정
export const COMMENT_MAX_DEPTH = 3;
export const COMMENT_ENABLE_ATTACHMENTS = true;
export const COMMENT_MAX_IMAGES = 1;

// 히스토리 타입 라벨 생성 함수
export const getHistoryLabel = (history: {
  type: FeedbackHistory["type"];
  oldValue?: string;
  newValue?: string;
}): string => {
  switch (history.type) {
    case "status_change":
      return `상태를 "${FEEDBACK_STATUS_INFO[history.oldValue as FeedbackStatus]?.label}"에서 "${FEEDBACK_STATUS_INFO[history.newValue as FeedbackStatus]?.label}"(으)로 변경`;
    case "type_change":
      return `타입을 "${FEEDBACK_TYPE_INFO[history.oldValue as FeedbackType]?.label}"에서 "${FEEDBACK_TYPE_INFO[history.newValue as FeedbackType]?.label}"(으)로 변경`;
    case "priority_change":
      return `우선순위를 "${FEEDBACK_PRIORITY_INFO[history.oldValue as FeedbackPriority]?.label || "없음"}"에서 "${FEEDBACK_PRIORITY_INFO[history.newValue as FeedbackPriority]?.label}"(으)로 변경`;
    case "assignee_change":
      return `담당자를 "${history.oldValue || "없음"}"에서 "${history.newValue}"(으)로 변경`;
    case "response_added":
      return "공식 답변을 작성";
    default:
      return "";
  }
};

