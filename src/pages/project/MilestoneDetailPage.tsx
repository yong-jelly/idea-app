import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  X,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button, Avatar, Badge, Input, Textarea, Progress, Card, CardContent } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, type Milestone, type MilestoneTask } from "@/entities/project";

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
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    dueDate: "",
  });

  // 마일스톤 데이터 로드
  useEffect(() => {
    const found = dummyMilestones.find((m) => m.id === milestoneId);
    if (found) {
      setMilestone({ ...found });
    }
  }, [milestoneId]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isTaskModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTaskModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isTaskModalOpen]);

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
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate || "",
      });
    } else {
      setEditingTask(null);
      setTaskFormData({ title: "", description: "", dueDate: "" });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskFormData.title.trim()) return;

    if (editingTask) {
      // 수정
      setMilestone((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks?.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskFormData.title,
                description: taskFormData.description || undefined,
                dueDate: taskFormData.dueDate || undefined,
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
        title: taskFormData.title,
        description: taskFormData.description || undefined,
        dueDate: taskFormData.dueDate || undefined,
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              태스크 ({tasks.length})
            </h2>
            <Button onClick={() => handleOpenTaskModal()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              태스크 추가
            </Button>
          </div>

          {/* Task List */}
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
                <p className="text-surface-500 dark:text-surface-400 mb-4">
                  아직 태스크가 없습니다
                </p>
                <Button onClick={() => handleOpenTaskModal()} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  첫 태스크 추가
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Todo Tasks */}
              {todoTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    할 일 ({todoTasks.length})
                  </h3>
                  {todoTasks.map((task) => {
                    const taskDueLabel = getDueLabel(task.dueDate);
                    return (
                      <Card
                        key={task.id}
                        className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-surface-300 hover:border-primary-400 dark:border-surface-600 transition-colors"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-surface-900 dark:text-surface-50">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenTaskModal(task)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="h-7 w-7 p-0 text-surface-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {task.dueDate && (
                                <div
                                  className={cn(
                                    "flex items-center gap-1 mt-2 text-xs",
                                    taskDueLabel?.isOverdue
                                      ? "text-rose-500"
                                      : "text-surface-400"
                                  )}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                  {taskDueLabel && (
                                    <span className={taskDueLabel.isOverdue ? "text-rose-500" : ""}>
                                      ({taskDueLabel.label})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Done Tasks */}
              {doneTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    완료됨 ({doneTasks.length})
                  </h3>
                  {doneTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group opacity-60"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-surface-500 line-through">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-surface-400 mt-1 line-through">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenTaskModal(task)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="h-7 w-7 p-0 text-surface-400 hover:text-rose-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {task.completedAt && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-surface-400">
                                <CheckCircle2 className="h-3 w-3" />
                                {formatRelativeTime(task.completedAt)}에 완료
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Add/Edit Modal */}
      {isTaskModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50">
            {/* 배경 오버레이 */}
            <div
              className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
              onClick={() => setIsTaskModalOpen(false)}
            />

            {/* 모달 컨테이너 */}
            <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
              <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
                {/* 헤더 */}
                <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsTaskModalOpen(false)}
                      className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                    </button>
                    <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                      {editingTask ? "태스크 편집" : "새 태스크"}
                    </h1>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveTask}
                    disabled={!taskFormData.title.trim()}
                    className="rounded-full"
                  >
                    {editingTask ? "저장" : "추가"}
                  </Button>
                </header>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 md:p-6 space-y-6">
                    {/* 제목 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        제목 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={taskFormData.title}
                        onChange={(e) =>
                          setTaskFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="예: API 엔드포인트 구현"
                        maxLength={100}
                      />
                      <p className="text-xs text-surface-500 text-right">
                        {taskFormData.title.length}/100
                      </p>
                    </div>

                    {/* 설명 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        설명
                      </label>
                      <Textarea
                        value={taskFormData.description}
                        onChange={(e) =>
                          setTaskFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="태스크에 대한 상세 설명을 입력하세요"
                        maxLength={500}
                        rows={4}
                      />
                      <p className="text-xs text-surface-500 text-right">
                        {taskFormData.description.length}/500
                      </p>
                    </div>

                    {/* 기한 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        기한
                      </label>
                      <Input
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={(e) =>
                          setTaskFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                        }
                      />
                      <p className="text-xs text-surface-400">
                        태스크를 완료해야 하는 날짜를 선택하세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

