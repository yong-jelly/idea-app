import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, type Milestone, type MilestoneTask } from "@/entities/project";
import { TaskModal } from "./milestone/components/TaskModal";
import { TaskList } from "./milestone/components/TaskList";
import { formatRelativeTime } from "@/shared/lib/utils";

// 더미 마일스톤 데이터 (실제로는 store에서 가져와야 함)
const dummyMilestones: Milestone[] = [
  {
    id: "m1",
    projectId: "1",
    title: "v1.0 - MVP 출시",
    description: "핵심 기능을 포함한 최소 기능 제품 출시. 사용자 인증, 기본 CRUD, UI 디자인 완성.",
    dueDate: "2024-10-01",
    status: "closed",
    openIssuesCount: 0,
    closedIssuesCount: 5,
    tasks: [
      { id: "t1-1", milestoneId: "m1", title: "사용자 인증 시스템 구현", description: "JWT 기반 인증 및 소셜 로그인 구현", dueDate: "2024-08-15", status: "done", createdAt: "2024-08-01T00:00:00Z", completedAt: "2024-08-15T00:00:00Z" },
      { id: "t1-2", milestoneId: "m1", title: "기본 CRUD API 개발", description: "REST API 엔드포인트 구현", dueDate: "2024-08-20", status: "done", createdAt: "2024-08-01T00:00:00Z", completedAt: "2024-08-20T00:00:00Z" },
      { id: "t1-3", milestoneId: "m1", title: "메인 UI 디자인", description: "Figma 디자인 시스템 기반 UI 구현", dueDate: "2024-09-01", status: "done", createdAt: "2024-08-05T00:00:00Z", completedAt: "2024-09-01T00:00:00Z" },
      { id: "t1-4", milestoneId: "m1", title: "반응형 레이아웃 적용", description: "모바일, 태블릿, 데스크톱 대응", dueDate: "2024-09-10", status: "done", createdAt: "2024-08-10T00:00:00Z", completedAt: "2024-09-10T00:00:00Z" },
      { id: "t1-5", milestoneId: "m1", title: "배포 환경 설정", description: "CI/CD 파이프라인 및 프로덕션 서버 설정", dueDate: "2024-09-28", status: "done", createdAt: "2024-09-15T00:00:00Z", completedAt: "2024-09-28T00:00:00Z" },
    ],
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-09-28T00:00:00Z",
    closedAt: "2024-09-28T00:00:00Z",
  },
  {
    id: "m2",
    projectId: "1",
    title: "v1.5 - 베타 테스트",
    description: "1000명의 베타 테스터와 함께 제품 검증. 피드백 시스템 구축 및 버그 수정.",
    dueDate: "2024-12-15",
    status: "open",
    openIssuesCount: 3,
    closedIssuesCount: 4,
    tasks: [
      { id: "t2-1", milestoneId: "m2", title: "베타 테스터 모집 페이지", description: "랜딩 페이지 및 신청 폼 구현", dueDate: "2024-09-15", status: "done", createdAt: "2024-09-01T00:00:00Z", completedAt: "2024-09-15T00:00:00Z" },
      { id: "t2-2", milestoneId: "m2", title: "피드백 수집 시스템 구축", description: "인앱 피드백 위젯 및 관리 대시보드", dueDate: "2024-10-01", status: "done", createdAt: "2024-09-10T00:00:00Z", completedAt: "2024-10-01T00:00:00Z" },
      { id: "t2-3", milestoneId: "m2", title: "버그 리포트 기능", description: "스크린샷, 콘솔 로그 자동 첨부 기능", dueDate: "2024-10-15", status: "done", createdAt: "2024-09-20T00:00:00Z", completedAt: "2024-10-15T00:00:00Z" },
      { id: "t2-4", milestoneId: "m2", title: "성능 모니터링 대시보드", description: "실시간 메트릭 및 알림 시스템", dueDate: "2024-11-01", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-11-01T00:00:00Z" },
      { id: "t2-5", milestoneId: "m2", title: "주요 버그 수정 (5건)", description: "크리티컬 버그 우선 해결", dueDate: "2024-11-30", status: "todo", createdAt: "2024-11-01T00:00:00Z" },
      { id: "t2-6", milestoneId: "m2", title: "사용자 피드백 반영", description: "UX 개선 및 기능 요청 반영", dueDate: "2024-12-10", status: "todo", createdAt: "2024-11-15T00:00:00Z" },
      { id: "t2-7", milestoneId: "m2", title: "베타 종료 보고서 작성", description: "테스트 결과 및 인사이트 정리", dueDate: "2024-12-15", status: "todo", createdAt: "2024-12-01T00:00:00Z" },
    ],
    createdAt: "2024-09-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "m3",
    projectId: "1",
    title: "v2.0 - 정식 출시",
    description: "모든 기능이 완성된 정식 버전 출시. AI 기능 추가, 성능 최적화, 다국어 지원.",
    dueDate: "2025-03-01",
    status: "open",
    openIssuesCount: 5,
    closedIssuesCount: 1,
    tasks: [
      { id: "t3-1", milestoneId: "m3", title: "AI 추천 시스템 설계", description: "추천 알고리즘 설계 및 데이터 파이프라인 구축", dueDate: "2024-11-01", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-11-01T00:00:00Z" },
      { id: "t3-2", milestoneId: "m3", title: "AI 모델 학습 및 배포", description: "ML 모델 학습, 평가, 서빙 인프라 구축", dueDate: "2024-12-15", status: "todo", createdAt: "2024-11-01T00:00:00Z" },
      { id: "t3-3", milestoneId: "m3", title: "다국어 지원 (영어, 일본어)", description: "i18n 설정 및 번역 작업", dueDate: "2025-01-15", status: "todo", createdAt: "2024-11-15T00:00:00Z" },
      { id: "t3-4", milestoneId: "m3", title: "성능 최적화 (로딩 50% 감소)", description: "번들 사이즈 최적화, 코드 스플리팅, 캐싱 전략", dueDate: "2025-02-01", status: "todo", createdAt: "2024-12-01T00:00:00Z" },
      { id: "t3-5", milestoneId: "m3", title: "마케팅 랜딩 페이지", description: "Product Hunt 런칭용 랜딩 페이지", dueDate: "2025-02-15", status: "todo", createdAt: "2024-12-15T00:00:00Z" },
      { id: "t3-6", milestoneId: "m3", title: "프로덕션 배포 및 모니터링", description: "최종 배포 및 24시간 모니터링", dueDate: "2025-03-01", status: "todo", createdAt: "2025-01-01T00:00:00Z" },
    ],
    createdAt: "2024-10-01T00:00:00Z",
    updatedAt: "2024-11-15T00:00:00Z",
  },
  {
    id: "m4",
    projectId: "1",
    title: "v0.9 - 프로토타입",
    description: "초기 프로토타입 버전. 컨셉 검증 및 초기 사용자 피드백 수집.",
    dueDate: "2024-07-15",
    status: "closed",
    openIssuesCount: 0,
    closedIssuesCount: 3,
    tasks: [
      { id: "t4-1", milestoneId: "m4", title: "와이어프레임 제작", description: "주요 화면 와이어프레임 디자인", dueDate: "2024-06-15", status: "done", createdAt: "2024-06-01T00:00:00Z", completedAt: "2024-06-15T00:00:00Z" },
      { id: "t4-2", milestoneId: "m4", title: "프로토타입 개발", description: "핵심 플로우 인터랙티브 프로토타입", dueDate: "2024-07-01", status: "done", createdAt: "2024-06-15T00:00:00Z", completedAt: "2024-07-01T00:00:00Z" },
      { id: "t4-3", milestoneId: "m4", title: "초기 사용자 인터뷰 (10명)", description: "타겟 사용자 인터뷰 및 피드백 수집", dueDate: "2024-07-10", status: "done", createdAt: "2024-07-01T00:00:00Z", completedAt: "2024-07-10T00:00:00Z" },
    ],
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-07-10T00:00:00Z",
    closedAt: "2024-07-10T00:00:00Z",
  },
];

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
}

export function MilestoneDetailPage() {
  const { id, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();

  // 마일스톤 상태 관리
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MilestoneTask | null>(null);

  // 마일스톤 데이터 로드
  useEffect(() => {
    const found = dummyMilestones.find((m) => m.id === milestoneId);
    if (found) {
      setMilestone({ ...found });
    }
  }, [milestoneId]);


  const project = projects[0]; // 임시로 첫 번째 프로젝트 사용
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  if (!milestone) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">마일스톤을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const tasks = milestone.tasks || [];
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const getDueLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
    if (diffDays === 0) return { label: "오늘", isOverdue: false };
    return { label: `D-${diffDays}`, isOverdue: false };
  };

  const handleOpenTaskModal = (task?: MilestoneTask) => {
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (formData: { title: string; description: string; dueDate: string }) => {
    if (!formData.title.trim()) return;

    if (editingTask) {
      // 수정
      setMilestone((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks?.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: formData.title,
                description: formData.description || undefined,
                dueDate: formData.dueDate || undefined,
              }
            : t
        );
        return { ...prev, tasks: updatedTasks, updatedAt: new Date().toISOString() };
      });
    } else {
      // 새 태스크 추가
      const newTask: MilestoneTask = {
        id: `t${Date.now()}`,
        milestoneId: milestone.id,
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        status: "todo",
        createdAt: new Date().toISOString(),
      };
      setMilestone((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: [...(prev.tasks || []), newTask],
          openIssuesCount: prev.openIssuesCount + 1,
          updatedAt: new Date().toISOString(),
        };
      });
    }
    setIsTaskModalOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
    setMilestone((prev) => {
      if (!prev) return prev;

      const updatedTasks = prev.tasks?.map((t) => {
        if (t.id !== taskId) return t;
        const newStatus = t.status === "todo" ? "done" : "todo";
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
        };
      }) as MilestoneTask[];

      const openCount = updatedTasks?.filter((t) => t.status === "todo").length || 0;
      const closedCount = updatedTasks?.filter((t) => t.status === "done").length || 0;

      return {
        ...prev,
        tasks: updatedTasks,
        openIssuesCount: openCount,
        closedIssuesCount: closedCount,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm("이 태스크를 삭제하시겠습니까?")) return;

    setMilestone((prev) => {
      if (!prev) return prev;

      const taskToDelete = prev.tasks?.find((t) => t.id === taskId);
      const updatedTasks = prev.tasks?.filter((t) => t.id !== taskId);

      return {
        ...prev,
        tasks: updatedTasks,
        openIssuesCount: taskToDelete?.status === "todo" ? prev.openIssuesCount - 1 : prev.openIssuesCount,
        closedIssuesCount: taskToDelete?.status === "done" ? prev.closedIssuesCount - 1 : prev.closedIssuesCount,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/project/${id}/community/milestones`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            마일스톤 목록으로 돌아가기
          </Link>

          <div className="flex items-start gap-4">
            {/* Progress Circle */}
            <div
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-3 rounded-xl",
                milestone.status === "closed"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-surface-100 text-surface-500 dark:bg-surface-800"
              )}
            >
              {milestone.status === "closed" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <span className="text-lg font-bold">{progress}%</span>
              )}
              <span className="text-[10px] mt-0.5">
                {milestone.status === "closed" ? "완료" : "진행률"}
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1
                  className={cn(
                    "text-xl font-bold text-surface-900 dark:text-surface-50",
                    milestone.status === "closed" && "line-through opacity-60"
                  )}
                >
                  {milestone.title}
                </h1>
                {milestone.status === "closed" && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    완료됨
                  </Badge>
                )}
              </div>
              {milestone.description && (
                <p className="text-surface-600 dark:text-surface-400 mb-3">
                  {milestone.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {doneTasks.length}개 완료
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-surface-400" />
                  {todoTasks.length}개 남음
                </span>
                {milestone.dueDate && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      getDueLabel(milestone.dueDate)?.isOverdue && milestone.status === "open"
                        ? "text-rose-500"
                        : ""
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    {new Date(milestone.dueDate).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {milestone.status === "open" && getDueLabel(milestone.dueDate) && (
                      <span
                        className={
                          getDueLabel(milestone.dueDate)?.isOverdue
                            ? "text-rose-500"
                            : "text-surface-400"
                        }
                      >
                        ({getDueLabel(milestone.dueDate)?.label})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full max-w-sm">
                <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      milestone.status === "closed" ? "bg-emerald-500" : "bg-primary-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <TaskList
          tasks={tasks}
          todoTasks={todoTasks}
          doneTasks={doneTasks}
          onAddTask={() => handleOpenTaskModal()}
          onToggleTask={handleToggleTask}
          onEditTask={handleOpenTaskModal}
          onDeleteTask={handleDeleteTask}
          getDueLabel={getDueLabel}
        />
      </div>

      {/* Task Add/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={editingTask}
        onSubmit={handleSaveTask}
      />
    </div>
  );
}

