import type { Milestone } from "@/entities/project";

/**
 * 마일스톤의 진행률을 계산합니다 (0-100).
 */
export function getMilestoneProgress(milestone: Milestone): number {
  const total = milestone.openIssuesCount + milestone.closedIssuesCount;
  return total > 0 ? Math.round((milestone.closedIssuesCount / total) * 100) : 0;
}

/**
 * 마일스톤의 기한 레이블을 생성합니다.
 * @returns null (기한 없음 또는 완료됨), 또는 { label: string, isOverdue: boolean }
 */
export function getMilestoneDueLabel(
  dueDate?: string,
  status?: string
): { label: string; isOverdue: boolean } | null {
  if (!dueDate) return null;
  if (status === "closed") return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
  if (diffDays === 0) return { label: "오늘", isOverdue: false };
  return { label: `D-${diffDays}`, isOverdue: false };
}

