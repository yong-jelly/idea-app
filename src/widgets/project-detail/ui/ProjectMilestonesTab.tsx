import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckSquare, ChevronRight, CheckCircle2, Heart } from "lucide-react";
import { Button, EmptyState, Card, CardContent, Avatar } from "@/shared/ui";
import { cn, formatDueDate, formatDateShort } from "@/shared/lib/utils";
import { getProfileImageUrl } from "@/shared/lib/storage";
import { fetchMilestones, fetchTasks, toggleTaskLike, type Milestone, type MilestoneTask } from "@/entities/project";
import { useUserStore } from "@/entities/user";

interface ProjectMilestonesTabProps {
  projectId: string;
}

interface TaskWithMilestone extends MilestoneTask {
  milestoneId: string;
}

const MAX_DISPLAY_COUNT = 15;

export function ProjectMilestonesTab({ projectId }: ProjectMilestonesTabProps) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [tasks, setTasks] = useState<TaskWithMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isAuthenticated = user !== null;

  useEffect(() => {
    const loadAllTasks = async () => {
      if (!projectId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. 모든 마일스톤 가져오기
        const { milestones: milestonesData, error: milestonesError } = await fetchMilestones(projectId, {
          status: "all",
          limit: 100,
        });

        if (milestonesError) {
          setError(milestonesError);
          setIsLoading(false);
          return;
        }

        if (!milestonesData || milestonesData.length === 0) {
          setTasks([]);
          setIsLoading(false);
          return;
        }

        // 2. 각 마일스톤의 모든 Task 가져오기
        const allTasksPromises = milestonesData.map(async (milestone) => {
          const { tasks: milestoneTasks, error: tasksError } = await fetchTasks(milestone.id, {
            status: "all",
            limit: 200,
          });

          if (tasksError) {
            console.error(`마일스톤 ${milestone.id}의 Task 조회 실패:`, tasksError);
            return [];
          }

          // 각 Task에 milestoneId 추가
          return (milestoneTasks || []).map((task) => ({
            ...task,
            milestoneId: milestone.id,
          }));
        });

        const tasksArrays = await Promise.all(allTasksPromises);
        const allTasks = tasksArrays.flat();

        // 3. 만료일 기준으로 정렬 (null인 경우 맨 뒤로)
        const sorted = [...allTasks].sort((a, b) => {
          // 만료일이 없는 경우 맨 뒤로
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;

          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        });

        setTasks(sorted);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("알 수 없는 오류"));
      } finally {
        setIsLoading(false);
      }
    };

    loadAllTasks();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500 dark:text-surface-400">태스크를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500 dark:text-surface-400">
          태스크를 불러오는데 실패했습니다
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-8 w-8" />}
        title="태스크가 없습니다"
        description="프로젝트의 마일스톤에 태스크가 등록되면 여기에 표시됩니다"
        size="md"
      />
    );
  }

  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const displayTasks = tasks.slice(0, MAX_DISPLAY_COUNT);
  const hasMore = tasks.length > MAX_DISPLAY_COUNT;

  const handleTaskClick = (task: TaskWithMilestone) => {
    navigate(`/project/${projectId}/community/milestones/${task.milestoneId}`);
  };

  const handleViewMore = () => {
    navigate(`/project/${projectId}/community/milestones`);
  };

  const handleLikeTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert("로그인이 필요합니다");
      return;
    }

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

      // 서버 응답으로 최종 상태 동기화
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

  return (
    <div className="space-y-3">
      {displayTasks.map((task) => {
        const isCompleted = task.status === "done";
        const dueDateText = task.dueDate
          ? formatDueDate(task.dueDate)
          : null;

        return (
          <Card 
            key={task.id}
            className="transition-colors"
          >
            <CardContent className="p-0">
              <div 
                className="p-3 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start gap-2">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "flex items-center justify-center h-6 w-6 shrink-0 rounded-md transition-colors",
                      isCompleted
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-surface-100 text-surface-500 dark:bg-surface-800"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <CheckSquare className="h-3 w-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={cn(
                          "text-sm text-surface-900 dark:text-surface-50",
                          isCompleted && "line-through opacity-60"
                        )}
                      >
                        {task.title}
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          완료됨
                        </span>
                      )}
                      <ChevronRight className="h-3 w-3 text-surface-400 shrink-0" />
                    </div>
                    
                    {/* 완료된 경우: 완료일만 표기 */}
                    {isCompleted && task.completedAt && (
                      <p className="text-[11px] text-surface-500 dark:text-surface-400">
                        {formatDateShort(task.completedAt)}
                      </p>
                    )}
                    
                    {/* 완료되지 않은 경우: 목표일과 남은 기간 표기 */}
                    {!isCompleted && task.dueDate && dueDateText && (
                      <p className="text-[11px] text-surface-500 dark:text-surface-400">
                        {formatDateShort(task.dueDate)} ({dueDateText})
                      </p>
                    )}
                  </div>

                  {/* 좋아요 섹션 - 오른쪽 끝에 배치 */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* 좋아요한 유저 아바타들 (최대 3명) */}
                    {(() => {
                      const likesCount = task.likesCount ?? 0;
                      const likedUsers = task.likedUsers ?? [];
                      const displayUsers = likedUsers.slice(0, 3);
                      const remainingCount = likedUsers.length > 3 ? likedUsers.length - 3 : 0;
                      const isLiked = task.isLiked ?? false;

                      if (likesCount === 0 && !isAuthenticated) {
                        return null;
                      }

                      return (
                        <div className="flex items-center gap-1.5">
                          {/* 좋아요한 유저 아바타들 */}
                          {displayUsers.length > 0 && (
                            <div className="flex items-center -space-x-1.5">
                              {displayUsers.map((user, index) => (
                                <div
                                  key={user.id}
                                  className="relative"
                                  style={{ zIndex: displayUsers.length - index }}
                                >
                                  <Avatar
                                    src={user.avatar ? getProfileImageUrl(user.avatar, "xs") : undefined}
                                    alt={user.displayName}
                                    fallback={user.displayName}
                                    size="xs"
                                    className="ring-1 ring-white dark:ring-surface-900"
                                  />
                                </div>
                              ))}
                              {remainingCount > 0 && (
                                <div className="relative ml-1">
                                  <div className="h-5 w-5 rounded-full bg-surface-200 dark:bg-surface-700 ring-1 ring-white dark:ring-surface-900 flex items-center justify-center">
                                    <span className="text-[9px] font-medium text-surface-600 dark:text-surface-400">
                                      +{remainingCount}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 좋아요 버튼 */}
                          <button
                            onClick={(e) => handleLikeTask(task.id, e)}
                            disabled={!isAuthenticated}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all",
                              isLiked
                                ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                                : isAuthenticated
                                ? "text-surface-500 hover:text-rose-500 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
                                : "text-surface-400 cursor-not-allowed",
                              !isAuthenticated && "opacity-50"
                            )}
                          >
                            <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                            {likesCount > 0 && (
                              <span className="tabular-nums">{likesCount}</span>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {hasMore && (
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={handleViewMore}
            className="w-full"
          >
            더 보기 ({tasks.length - MAX_DISPLAY_COUNT}개)
          </Button>
        </div>
      )}
    </div>
  );
}

// 마일스톤 탭 제목에 사용할 완료/전체 수 계산 함수
export function getMilestoneTabLabel(
  tasks: Array<MilestoneTask & { milestoneId: string }>
): string {
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  return `테스크 (${completedCount}/${totalCount})`;
}

