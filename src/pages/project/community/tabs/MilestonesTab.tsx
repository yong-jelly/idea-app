import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  Target,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button, Badge, Textarea, Card, CardContent, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { Milestone } from "@/entities/project";
import {
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  toggleMilestoneStatus,
} from "@/entities/project/api/project.api";

interface MilestonesTabProps {
  projectId: string;
}

export function MilestonesTab({ projectId }: MilestonesTabProps) {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  // 마일스톤 목록 로드
  useEffect(() => {
    const loadMilestones = async () => {
      if (!projectId) return;

      setIsLoading(true);
      const { milestones: data, error } = await fetchMilestones(projectId, {
        status: filter === "all" ? "all" : filter,
      });

      if (error) {
        console.error("마일스톤 목록 조회 실패:", error);
        setIsLoading(false);
        return;
      }

      setMilestones(data || []);
      setIsLoading(false);
    };

    loadMilestones();
  }, [projectId, filter]);

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.status === "open" && b.status === "closed") return -1;
    if (a.status === "closed" && b.status === "open") return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredMilestones = filter === "all" 
    ? sortedMilestones 
    : sortedMilestones.filter((m) => m.status === filter);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleOpenModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate || "",
      });
    } else {
      setEditingMilestone(null);
      setFormData({ title: "", description: "", dueDate: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || isSaving) return;

    setIsSaving(true);

    try {
      if (editingMilestone) {
        // 마일스톤 수정
        const { error } = await updateMilestone(editingMilestone.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error) {
          console.error("마일스톤 수정 실패:", error);
          alert(error.message || "마일스톤 수정에 실패했습니다");
          setIsSaving(false);
          return;
        }
      } else {
        // 마일스톤 생성
        const { milestoneId, error } = await createMilestone(projectId, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        });

        if (error || !milestoneId) {
          console.error("마일스톤 생성 실패:", error);
          alert(error?.message || "마일스톤 생성에 실패했습니다");
          setIsSaving(false);
          return;
        }
      }

      // 목록 새로고침
      const { milestones: data, error: fetchError } = await fetchMilestones(projectId, {
        status: filter === "all" ? "all" : filter,
      });

      if (!fetchError && data) {
        setMilestones(data);
      }

      setIsModalOpen(false);
      setFormData({ title: "", description: "", dueDate: "" });
    } catch (err) {
      console.error("마일스톤 저장 에러:", err);
      alert("마일스톤 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const { error } = await toggleMilestoneStatus(id);

      if (error) {
        console.error("마일스톤 상태 변경 실패:", error);
        alert(error.message || "마일스톤 상태 변경에 실패했습니다");
        return;
      }

      // 목록 새로고침
      const { milestones: data, error: fetchError } = await fetchMilestones(projectId, {
        status: filter === "all" ? "all" : filter,
      });

      if (!fetchError && data) {
        setMilestones(data);
      }
    } catch (err) {
      console.error("마일스톤 상태 변경 에러:", err);
      alert("마일스톤 상태 변경 중 오류가 발생했습니다");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 목표를 삭제하시겠습니까?")) return;

    try {
      const { error } = await deleteMilestone(id);

      if (error) {
        console.error("마일스톤 삭제 실패:", error);
        alert(error.message || "마일스톤 삭제에 실패했습니다");
        return;
      }

      // 목록 새로고침
      const { milestones: data, error: fetchError } = await fetchMilestones(projectId, {
        status: filter === "all" ? "all" : filter,
      });

      if (!fetchError && data) {
        setMilestones(data);
      }
    } catch (err) {
      console.error("마일스톤 삭제 에러:", err);
      alert("마일스톤 삭제 중 오류가 발생했습니다");
    }
  };

  const getProgress = (m: Milestone) => {
    const total = m.openIssuesCount + m.closedIssuesCount;
    return total > 0 ? Math.round((m.closedIssuesCount / total) * 100) : 0;
  };

  const getDueLabel = (dueDate?: string, status?: string) => {
    if (!dueDate) return null;
    if (status === "closed") return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
    if (diffDays === 0) return { label: "오늘", isOverdue: false };
    return { label: `D-${diffDays}`, isOverdue: false };
  };

  return (
    <div>
      {/* Header - 다른 탭들과 동일한 스타일 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { id: "all" as const, label: "전체" },
            { id: "open" as const, label: "진행 중" },
            { id: "closed" as const, label: "완료" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          새 목표
        </Button>
      </div>

      {/* Milestones List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-surface-500 dark:text-surface-400">마일스톤을 불러오는 중...</p>
          </CardContent>
        </Card>
      ) : filteredMilestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 목표가 없습니다" : filter === "open" ? "진행 중인 목표가 없습니다" : "완료된 목표가 없습니다"}
            </p>
            {(filter === "all" || filter === "open") && (
              <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                첫 목표 추가
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMilestones.map((milestone) => {
            const progress = getProgress(milestone);
            const dueLabel = getDueLabel(milestone.dueDate, milestone.status);

            return (
              <Card 
                key={milestone.id}
                className="transition-colors"
              >
                <CardContent className="p-0">
                  {/* Header - 클릭하면 상세 페이지로 이동 */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                    onClick={() => navigate(`/project/${projectId}/community/milestones/${milestone.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Progress Circle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(milestone.id);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors cursor-pointer",
                          milestone.status === "closed"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
                        )}
                      >
                        {milestone.status === "closed" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-bold">{progress}%</span>
                        )}
                        <span className="text-[10px] mt-0.5">
                          {milestone.status === "closed" ? "완료" : "진행률"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold text-surface-900 dark:text-surface-50",
                            milestone.status === "closed" && "line-through opacity-60"
                          )}>
                            {milestone.title}
                          </h3>
                          {milestone.status === "closed" && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">
                              완료됨
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-surface-400" />
                        </div>
                        
                        {milestone.description && (
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mb-2">
                            {milestone.description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  milestone.status === "closed" 
                                    ? "bg-emerald-500" 
                                    : "bg-primary-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {milestone.closedIssuesCount}개 완료
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-surface-400" />
                            {milestone.openIssuesCount}개 남음
                          </span>
                          {milestone.dueDate && (
                            <span className={cn(
                              "flex items-center gap-1",
                              dueLabel?.isOverdue ? "text-rose-500" : ""
                            )}>
                              <Calendar className="h-3 w-3" />
                              {new Date(milestone.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                              {dueLabel && milestone.status === "open" && (
                                <span className={dueLabel.isOverdue ? "text-rose-500" : "text-surface-400"}>
                                  ({dueLabel.label})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(milestone);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(milestone.id);
                          }}
                          className="h-8 w-8 p-0 text-surface-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={milestone.status === "open" ? "primary" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(milestone.id);
                          }}
                          className="h-8 text-xs ml-1"
                        >
                          {milestone.status === "open" ? "완료" : "재개"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal - ProfileEditModal 패턴 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />

          {/* 모달 컨테이너 */}
          <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
            <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
              
              {/* 헤더 */}
              <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                  </button>
                  <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {editingMilestone ? "목표 편집" : "새 목표"}
                  </h1>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={!formData.title.trim() || isSaving}
                  className="rounded-full"
                >
                  {isSaving ? "처리 중..." : editingMilestone ? "저장" : "추가"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 목표 이름 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      목표 이름 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="예: v2.0 출시, 1000명 사용자 달성"
                      maxLength={50}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/50
                    </p>
                  </div>

                  {/* 기한 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      목표 기한
                    </label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  {/* 설명 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      설명
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="이 목표에 대해 간단히 설명해주세요"
                      maxLength={200}
                      rows={3}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.description.length}/200
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



