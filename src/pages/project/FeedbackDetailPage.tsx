import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  ThumbsUp,
  MessageCircle,
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquareText,
  X,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  Tag,
  Flag,
  MessageSquarePlus,
  History,
  Pin,
  Link2,
  Check,
  Trash2,
} from "lucide-react";
import { Button, Avatar, Badge, Textarea, Card, CardContent, Separator, ImageViewer } from "@/shared/ui";
import { CommentThread } from "@/shared/ui/comment";
import { cn, formatNumber, formatRelativeTime, ensureMinDelay } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { fetchProjectDetail, CATEGORY_INFO, type Project } from "@/entities/project";
import { useDevFeedComments } from "./community/tabs/hooks/useDevFeedComments";
import { LoginModal } from "@/pages/auth";
import { FeedbackDetailSkeleton } from "./feedback/components/FeedbackDetailSkeleton";
import { UserFeedbackModal } from "@/widgets/modal/feedback.modal";

// ========== 타입 정의 ==========

type FeedbackType = "bug" | "feature" | "improvement" | "question";
type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
type FeedbackPriority = "low" | "medium" | "high" | "critical";

interface FeedbackAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

interface FeedbackComment {
  id: string;
  author: FeedbackAuthor;
  content: string;
  images?: string[];
  likesCount: number;
  isLiked: boolean;
  depth: number;
  parentId?: string;
  replies?: FeedbackComment[];
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

interface FeedbackHistory {
  id: string;
  type: "status_change" | "type_change" | "priority_change" | "assignee_change" | "response_added";
  actor: FeedbackAuthor;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

interface Feedback {
  id: string; // post_id
  feedbackId: string; // 실제 feedback_id (투표 등에 사용)
  type: FeedbackType;
  status: FeedbackStatus;
  priority?: FeedbackPriority;
  title: string;
  content: string;
  images?: string[];
  author: FeedbackAuthor;
  assignee?: FeedbackAuthor;
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  comments?: FeedbackComment[];
  developerResponse?: string;
  isPinned?: boolean;
  history?: FeedbackHistory[];
  createdAt: string;
  updatedAt?: string;
}

// ========== 상수 ==========

const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", icon: Bug, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20", borderColor: "border-rose-200 dark:border-rose-800" },
  feature: { label: "기능 요청", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800" },
  improvement: { label: "개선 제안", icon: Sparkles, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20", borderColor: "border-primary-200 dark:border-primary-800" },
  question: { label: "질문", icon: MessageSquareText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
};

const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", icon: AlertCircle, color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", icon: Clock, color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", icon: X, color: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
};

const FEEDBACK_PRIORITY_INFO = {
  low: { label: "낮음", color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  medium: { label: "보통", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "높음", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  critical: { label: "긴급", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

// 댓글 기본 설정: 프로젝트 전역에서 동일한 경험을 주기 위해 상수화
const COMMENT_MAX_DEPTH = 3;
const COMMENT_ENABLE_ATTACHMENTS = true;
const COMMENT_MAX_IMAGES = 1;


// 개발자 답변 작성 모달
interface DevResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  onSubmit: (response: string) => void;
}

function DevResponseModal({ isOpen, onClose, initialValue = "", onSubmit }: DevResponseModalProps) {
  const [response, setResponse] = useState(initialValue);

  useEffect(() => {
    setResponse(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl">
          <header className="h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              개발자 답변 작성
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800">
              <X className="h-5 w-5 text-surface-500" />
            </button>
          </header>
          <div className="p-4 space-y-4">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="사용자에게 전달할 공식 답변을 작성하세요..."
              className="min-h-[120px]"
              autoFocus
            />
            <p className="text-xs text-surface-500">
              공식 답변은 피드백 상단에 강조되어 표시됩니다.
            </p>
          </div>
          <footer className="h-14 flex items-center justify-end gap-2 px-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={() => { onSubmit(response); onClose(); }} disabled={!response.trim()}>
              저장
            </Button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ========== 메인 컴포넌트 ==========

/**
 * DB 피드백 데이터를 Feedback 타입으로 변환
 */
function convertRowToFeedback(row: any): Feedback {
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
    feedbackId: row.feedback_id || row.id, // 실제 feedback_id 저장 (투표 등에 사용)
    type: (row.feedback_type || "feature") as FeedbackType,
    status: (row.status || "open") as FeedbackStatus,
    priority: row.priority as FeedbackPriority | undefined,
    title: row.title || "",
    content: row.content,
    images: imageUrls,
    author: {
      id: String(row.author_id),
      username: row.author_username || "",
      displayName: row.author_display_name || "",
      avatar: row.author_avatar_url ? getProfileImageUrl(row.author_avatar_url, "sm") : undefined,
    },
    assignee: row.assignee_id ? {
      id: String(row.assignee_id),
      username: "", // TODO: assignee 정보 조회 필요
      displayName: "",
    } : undefined,
    votesCount: row.votes_count || 0,
    isVoted: row.is_voted || false,
    commentsCount: row.comments_count || 0,
    developerResponse: row.developer_response || undefined,
    isPinned: row.is_pinned || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export function FeedbackDetailPage() {
  const { id, feedbackId } = useParams<{ id: string; feedbackId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserStore();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [originalFeedback, setOriginalFeedback] = useState<Feedback | null>(null);
  const [showDevResponseModal, setShowDevResponseModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectAuthorId, setProjectAuthorId] = useState<string>("");
  const [project, setProject] = useState<Project | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // 프로젝트 멤버 여부 (프로젝트 작성자와 현재 사용자 비교)
  const isProjectMember = projectAuthorId && user?.id === projectAuthorId;
  
  // 피드백 작성자 여부
  const isFeedbackAuthor = feedback && user?.id === feedback.author.id;
  
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 댓글 시스템 hook 사용
  const {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore: hasMoreComments,
    handleAddComment,
    handleReply,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
  } = useDevFeedComments({
    postId: feedbackId || "",
    projectAuthorId,
    isAuthenticated,
    onSignUpPrompt: () => setShowLoginModal(true),
  });

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

  // 피드백 상세 조회
  useEffect(() => {
    if (!feedbackId) return;

    let isCancelled = false;

    const loadFeedback = async () => {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const { data, error: fetchError } = await supabase
          .schema("odd")
          .rpc("v1_fetch_feedback_detail", {
            p_post_id: feedbackId,
          });

        if (isCancelled) return;

        if (fetchError) {
          throw new Error(fetchError.message || "피드백을 불러오는데 실패했습니다");
        }

        if (!data || data.length === 0) {
          throw new Error("피드백을 찾을 수 없습니다");
        }

        // 최소 로딩 지연 시간 보장 (0.3~0.7초)
        await ensureMinDelay(startTime, { min: 300, max: 700 });

        if (isCancelled) return;

        const feedbackData = convertRowToFeedback(data[0]);
        setFeedback(feedbackData);
        setOriginalFeedback(feedbackData);
      } catch (err) {
        if (isCancelled) return;
        console.error("피드백 조회 에러:", err);
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFeedback();

    return () => {
      isCancelled = true;
    };
  }, [feedbackId]);

  // 변경사항 있는지 확인
  const hasChanges = feedback && originalFeedback && (
    feedback.status !== originalFeedback.status ||
    feedback.type !== originalFeedback.type ||
    feedback.priority !== originalFeedback.priority ||
    feedback.assignee?.id !== originalFeedback.assignee?.id
  );

  // 저장 핸들러
  const handleSaveChanges = async () => {
    if (!feedback || !hasChanges || !feedbackId) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .schema("odd")
        .rpc("v1_update_feedback", {
          p_post_id: feedbackId,
          p_status: feedback.status,
          p_feedback_type: feedback.type,
          p_priority: feedback.priority || null,
          p_assignee_id: feedback.assignee?.id ? Number(feedback.assignee.id) : null,
          p_developer_response: feedback.developerResponse || null,
        });

      if (error) {
        throw new Error(error.message || "피드백 수정에 실패했습니다");
      }

      setOriginalFeedback({ ...feedback });
      alert("변경사항이 저장되었습니다.");
    } catch (err) {
      console.error("피드백 수정 에러:", err);
      alert(err instanceof Error ? err.message : "피드백 수정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  // 변경사항 취소
  const handleCancelChanges = () => {
    if (originalFeedback) {
      setFeedback({ ...originalFeedback });
    }
  };

  /**
   * 모달 저장 후 콜백 - 피드백 데이터 새로고침
   */
  const handleModalSave = useCallback(async () => {
    if (!feedbackId) return;

    try {
      // 피드백 데이터 새로고침
      const { data, error: fetchError } = await supabase
        .schema("odd")
        .rpc("v1_fetch_feedback_detail", {
          p_post_id: feedbackId,
        });

      if (fetchError) {
        throw new Error(fetchError.message || "피드백을 불러오는데 실패했습니다");
      }

      if (data && data.length > 0) {
        const updatedFeedback = convertRowToFeedback(data[0]);
        setFeedback(updatedFeedback);
        setOriginalFeedback(updatedFeedback);
      }
    } catch (err) {
      console.error("피드백 새로고침 에러:", err);
    }
  }, [feedbackId]);

  if (isLoading) {
    return <FeedbackDetailSkeleton />;
  }

  if (error || !feedback) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">{error || "피드백을 찾을 수 없습니다."}</p>
      </div>
    );
  }

  const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
  const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];
  const priorityInfo = feedback.priority ? FEEDBACK_PRIORITY_INFO[feedback.priority] : null;
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  // 투표 토글
  const handleVote = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!feedback) return;

    try {
      const { error } = await supabase
        .schema("odd")
        .rpc("v1_toggle_feedback_vote", {
          p_feedback_id: feedback.feedbackId, // 실제 feedback_id 사용
        });

      if (error) {
        throw new Error(error.message || "투표 처리에 실패했습니다");
      }

      // 투표 상태 업데이트
      setFeedback((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isVoted: !prev.isVoted,
          votesCount: prev.isVoted ? prev.votesCount - 1 : prev.votesCount + 1,
        };
      });
    } catch (err) {
      console.error("투표 에러:", err);
      alert(err instanceof Error ? err.message : "투표 처리에 실패했습니다");
    }
  };

  // 상태 변경
  const handleStatusChange = (newStatus: FeedbackStatus) => {
    setFeedback((prev) => {
      if (!prev) return prev;
      const historyItem: FeedbackHistory = {
        id: `h${Date.now()}`,
        type: "status_change",
        actor: { id: user?.id || "current", username: user?.username || "guest", displayName: user?.displayName || "게스트" },
        oldValue: prev.status,
        newValue: newStatus,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        status: newStatus,
        history: [...(prev.history || []), historyItem],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 타입 변경
  const handleTypeChange = (newType: FeedbackType) => {
    setFeedback((prev) => {
      if (!prev) return prev;
      const historyItem: FeedbackHistory = {
        id: `h${Date.now()}`,
        type: "type_change",
        actor: { id: user?.id || "current", username: user?.username || "guest", displayName: user?.displayName || "게스트" },
        oldValue: prev.type,
        newValue: newType,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        type: newType,
        history: [...(prev.history || []), historyItem],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 우선순위 변경
  const handlePriorityChange = (newPriority: FeedbackPriority) => {
    setFeedback((prev) => {
      if (!prev) return prev;
      const historyItem: FeedbackHistory = {
        id: `h${Date.now()}`,
        type: "priority_change",
        actor: { id: user?.id || "current", username: user?.username || "guest", displayName: user?.displayName || "게스트" },
        oldValue: prev.priority,
        newValue: newPriority,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        priority: newPriority,
        history: [...(prev.history || []), historyItem],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 공식 답변 저장
  const handleDevResponse = async (response: string) => {
    if (!feedbackId) return;

    try {
      const { error } = await supabase
        .schema("odd")
        .rpc("v1_update_feedback", {
          p_post_id: feedbackId,
          p_developer_response: response || null,
        });

      if (error) {
        throw new Error(error.message || "공식 답변 저장에 실패했습니다");
      }

      setFeedback((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          developerResponse: response,
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error("공식 답변 저장 에러:", err);
      alert(err instanceof Error ? err.message : "공식 답변 저장에 실패했습니다");
    }
  };

  // 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 댓글은 useDevFeedComments hook에서 처리됨

  // 수정 모달 열기
  const handleOpenEditModal = () => {
    if (!feedback) return;
    setIsEditModalOpen(true);
  };

  // 피드백 삭제 핸들러
  const handleDeleteFeedback = async () => {
    if (!feedbackId) return;
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
        throw new Error(error.message || "피드백 삭제에 실패했습니다");
      }

      // 피드백 목록 페이지로 이동
      navigate(`/project/${id}/community/feedback`);
    } catch (err) {
      console.error("피드백 삭제 에러:", err);
      alert(err instanceof Error ? err.message : "피드백 삭제에 실패했습니다");
    }
  };

  // 히스토리 타입 라벨
  const getHistoryLabel = (history: FeedbackHistory) => {
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

  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Mobile Header - 모바일에서만 표시 */}
      {project && (
        <div className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
          <div className="h-14 flex items-center gap-3 px-4">
            <button
              onClick={() => navigate(`/project/${id}/community/feedback`)}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              aria-label="피드백 목록으로 돌아가기"
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
        {project && (
          <div className="mb-6 hidden lg:block">
            <Link
              to={`/project/${id}/community/feedback`}
              className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors mb-4"
              aria-label="피드백 목록으로 돌아가기"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>피드백 목록으로 돌아가기</span>
            </Link>
            
            <div className="flex items-center gap-4">
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Feedback Header Card */}
            <Card className="overflow-hidden">
              {/* 상단 색상 바 */}
              <div className={cn("h-1", typeInfo.color.replace("text-", "bg-").split(" ")[0])} />
              
              <CardContent className="p-0">
                {/* Title Section */}
                <div className="p-6 pb-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {feedback.isPinned && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        <Pin className="h-3 w-3 mr-1" />
                        고정됨
                      </Badge>
                    )}
                    <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", typeInfo.color)}>
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeInfo.label}
                    </span>
                    <Badge className={cn("flex items-center gap-1", statusInfo.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    {priorityInfo && (
                      <Badge className={priorityInfo.color}>
                        <Flag className="h-3 w-3 mr-1" />
                        {priorityInfo.label}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 flex-1">
                      {feedback.title}
                    </h1>
                    {/* 작성자만 수정/삭제 버튼 표시 */}
                    {isFeedbackAuthor && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenEditModal}
                          className="p-2 rounded-lg text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleDeleteFeedback}
                          className="p-2 rounded-lg text-surface-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={feedback.author.avatar}
                      fallback={feedback.author.displayName} 
                      size="md" 
                    />
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-50">
                        {feedback.author.displayName}
                      </p>
                      <p className="text-sm text-surface-500">
                        @{feedback.author.username} · {formatRelativeTime(feedback.createdAt)}
                        {feedback.updatedAt && <span className="text-surface-400"> · 수정됨</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Content Section */}
                <div className="p-6">
                  <div className="prose prose-surface dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-surface-700 dark:text-surface-300 leading-relaxed">
                      {feedback.content}
                    </p>
                  </div>
                </div>

                {/* Images Section (별도 영역) */}
                {feedback.images && feedback.images.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-6 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {feedback.images.map((img, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setImageViewerIndex(index);
                              setImageViewerOpen(true);
                            }}
                          >
                            <img
                              src={img}
                              alt={`피드백 이미지 ${index + 1}`}
                              className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700 group-hover:opacity-90 transition-opacity"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Developer Response */}
                {feedback.developerResponse && (
                  <>
                    <Separator />
                    <div className="p-6 bg-primary-50/50 dark:bg-primary-900/10">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                          <MessageSquarePlus className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-primary-700 dark:text-primary-300">
                              공식 답변
                            </span>
                            {isProjectMember && (
                              <button
                                onClick={() => setShowDevResponseModal(true)}
                                className="text-xs text-surface-400 hover:text-primary-500"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-primary-700 dark:text-primary-300">
                            {feedback.developerResponse}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions Bar */}
                <div className="px-6 py-4 flex items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50">
                  <button
                    onClick={handleVote}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      feedback.isVoted
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-800"
                        : "bg-white dark:bg-surface-800 text-surface-600 hover:bg-primary-50 hover:text-primary-600 dark:text-surface-400 dark:hover:bg-primary-900/20 border border-surface-200 dark:border-surface-700"
                    )}
                  >
                    <ThumbsUp className={cn("h-4 w-4", feedback.isVoted && "fill-current")} />
                    {formatNumber(feedback.votesCount)}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-surface-500">
                    <MessageCircle className="h-4 w-4" />
                    {totalComments}개의 댓글
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
                      {copied ? "복사됨" : "링크"}
                    </button>
                    {/* <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                      <Share2 className="h-4 w-4" />
                      공유
                    </button> */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                  댓글 ({totalComments})
                </h2>

                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-surface-500">댓글을 불러오는 중...</p>
                  </div>
                ) : (
                  <CommentThread
                    comments={comments}
                    currentUser={
                      user
                        ? {
                            id: user.id,
                            username: user.username,
                            displayName: user.displayName,
                            avatarUrl: user.avatar ? getProfileImageUrl(user.avatar, "sm") : undefined,
                          }
                        : { id: "guest", displayName: "게스트" }
                    }
                    currentUserId={user?.id}
                    maxDepth={COMMENT_MAX_DEPTH}
                    enableAttachments={COMMENT_ENABLE_ATTACHMENTS}
                    maxImages={COMMENT_MAX_IMAGES}
                    isAuthenticated={isAuthenticated}
                    onSignUpPrompt={() => setShowLoginModal(true)}
                    onCreate={handleAddComment}
                    onReply={handleReply}
                    onLike={handleLikeComment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                )}

                {hasMoreComments && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreComments}
                      disabled={isLoadingMoreComments}
                    >
                      {isLoadingMoreComments ? "로딩 중..." : "더 보기"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* Vote Card */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                    {formatNumber(feedback.votesCount)}
                  </p>
                  <p className="text-sm text-surface-500">투표</p>
                </div>
                <Button
                  onClick={handleVote}
                  variant={feedback.isVoted ? "primary" : "outline"}
                  className="w-full"
                >
                  <ThumbsUp className={cn("h-4 w-4 mr-2", feedback.isVoted && "fill-current")} />
                  {feedback.isVoted ? "투표 취소" : "이 피드백에 투표"}
                </Button>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                    세부 정보
                  </h3>
                  {/* {isProjectMember && (
                    <p className="text-xs text-surface-400 mt-1">
                      관리자에게만 노출됩니다.
                    </p>
                  )} */}
                </div>
                
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {/* 상태 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      상태
                    </span>
                    {isProjectMember ? (
                      <select
                        value={feedback.status}
                        onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
                        className="w-[120px] h-7 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {Object.entries(FEEDBACK_STATUS_INFO).map(([key, info]) => (
                          <option key={key} value={key}>{info.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge className={cn("flex items-center gap-1", statusInfo.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>

                  {/* 타입 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      타입
                    </span>
                    {isProjectMember ? (
                      <select
                        value={feedback.type}
                        onChange={(e) => handleTypeChange(e.target.value as FeedbackType)}
                        className="w-[120px] h-7 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {Object.entries(FEEDBACK_TYPE_INFO).map(([key, info]) => (
                          <option key={key} value={key}>{info.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", typeInfo.color)}>
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </span>
                    )}
                  </div>

                  {/* 우선순위 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      우선순위
                    </span>
                    {isProjectMember ? (
                      <select
                        value={feedback.priority || ""}
                        onChange={(e) => handlePriorityChange(e.target.value as FeedbackPriority)}
                        className="w-[120px] h-7 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="">선택...</option>
                        {Object.entries(FEEDBACK_PRIORITY_INFO).map(([key, info]) => (
                          <option key={key} value={key}>{info.label}</option>
                        ))}
                      </select>
                    ) : (
                      priorityInfo ? (
                        <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                      ) : (
                        <span className="text-sm text-surface-400">-</span>
                      )
                    )}
                  </div>

                  {/* 담당자
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      담당자
                    </span>
                    {feedback.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar fallback={feedback.assignee.displayName} size="xs" className="h-5 w-5" />
                        <span className="text-sm text-surface-700 dark:text-surface-300">
                          {feedback.assignee.displayName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-surface-400">-</span>
                    )}
                  </div> */}

                  {/* 작성일 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      작성일
                    </span>
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {new Date(feedback.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {feedback.updatedAt && (
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-surface-500 flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        수정일
                      </span>
                      <span className="text-sm text-surface-700 dark:text-surface-300">
                        {new Date(feedback.updatedAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Changes - 변경사항 있을 때만 */}
            {isProjectMember && hasChanges && (
              <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30">
                <CardContent className="p-3">
                  <p className="text-xs text-primary-600 dark:text-primary-400 mb-3">
                    변경사항이 있습니다. 저장해주세요.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelChanges}
                      disabled={isSaving}
                    >
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Actions - 프로젝트 멤버만 */}
            {isProjectMember && (
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      관리
                    </h3>
                    <p className="text-xs text-surface-400 mt-1">
                      프로젝트 관리자에게만 표시됩니다
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowDevResponseModal(true)}
                    >
                      <MessageSquarePlus className="h-4 w-4 mr-2" />
                      {feedback.developerResponse ? "공식 답변 수정" : "개발자 답변 작성"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      변경 이력 {showHistory ? "숨기기" : "보기"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History - 프로젝트 멤버만 */}
            {isProjectMember && showHistory && feedback.history && feedback.history.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      변경 이력
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {feedback.history.slice().reverse().map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <Avatar fallback={item.actor.displayName} size="xs" className="h-5 w-5 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-surface-600 dark:text-surface-400">
                            <span className="font-medium text-surface-900 dark:text-surface-100">
                              {item.actor.displayName}
                            </span>
                            님이 {getHistoryLabel(item)}
                          </p>
                          <p className="text-[10px] text-surface-400 mt-0.5">
                            {formatRelativeTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dev Response Modal */}
      <DevResponseModal
        isOpen={showDevResponseModal}
        onClose={() => setShowDevResponseModal(false)}
        initialValue={feedback.developerResponse}
        onSubmit={handleDevResponse}
      />

      {/* Edit Feedback Modal */}
      {isEditModalOpen && feedback && (
        <UserFeedbackModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingFeedback={{
            id: feedback.id,
            feedbackId: feedback.feedbackId,
            type: feedback.type,
            title: feedback.title,
            content: feedback.content,
            images: feedback.images,
            author: feedback.author,
            status: feedback.status,
            votesCount: feedback.votesCount,
            isVoted: feedback.isVoted,
            commentsCount: feedback.commentsCount,
            createdAt: feedback.createdAt,
          }}
          projectId={id || ""}
          onSave={handleModalSave}
          onDelete={handleDeleteFeedback}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      {/* Image Viewer */}
      {feedback?.images && feedback.images.length > 0 && (
        <ImageViewer
          images={feedback.images}
          initialIndex={imageViewerIndex}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </div>
  );
}
