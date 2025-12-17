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
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  MessageSquareText,
  ChevronLeft,
  ThumbsUp,
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Badge, Textarea, Card, CardContent, Input } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl, uploadPostImages } from "@/shared/lib/storage";
import type { UserFeedback } from "../types";
import { FEEDBACK_TYPE_INFO, FEEDBACK_STATUS_INFO } from "../constants";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 피드백 목록
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [feedbackOffset, setFeedbackOffset] = useState(0);
  const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(false);
  
  // 필터 및 모달 상태
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "improvement">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<UserFeedback | null>(null);
  const [formData, setFormData] = useState({
    type: "feature" as "bug" | "feature" | "improvement" | "question",
    title: "",
    content: "",
    images: [] as File[], // File 객체
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // 피드백 목록 로드 (페이징 지원)
  const loadFeedbacks = async (offset: number = 0, append: boolean = false) => {
    if (!projectId) return;

    if (!append) {
      setIsLoadingFeedbacks(true);
    }

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
  };

  // 프로젝트 ID와 필터가 변경되면 피드백 로드
  useEffect(() => {
    if (projectId) {
      setFeedbackOffset(0);
      loadFeedbacks(0, false);
    }
  }, [projectId, filter]);

  // 필터링된 피드백 목록
  const filteredFeedbacks = filter === "all" 
    ? feedbacks 
    : feedbacks.filter((fb) => fb.type === filter);

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
      setFormData({
        type: feedback.type,
        title: feedback.title,
        content: feedback.content,
        images: [], // 기존 이미지는 URL이므로 File로 변환하지 않음
      });
    } else {
      setEditingFeedback(null);
      setFormData({ type: "feature", title: "", content: "", images: [] });
    }
    setIsModalOpen(true);
  };

  /**
   * 이미지 업로드 핸들러
   * 최대 3개까지 업로드 가능
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 3 - formData.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...filesToProcess].slice(0, 3),
    }));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * 이미지 제거 핸들러
   */
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /**
   * 피드백 저장 핸들러
   * 새 피드백 추가 또는 기존 피드백 수정
   */
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    if (!projectId || !user) return;

    setIsSubmitting(true);
    setIsUploadingImages(formData.images.length > 0);

    try {
      // 이미지 업로드
      let imagePaths: string[] = [];
      if (formData.images.length > 0) {
        // Supabase Auth에서 현재 사용자의 auth_id 가져오기
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          alert("로그인이 필요합니다.");
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }

        // 임시 포스트 ID 생성 (실제 피드백 생성 후 업데이트)
        const tempPostId = `temp-${Date.now()}`;
        const { paths, error: uploadError } = await uploadPostImages(
          formData.images,
          authUser.id,
          tempPostId
        );

        if (uploadError) {
          alert(`이미지 업로드 실패: ${uploadError.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }

        imagePaths = paths;
      }

      if (editingFeedback) {
        // 피드백 수정
        const { error } = await supabase
          .schema("odd")
          .rpc("v1_update_feedback", {
            p_post_id: editingFeedback.id,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: imagePaths.length > 0 ? imagePaths : null,
            p_feedback_type: formData.type,
          });

        if (error) {
          console.error("피드백 수정 실패:", error);
          alert(`피드백 수정 실패: ${error.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      } else {
        // 새 피드백 생성
        const { error } = await supabase
          .schema("odd")
          .rpc("v1_create_feedback", {
            p_project_id: projectId,
            p_feedback_type: formData.type,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: imagePaths.length > 0 ? imagePaths : [],
          });

        if (error) {
          console.error("피드백 생성 실패:", error);
          alert(`피드백 생성 실패: ${error.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      }

      // 피드백 목록 새로고침
      setIsModalOpen(false);
      setFeedbackOffset(0);
      await loadFeedbacks(0, false);
    } catch (err) {
      console.error("피드백 저장 에러:", err);
      alert("피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  /**
   * 피드백 삭제 핸들러
   */
  const handleDelete = async (feedbackId: string) => {
    if (!confirm("정말 이 피드백을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // Soft delete
      const { error } = await supabase
        .schema("odd")
        .from("tbl_posts")
        .update({ is_deleted: true })
        .eq("id", feedbackId);

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

  if (isLoadingFeedbacks) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 및 액션 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["all", "feature", "bug", "improvement"] as const).map((f) => (
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
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          피드백 작성
        </Button>
      </div>

      {/* 피드백 목록 */}
      {filteredFeedbacks.length === 0 ? (
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
                                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
                                >
                                  <Edit className="h-3.5 w-3.5 text-surface-500" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(feedback.id);
                                  }}
                                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
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
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />

          {/* 모달 컨테이너 */}
          <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
            <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
              
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
                    {editingFeedback ? "피드백 수정" : "피드백 작성"}
                  </h1>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={
                    isSubmitting ||
                    isUploadingImages ||
                    !formData.title.trim() || 
                    !formData.content.trim()
                  }
                  className="rounded-full"
                >
                  {isUploadingImages ? "이미지 업로드 중..." : isSubmitting ? "저장 중..." : editingFeedback ? "저장" : "작성"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 피드백 타입 선택 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      타입 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["feature", "bug", "improvement"] as const).map((type) => {
                        const info = FEEDBACK_TYPE_INFO[type];
                        const Icon = info.icon;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type }))}
                            disabled={isSubmitting || isUploadingImages}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                              formData.type === type
                                ? cn(info.color, info.color.includes("rose") ? "border-rose-300 dark:border-rose-700" : info.color.includes("amber") ? "border-amber-300 dark:border-amber-700" : "border-primary-300 dark:border-primary-700")
                                : "border-transparent bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {info.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 제목 입력 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="피드백 제목을 입력하세요"
                      maxLength={100}
                      disabled={isSubmitting || isUploadingImages}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>

                  {/* 내용 입력 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      내용 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="피드백 내용을 자세히 작성해주세요. 버그의 경우 재현 방법, 기능 요청의 경우 사용 시나리오를 포함해주세요."
                      maxLength={2000}
                      rows={6}
                      disabled={isSubmitting || isUploadingImages}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.content.length}/2000
                    </p>
                  </div>

                  {/* 이미지 업로드 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      이미지 (최대 3개)
                    </label>
                    
                    {/* 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.images.map((file, index) => {
                          const imageUrl = URL.createObjectURL(file);
                          return (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={`첨부 이미지 ${index + 1}`}
                                className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  URL.revokeObjectURL(imageUrl);
                                  removeImage(index);
                                }}
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                                disabled={isSubmitting || isUploadingImages}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* 이미지 업로드 버튼 */}
                    {formData.images.length < 3 && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isSubmitting || isUploadingImages}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg text-surface-500 hover:border-primary-300 hover:text-primary-500 dark:hover:border-primary-700 transition-colors"
                          disabled={isSubmitting || isUploadingImages}
                        >
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm">이미지 추가 ({formData.images.length}/3)</span>
                        </button>
                      </>
                    )}
                    <p className="text-xs text-surface-400">
                      스크린샷이나 관련 이미지를 첨부하면 더 명확하게 전달할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 푸터 - 삭제 버튼 (수정 모드에서만) */}
              {editingFeedback && (
                <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDelete(editingFeedback.id);
                      setIsModalOpen(false);
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    disabled={isSubmitting || isUploadingImages}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    피드백 삭제
                  </Button>
                </footer>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
