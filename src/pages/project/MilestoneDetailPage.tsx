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
import { 
  type Milestone, 
  type MilestoneTask, 
  fetchMilestoneDetail, 
  fetchProjectDetail,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  toggleTaskLike,
  CATEGORY_INFO,
  type Project,
} from "@/entities/project";
import { useUserStore } from "@/entities/user";
import { TaskModal } from "./milestone/components/TaskModal";
import { TaskList } from "./milestone/components/TaskList";
import { MilestoneDetailSkeleton } from "./milestone/components/MilestoneDetailSkeleton";
import { ensureMinDelay } from "@/shared/lib/utils";

export function MilestoneDetailPage() {
  const { id, milestoneId } = useParams<{ id: string; milestoneId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();

  // 마일스톤 상태 관리
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [tasks, setTasks] = useState<MilestoneTask[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MilestoneTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectAuthorId, setProjectAuthorId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);

  // 프로젝트 정보 조회
  useEffect(() => {
    if (!id) return;

    const loadProject = async () => {
      try {
        const result = await fetchProjectDetail(id);
        if (result.error) {
          console.error("프로젝트 조회 실패:", result.error);
          return;
        }
        if (result.overview?.project) {
          setProject(result.overview.project);
          setProjectAuthorId(result.overview.project.author.id);
        }
      } catch (err) {
        console.error("프로젝트 조회 에러:", err);
      }
    };

    loadProject();
  }, [id]);

  // 마일스톤 데이터 로드
  useEffect(() => {
    if (!milestoneId) return;

    let isCancelled = false;

    const loadMilestone = async () => {
      setIsLoading(true);
      setIsLoadingTasks(true);
      setError(null);

      const startTime = Date.now();

      try {
        const { milestone: data, error: fetchError } = await fetchMilestoneDetail(milestoneId);

        if (isCancelled) return;

        if (fetchError) {
          throw new Error(fetchError.message || "마일스톤을 불러오는데 실패했습니다");
        }

        if (!data) {
          throw new Error("마일스톤을 찾을 수 없습니다");
        }

        // 최소 로딩 지연 시간 보장 (0.3~0.7초)
        await ensureMinDelay(startTime, { min: 300, max: 700 });

        if (isCancelled) return;

        setMilestone(data);
        
        // 태스크 목록 로드 (태스크도 로드 완료될 때까지 스켈레톤 표시)
        const taskStartTime = Date.now();
        const { tasks: taskList, error: tasksError } = await fetchTasks(data.id);
        
        if (isCancelled) return;
        
        // 태스크 로딩도 최소 지연 시간 보장
        await ensureMinDelay(taskStartTime, { min: 300, max: 700 });
        
        if (isCancelled) return;
        
        if (tasksError) {
          console.error("태스크 목록 조회 실패:", tasksError);
          setTasks([]);
        } else {
          setTasks(taskList || []);
        }
      } catch (err) {
        if (isCancelled) return;
        const errorMessage = err instanceof Error ? err.message : "마일스톤을 불러오는 중 오류가 발생했습니다";
        setError(errorMessage);
        console.error("마일스톤 조회 에러:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsLoadingTasks(false);
        }
      }
    };

    loadMilestone();

    return () => {
      isCancelled = true;
    };
  }, [milestoneId]);

  // 태스크 목록 로드 함수 (새로고침용)
  const loadTasks = async (msId: string) => {
    setIsLoadingTasks(true);
    try {
      const { tasks: taskList, error: tasksError } = await fetchTasks(msId);
      
      if (tasksError) {
        console.error("태스크 목록 조회 실패:", tasksError);
        setTasks([]);
        return;
      }
      
      setTasks(taskList || []);
    } catch (err) {
      console.error("태스크 목록 조회 에러:", err);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  if (isLoading || isLoadingTasks) {
    return <MilestoneDetailSkeleton />;
  }

  if (error || !milestone) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-surface-500 mb-4">{error || "마일스톤을 찾을 수 없습니다."}</p>
          <Link
            to={`/project/${id}/community/milestones`}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            마일스톤 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  
  // 프로젝트 소유자 여부 확인
  const isProjectOwner = user && projectAuthorId && user.id === projectAuthorId;

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

  const handleSaveTask = async (formData: { title: string; description: string; dueDate: string }) => {
    if (!formData.title.trim() || !milestone) return;

    try {
      if (editingTask) {
        // 수정
        const { error } = await updateTask(editingTask.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error) {
          alert(error.message || "태스크 수정에 실패했습니다");
          return;
        }
      } else {
        // 새 태스크 추가
        const { taskId, error } = await createTask(milestone.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error || !taskId) {
          alert(error?.message || "태스크 생성에 실패했습니다");
          return;
        }
      }

      // 태스크 목록 새로고침
      await loadTasks(milestone.id);
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error("태스크 저장 에러:", err);
      alert("태스크 저장 중 오류가 발생했습니다");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!milestone) return;

    // 현재 태스크 상태 저장 (롤백용)
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const currentStatus = currentTask.status;
    const newStatus = currentStatus === "todo" ? "done" : "todo";
    const newCompletedAt = newStatus === "done" ? new Date().toISOString() : undefined;

    // 낙관적 업데이트: 즉시 UI 업데이트
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          status: newStatus,
          completedAt: newCompletedAt,
        };
      })
    );

    // 마일스톤 카운트도 낙관적으로 업데이트
    if (milestone) {
      const todoCount = newStatus === "done" 
        ? tasks.filter((t) => t.status === "todo" && t.id !== taskId).length
        : tasks.filter((t) => t.status === "todo").length + 1;
      const doneCount = newStatus === "done"
        ? tasks.filter((t) => t.status === "done").length + 1
        : tasks.filter((t) => t.status === "done" && t.id !== taskId).length;
      
      setMilestone((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openIssuesCount: todoCount,
          closedIssuesCount: doneCount,
        };
      });
    }

    try {
      const { error } = await toggleTaskStatus(taskId);

      if (error) {
        // 롤백: 원래 상태로 복원
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              status: currentStatus,
              completedAt: currentTask.completedAt,
            };
          })
        );
        
        // 마일스톤 카운트도 롤백
        if (milestone) {
          const originalTodoCount = tasks.filter((t) => t.status === "todo").length;
          const originalDoneCount = tasks.filter((t) => t.status === "done").length;
          setMilestone((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              openIssuesCount: originalTodoCount,
              closedIssuesCount: originalDoneCount,
            };
          });
        }
        
        alert(error.message || "태스크 상태 변경에 실패했습니다");
        return;
      }

      // 성공 시 서버에서 최신 상태 동기화 (백그라운드)
      // 사용자 경험을 위해 즉시 반영하지 않고, 백그라운드에서 동기화
      loadTasks(milestone.id).then(() => {
        fetchMilestoneDetail(milestone.id).then(({ milestone: updatedMilestone, error: milestoneError }) => {
          if (!milestoneError && updatedMilestone) {
            setMilestone(updatedMilestone);
          }
        });
      });
    } catch (err) {
      console.error("태스크 상태 변경 에러:", err);
      
      // 롤백: 원래 상태로 복원
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            status: currentStatus,
            completedAt: currentTask.completedAt,
          };
        })
      );
      
      // 마일스톤 카운트도 롤백
      if (milestone) {
        const originalTodoCount = tasks.filter((t) => t.status === "todo").length;
        const originalDoneCount = tasks.filter((t) => t.status === "done").length;
        setMilestone((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            openIssuesCount: originalTodoCount,
            closedIssuesCount: originalDoneCount,
          };
        });
      }
      
      alert("태스크 상태 변경 중 오류가 발생했습니다");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!milestone) return;
    if (!confirm("이 태스크를 삭제하시겠습니까?")) return;

    try {
      const { error } = await deleteTask(taskId);

      if (error) {
        alert(error.message || "태스크 삭제에 실패했습니다");
        return;
      }

      // 태스크 목록 새로고침
      await loadTasks(milestone.id);
      
      // 마일스톤 정보도 새로고침 (카운트 업데이트 반영)
      const { milestone: updatedMilestone, error: milestoneError } = await fetchMilestoneDetail(milestone.id);
      if (!milestoneError && updatedMilestone) {
        setMilestone(updatedMilestone);
      }
    } catch (err) {
      console.error("태스크 삭제 에러:", err);
      alert("태스크 삭제 중 오류가 발생했습니다");
    }
  };

  const handleLikeTask = async (taskId: string) => {
    if (!user) {
      alert("로그인이 필요합니다");
      return;
    }

    if (!milestone) return;

    // 현재 태스크 상태 저장 (롤백용)
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const currentIsLiked = currentTask.isLiked ?? false;
    const currentLikesCount = currentTask.likesCount ?? 0;
    const currentLikedUsers = currentTask.likedUsers ?? [];

    // 낙관적 업데이트: 즉시 UI 업데이트
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        
        const newIsLiked = !currentIsLiked;
        const newLikesCount = currentIsLiked 
          ? Math.max(0, currentLikesCount - 1) 
          : currentLikesCount + 1;
        
        // 좋아요한 유저 목록 업데이트
        let newLikedUsers = [...currentLikedUsers];
        if (currentIsLiked) {
          // 좋아요 취소: 현재 사용자 제거
          newLikedUsers = newLikedUsers.filter((u) => u.id !== user.id);
        } else {
          // 좋아요 추가: 현재 사용자 추가 (최대 3명)
          const currentUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          };
          // 이미 3명이면 마지막 제거하고 추가
          if (newLikedUsers.length >= 3) {
            newLikedUsers = [currentUser, ...newLikedUsers.slice(0, 2)];
          } else {
            newLikedUsers = [currentUser, ...newLikedUsers];
          }
        }
        
        return {
          ...task,
          isLiked: newIsLiked,
          likesCount: newLikesCount,
          likedUsers: newLikedUsers,
        };
      })
    );

    try {
      const { isLiked: serverIsLiked, likesCount: serverLikesCount, error } = await toggleTaskLike(taskId);

      if (error) {
        // 롤백: 원래 상태로 복원
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              isLiked: currentIsLiked,
              likesCount: currentLikesCount,
              likedUsers: currentLikedUsers,
            };
          })
        );
        alert(error.message || "좋아요 처리에 실패했습니다");
        return;
      }

      // 서버 응답으로 최종 상태 동기화 (좋아요 수만, 유저 목록은 낙관적 업데이트 유지)
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            isLiked: serverIsLiked,
            likesCount: serverLikesCount,
            // likedUsers는 낙관적 업데이트로 이미 반영됨
          };
        })
      );
    } catch (err) {
      console.error("태스크 좋아요 토글 에러:", err);
      // 롤백: 원래 상태로 복원
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            isLiked: currentIsLiked,
            likesCount: currentLikesCount,
            likedUsers: currentLikedUsers,
          };
        })
      );
      alert("좋아요 처리 중 오류가 발생했습니다");
    }
  };

  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Mobile Header - 모바일에서만 표시 */}
      {project && (
        <div className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
          <div className="h-14 flex items-center gap-3 px-4">
            <button
              onClick={() => navigate(`/project/${id}/community/milestones`)}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              aria-label="마일스톤 목록으로 돌아가기"
            >
              <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>
            
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-lg ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700 overflow-hidden shrink-0">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  categoryInfo?.icon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-surface-900 dark:text-surface-50 truncate">
                  {project.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 md:py-6 pt-4 pb-6">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          <Link
            to={`/project/${id}/community/milestones`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            마일스톤 목록으로 돌아가기
          </Link>

          {project && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 text-3xl ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700 overflow-hidden shrink-0">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  categoryInfo?.icon
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                  {project.title} 커뮤니티
                </h1>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {project.shortDescription || "개발팀과 소통하고 프로젝트 진행 상황을 확인하세요"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 마일스톤 헤더 */}
        <div className="mb-6">
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
          isProjectOwner={isProjectOwner}
          isAuthenticated={user !== null}
          onLikeTask={handleLikeTask}
        />
      </div>

      {/* Task Add/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={editingTask}
        onSubmit={handleSaveTask}
        canEdit={!!isProjectOwner} // 프로젝트 소유자만 수정 가능 (실제 권한 체크는 백엔드에서 수행)
      />
    </div>
  );
}

