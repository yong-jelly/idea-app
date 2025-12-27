/**
 * 피드백 탭 컴포넌트
 * 
 * 사용자 피드백을 작성, 조회, 수정, 삭제할 수 있는 탭입니다.
 * - 버그 리포트, 기능 요청, 개선 제안 등 다양한 타입의 피드백 지원
 * - 이미지 첨부 기능 (최대 3개)
 * - 투표 기능으로 인기 피드백 확인
 * - 필터링 기능 (전체, 기능 요청, 버그, 개선 제안)
 * - 페이징 지원 (30개씩)
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquareText,
  ThumbsUp,
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime, ensureMinDelay } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { UserFeedbackModal } from "@/widgets/modal/feedback.modal";
import type { UserFeedback } from "../types";
import { FEEDBACK_TYPE_INFO, FEEDBACK_STATUS_INFO } from "../constants";
import { FeedbackCardSkeleton } from "../components/FeedbackCardSkeleton";

interface FeedbackTabProps {
  projectId: string;
}

const FEEDBACKS_PER_PAGE = 30;

/**
 * DB 피드백을 UserFeedback로 변환
 */
function convertRowToFeedback(row: any): UserFeedback {
  // 이미지 URL 변환 (Storage 경로를 URL로)
  const imageUrls = row.images && Array.isArray(row.images) && row.images.length > 0
    ? row.images.map((path: string) => {
        // 이미 URL인 경우 그대로 반환
        if (path.startsWith("http://") || path.startsWith("https://")) {
          return path;
        }
        // Storage 경로인 경우 URL로 변환
        return getImageUrl(path);
      })
    : undefined;

  return {
    id: row.post_id || row.id, // post_id를 id로 사용 (라우팅 등에 사용)
    feedbackId: row.feedback_id || row.id, // feedback_id 저장 (투표 등에 사용)
    type: (row.feedback_type || "feature") as "bug" | "feature" | "improvement" | "question",
    title: row.title || "",
    content: row.content,
    images: imageUrls,
    author: {
      id: String(row.author_id),
      username: row.author_username || "",
      displayName: row.author_display_name || "",
      avatar: row.author_avatar_url ? getProfileImageUrl(row.author_avatar_url, "sm") : undefined,
    },
    status: (row.status || "open") as "open" | "in_progress" | "resolved" | "closed",
    votesCount: row.votes_count || 0,
    isVoted: row.is_voted || false,
    commentsCount: row.comments_count || 0,
    createdAt: row.created_at,
  };
}

export function FeedbackTab({ projectId }: FeedbackTabProps) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  // 피드백 목록
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [feedbackOffset, setFeedbackOffset] = useState(0);
  const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(false);
  
  // 필터 및 모달 상태
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "improvement" | "question">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<UserFeedback | null>(null);

  // 피드백 목록 로드 (페이징 지원)
  const loadFeedbacks = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!projectId) return;

    if (!append) {
      setIsLoadingFeedbacks(true);
    }

    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_fetch_feedbacks", {
          p_project_id: projectId,
          p_feedback_type: filter === "all" ? null : filter,
          p_status: null,
          p_limit: FEEDBACKS_PER_PAGE,
          p_offset: offset,
        });

      if (error) {
        console.error("피드백 조회 실패:", error);
        if (!append) {
          setIsLoadingFeedbacks(false);
        }
        return;
      }

      // 최소 로딩 지연 시간 보장 (0.3~0.7초) - 탭 이동 시에만 적용
      // 데이터가 없을 때도 지연을 적용하여 일관된 UX 제공
      if (!append) {
        await ensureMinDelay(startTime, { min: 300, max: 700 });
      }

      if (!data || data.length === 0) {
        if (append) {
          setHasMoreFeedbacks(false);
        } else {
          setFeedbacks([]);
          setHasMoreFeedbacks(false);
        }
        if (!append) {
          setIsLoadingFeedbacks(false);
        }
        return;
      }

      const feedbackList: UserFeedback[] = data.map((row: any) =>
        convertRowToFeedback(row)
      );

      if (append) {
        setFeedbacks((prev) => [...prev, ...feedbackList]);
      } else {
        setFeedbacks(feedbackList);
      }

      setFeedbackOffset(offset + feedbackList.length);
      setHasMoreFeedbacks(feedbackList.length === FEEDBACKS_PER_PAGE);
    } catch (err) {
      console.error("피드백 조회 에러:", err);
    } finally {
      if (!append) {
        setIsLoadingFeedbacks(false);
      }
    }
  }, [projectId, filter]);

  // 프로젝트 ID와 필터가 변경되면 피드백 로드
  useEffect(() => {
    if (projectId) {
      setFeedbackOffset(0);
      loadFeedbacks(0, false);
    }
  }, [projectId, filter, loadFeedbacks]);

  // 필터링된 피드백 목록
  const filteredFeedbacks = filter === "all" 
    ? feedbacks 
    : feedbacks.filter((fb) => fb.type === filter);

  /**
   * 모달 열기 핸들러
   * @param feedback - 수정할 피드백 (없으면 새로 작성)
   */
  const handleOpenModal = (feedback?: UserFeedback) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (feedback) {
      setEditingFeedback(feedback);
    } else {
      setEditingFeedback(null);
    }
    setIsModalOpen(true);
  };

  /**
   * 모달 저장 후 콜백 - 피드백 목록 새로고침
   */
  const handleModalSave = useCallback(async () => {
    setFeedbackOffset(0);
    await loadFeedbacks(0, false);
  }, [loadFeedbacks]);

  /**
   * 피드백 삭제 핸들러
   */
  const handleDelete = async (feedbackId: string) => {
    if (!confirm("정말 이 피드백을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // RPC 함수를 사용하여 소프트 삭제 (RLS 정책 우회)
      const { error } = await supabase
        .schema("odd")
        .rpc("v1_delete_community_post", {
          p_post_id: feedbackId,
        });

      if (error) {
        console.error("피드백 삭제 실패:", error);
        alert(`피드백 삭제 실패: ${error.message}`);
        return;
      }

      // 피드백 목록에서 제거
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== feedbackId));
      
      if (editingFeedback && editingFeedback.id === feedbackId) {
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("피드백 삭제 에러:", err);
      alert("피드백 삭제 중 오류가 발생했습니다.");
    }
  };

  /**
   * 피드백 투표 핸들러
   */
  const handleVote = async (feedbackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // feedback_id는 tbl_feedbacks의 id를 사용해야 함
      const feedback = feedbacks.find((fb) => fb.id === feedbackId);
      if (!feedback) return;

      // feedbackId가 없으면 post_id를 사용 (하위 호환성)
      const actualFeedbackId = feedback.feedbackId || feedbackId;

      const { error } = await supabase
        .schema("odd")
        .rpc("v1_toggle_feedback_vote", {
          p_feedback_id: actualFeedbackId,
        });

      if (error) {
        console.error("피드백 투표 실패:", error);
        alert(`피드백 투표 실패: ${error.message}`);
        return;
      }

      // 피드백 목록 새로고침
      setFeedbackOffset(0);
      await loadFeedbacks(0, false);
    } catch (err) {
      console.error("피드백 투표 에러:", err);
      alert("피드백 투표 중 오류가 발생했습니다.");
    }
  };

  /**
   * 더 보기 핸들러
   */
  const handleLoadMore = async () => {
    if (!hasMoreFeedbacks || isLoadingFeedbacks) return;
    await loadFeedbacks(feedbackOffset, true);
  };

  return (
    <div>
      {/* 필터 및 액션 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["all", "feature", "bug", "improvement", "question"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              )}
            >
              {f === "all" ? "전체" : FEEDBACK_TYPE_INFO[f].label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => handleOpenModal()} className="lg:px-3 px-2">
          <Plus className="h-4 w-4 lg:mr-1" />
          <span className="hidden lg:inline">피드백 작성</span>
        </Button>
      </div>

      {/* 피드백 목록 */}
      {isLoadingFeedbacks ? (
        // 탭 변경 시 로딩 중: 스켈레톤 UI 표시
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <FeedbackCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareText className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 피드백이 없습니다" : `${FEEDBACK_TYPE_INFO[filter].label} 피드백이 없습니다`}
            </p>
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              첫 피드백 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {filteredFeedbacks.map((feedback) => {
              const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
              const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];
              const TypeIcon = typeInfo.icon;
              const isOwner = feedback.author.id === user?.id;

              return (
                <Card 
                  key={feedback.id} 
                  className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/project/${projectId}/community/feedback/${feedback.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 투표 버튼 */}
                      <button
                        onClick={(e) => handleVote(feedback.id, e)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors",
                          feedback.isVoted
                            ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                            : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
                        )}
                      >
                        <ThumbsUp className={cn("h-4 w-4", feedback.isVoted && "fill-current")} />
                        <span className="text-sm font-semibold mt-0.5">{formatNumber(feedback.votesCount)}</span>
                      </button>

                      {/* 피드백 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", typeInfo.color)}>
                            <TypeIcon className="h-3 w-3" />
                            {typeInfo.label}
                          </span>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          {feedback.images && feedback.images.length > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-surface-400">
                              <ImageIcon className="h-3 w-3" />
                              {feedback.images.length}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            {/* 소유자만 수정/삭제 버튼 표시 */}
                            {isOwner && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(feedback);
                                  }}
                                  className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                  title="수정"
                                >
                                  <Edit className="h-3.5 w-3.5 text-surface-500" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(feedback.id);
                                  }}
                                  className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                </button>
                              </>
                            )}
                            <ChevronRight className="h-4 w-4 text-surface-400" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {feedback.title}
                        </h3>
                        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                          {feedback.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-surface-500">
                          <span>@{feedback.author.username}</span>
                          <span>{formatRelativeTime(feedback.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {feedback.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* 더 보기 버튼 */}
          {hasMoreFeedbacks && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingFeedbacks}
              >
                {isLoadingFeedbacks ? "로딩 중..." : "더 보기"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 피드백 작성/수정 모달 */}
      <UserFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingFeedback={editingFeedback}
        projectId={projectId}
        onSave={handleModalSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
