import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquareText,
  Send,
  Image as ImageIcon,
  X,
  Reply,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  User,
  Tag,
  Flag,
  MessageSquarePlus,
  History,
  Pin,
  Eye,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import { Button, Avatar, Badge, Textarea, Card, CardContent, Input, Separator } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO } from "@/entities/project";
import { useUserStore } from "@/entities/user";

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
  id: string;
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

const MAX_COMMENT_DEPTH = 3;

// ========== 더미 데이터 ==========

const dummyProjectMembers: FeedbackAuthor[] = [
  { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
  { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
  { id: "u8", username: "designer_lee", displayName: "이디자인", role: "Designer" },
];

const dummyFeedbacks: Feedback[] = [
  {
    id: "fb1",
    type: "feature",
    status: "in_progress",
    priority: "high",
    title: "다국어 지원 요청",
    content: `영어, 일본어 등 다국어 지원이 되면 좋겠습니다. 해외 사용자들도 많이 관심을 가지고 있어요!

현재 한국어만 지원되어서 해외 유저들이 사용하기 어려운 상황입니다.

## 제안하는 우선순위
1. 영어 (EN)
2. 일본어 (JA)
3. 중국어 간체 (ZH-CN)

다국어 지원이 되면 더 많은 사용자들이 이용할 수 있을 것 같습니다!`,
    images: [],
    author: {
      id: "u3",
      username: "global_user",
      displayName: "글로벌유저",
    },
    assignee: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
    votesCount: 156,
    isVoted: true,
    commentsCount: 8,
    isPinned: true,
    comments: [
      {
        id: "c1",
        author: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
        content: "좋은 제안 감사합니다! 다국어 지원은 저희도 계획하고 있던 기능입니다. 영어부터 시작해서 점진적으로 확대할 예정이에요 🌏",
        images: [],
        likesCount: 45,
        isLiked: true,
        depth: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        replies: [
          {
            id: "c1-1",
            author: { id: "u3", username: "global_user", displayName: "글로벌유저" },
            content: "와 정말요? 기대됩니다! 혹시 예상 일정이 있을까요?",
            images: [],
            likesCount: 12,
            isLiked: false,
            depth: 1,
            parentId: "c1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.5).toISOString(),
            replies: [
              {
                id: "c1-1-1",
                author: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
                content: "다음 분기 중으로 영어 버전 출시 목표입니다. 마일스톤에도 추가해둘게요!",
                images: [],
                likesCount: 28,
                isLiked: true,
                depth: 2,
                parentId: "c1-1",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
                replies: [
                  {
                    id: "c1-1-1-1",
                    author: { id: "u3", username: "global_user", displayName: "글로벌유저" },
                    content: "감사합니다! 기다리고 있을게요 🙏",
                    images: [],
                    likesCount: 5,
                    isLiked: false,
                    depth: 3,
                    parentId: "c1-1-1",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.5).toISOString(),
                  },
                ],
              },
            ],
          },
          {
            id: "c1-2",
            author: { id: "u7", username: "translator", displayName: "번역가김" },
            content: "번역 작업에 참여하고 싶습니다! 일본어 네이티브예요.",
            images: [],
            likesCount: 18,
            isLiked: false,
            depth: 1,
            parentId: "c1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          },
        ],
      },
      {
        id: "c2",
        author: { id: "u5", username: "power_user", displayName: "파워유저" },
        content: "저도 다국어 지원 강력 희망합니다! 특히 영어는 필수인 것 같아요.",
        images: [],
        likesCount: 23,
        isLiked: false,
        depth: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      },
    ],
    developerResponse: "다음 분기 중 영어 버전 출시를 목표로 작업 중입니다!",
    history: [
      { id: "h1", type: "status_change", actor: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" }, oldValue: "open", newValue: "in_progress", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
      { id: "h2", type: "priority_change", actor: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" }, oldValue: "medium", newValue: "high", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
      { id: "h3", type: "assignee_change", actor: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" }, newValue: "인디메이커", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "fb2",
    type: "bug",
    status: "resolved",
    priority: "critical",
    title: "Safari에서 이미지 로딩 오류",
    content: `Safari 브라우저에서 이미지가 간헐적으로 로딩되지 않는 문제가 있습니다.

## 재현 방법
1. Safari 브라우저로 접속
2. 피드 페이지에서 스크롤
3. 일부 이미지가 깨져서 표시됨

## 환경
- macOS Sonoma 14.0
- Safari 17.0
- M1 MacBook Pro`,
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
    ],
    author: {
      id: "u4",
      username: "mac_user",
      displayName: "맥유저",
    },
    assignee: { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
    votesCount: 23,
    isVoted: false,
    commentsCount: 5,
    comments: [
      {
        id: "c3",
        author: { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
        content: "리포트 감사합니다! 확인해보니 Safari의 이미지 캐싱 관련 이슈인 것 같습니다. 수정 작업 진행하겠습니다.",
        images: [],
        likesCount: 8,
        isLiked: false,
        depth: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.5).toISOString(),
        replies: [
          {
            id: "c3-1",
            author: { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
            content: "v1.5.2에서 수정되었습니다. 확인 부탁드려요!",
            images: [],
            likesCount: 15,
            isLiked: true,
            depth: 1,
            parentId: "c3",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          },
        ],
      },
      {
        id: "c4",
        author: { id: "u4", username: "mac_user", displayName: "맥유저" },
        content: "업데이트 후 확인했는데 잘 됩니다! 빠른 수정 감사합니다 🙏",
        images: [],
        likesCount: 10,
        isLiked: false,
        depth: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
    ],
    developerResponse: "v1.5.2에서 수정 완료되었습니다.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "fb3",
    type: "improvement",
    status: "open",
    priority: "medium",
    title: "검색 기능 개선 제안",
    content: `현재 검색이 제목만 검색하는데, 내용도 함께 검색되면 좋겠습니다.

## 제안 사항
1. **전체 텍스트 검색** - 제목뿐만 아니라 내용도 검색
2. **필터 기능** - 타입, 상태, 날짜 등으로 필터링
3. **정렬 옵션** - 최신순, 인기순, 댓글순 등

현재는 원하는 피드백을 찾기가 어렵습니다.`,
    images: [],
    author: {
      id: "u5",
      username: "power_user",
      displayName: "파워유저",
    },
    votesCount: 89,
    isVoted: false,
    commentsCount: 3,
    comments: [
      {
        id: "c5",
        author: { id: "u6", username: "search_lover", displayName: "검색마니아" },
        content: "저도 동의합니다! 특히 필터 기능이 있으면 좋겠어요.",
        images: [],
        likesCount: 12,
        isLiked: false,
        depth: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

// ========== 컴포넌트 ==========

interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string, images: string[]) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  autoFocus?: boolean;
}

function CommentInput({ placeholder = "댓글을 입력하세요...", onSubmit, onCancel, showCancel, autoFocus }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;
    onSubmit(content, images);
    setContent("");
    setImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] text-sm"
        autoFocus={autoFocus}
      />
      
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`첨부 이미지 ${index + 1}`}
                className="h-20 w-20 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-surface-500 hover:text-primary-500"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            이미지
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {showCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={!content.trim() && images.length === 0}>
            <Send className="h-3.5 w-3.5 mr-1" />
            작성
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: FeedbackComment;
  onReply: (parentId: string, content: string, images: string[]) => void;
  onLike: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  maxDepth?: number;
}

function CommentItem({ comment, onReply, onLike, onDelete, maxDepth = MAX_COMMENT_DEPTH }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = comment.depth < maxDepth - 1;

  const handleSubmitReply = (content: string, images: string[]) => {
    onReply(comment.id, content, images);
    setShowReplyInput(false);
  };

  return (
    <div className={cn("relative", comment.depth > 0 && "ml-10")}>
      {comment.depth > 0 && (
        <div className="absolute -left-5 top-0 bottom-0 w-px bg-surface-200 dark:bg-surface-700" />
      )}
      
      <div className="py-4">
        <div className="flex gap-3">
          <Avatar fallback={comment.author.displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-surface-900 dark:text-surface-50 text-sm">
                {comment.author.displayName}
              </span>
              {comment.author.role && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {comment.author.role}
                </Badge>
              )}
              <span className="text-xs text-surface-400">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            
            <p className="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap mb-2">
              {comment.content}
            </p>

            {comment.images && comment.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {comment.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`댓글 이미지 ${index + 1}`}
                    className="max-h-40 rounded-lg border border-surface-200 dark:border-surface-700 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img, "_blank")}
                  />
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onLike(comment.id)}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  comment.isLiked
                    ? "text-primary-500"
                    : "text-surface-400 hover:text-primary-500"
                )}
              >
                <ThumbsUp className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")} />
                {comment.likesCount > 0 && formatNumber(comment.likesCount)}
              </button>
              
              {canReply && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-1 text-xs text-surface-400 hover:text-primary-500 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  답글
                </button>
              )}
              
              {hasReplies && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
                >
                  {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {comment.replies!.length}개의 답글
                </button>
              )}
            </div>
            
            {showReplyInput && (
              <div className="mt-3">
                <CommentInput
                  placeholder={`@${comment.author.displayName}에게 답글...`}
                  onSubmit={handleSubmitReply}
                  onCancel={() => setShowReplyInput(false)}
                  showCancel
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {hasReplies && showReplies && (
        <div className="relative">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 공식 답변 작성 모달
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
              공식 답변 작성
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

export function FeedbackDetailPage() {
  const { id, feedbackId } = useParams<{ id: string; feedbackId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { user } = useUserStore();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [originalFeedback, setOriginalFeedback] = useState<Feedback | null>(null);
  const [showDevResponseModal, setShowDevResponseModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 프로젝트 멤버 여부 (추후 권한 체크로 교체)
  const isProjectMember = true; // 데모용 - 실제로는 API에서 권한 체크

  useEffect(() => {
    const found = dummyFeedbacks.find((f) => f.id === feedbackId);
    if (found) {
      setFeedback({ ...found });
      setOriginalFeedback({ ...found });
    }
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
    if (!feedback || !hasChanges) return;
    setIsSaving(true);
    // 실제 구현에서는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 500));
    setOriginalFeedback({ ...feedback });
    setIsSaving(false);
  };

  // 변경사항 취소
  const handleCancelChanges = () => {
    if (originalFeedback) {
      setFeedback({ ...originalFeedback });
    }
  };

  const project = projects[0];
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  if (!feedback) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">피드백을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
  const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];
  const priorityInfo = feedback.priority ? FEEDBACK_PRIORITY_INFO[feedback.priority] : null;
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  // 투표 토글
  const handleVote = () => {
    setFeedback((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isVoted: !prev.isVoted,
        votesCount: prev.isVoted ? prev.votesCount - 1 : prev.votesCount + 1,
      };
    });
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

  // 담당자 변경
  const handleAssigneeChange = (assigneeId: string) => {
    const assignee = assigneeId ? dummyProjectMembers.find((m) => m.id === assigneeId) : undefined;
    setFeedback((prev) => {
      if (!prev) return prev;
      const historyItem: FeedbackHistory = {
        id: `h${Date.now()}`,
        type: "assignee_change",
        actor: { id: user?.id || "current", username: user?.username || "guest", displayName: user?.displayName || "게스트" },
        oldValue: prev.assignee?.displayName,
        newValue: assignee?.displayName || "없음",
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        assignee,
        history: [...(prev.history || []), historyItem],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 공식 답변 저장
  const handleDevResponse = (response: string) => {
    setFeedback((prev) => {
      if (!prev) return prev;
      const historyItem: FeedbackHistory = {
        id: `h${Date.now()}`,
        type: "response_added",
        actor: { id: user?.id || "current", username: user?.username || "guest", displayName: user?.displayName || "게스트" },
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        developerResponse: response,
        history: [...(prev.history || []), historyItem],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // 고정 토글
  const handleTogglePin = () => {
    setFeedback((prev) => {
      if (!prev) return prev;
      return { ...prev, isPinned: !prev.isPinned };
    });
  };

  // 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 댓글 추가
  const handleAddComment = (content: string, images: string[]) => {
    if (!content.trim() && images.length === 0) return;

    const newCommentObj: FeedbackComment = {
      id: `c${Date.now()}`,
      author: {
        id: user?.id || "current",
        username: user?.username || "guest",
        displayName: user?.displayName || "게스트",
      },
      content,
      images: images.length > 0 ? images : undefined,
      likesCount: 0,
      isLiked: false,
      depth: 0,
      createdAt: new Date().toISOString(),
    };

    setFeedback((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [...(prev.comments || []), newCommentObj],
        commentsCount: prev.commentsCount + 1,
      };
    });
  };

  // 답글 추가
  const handleReply = (parentId: string, content: string, images: string[]) => {
    const addReplyRecursive = (comments: FeedbackComment[], targetId: string, depth: number): FeedbackComment[] => {
      return comments.map((c) => {
        if (c.id === targetId) {
          const newReply: FeedbackComment = {
            id: `reply-${Date.now()}`,
            author: {
              id: user?.id || "current",
              username: user?.username || "guest",
              displayName: user?.displayName || "게스트",
            },
            content,
            images: images.length > 0 ? images : undefined,
            likesCount: 0,
            isLiked: false,
            depth: depth + 1,
            parentId: targetId,
            createdAt: new Date().toISOString(),
          };
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        if (c.replies) {
          return { ...c, replies: addReplyRecursive(c.replies, targetId, c.depth) };
        }
        return c;
      });
    };

    setFeedback((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: addReplyRecursive(prev.comments || [], parentId, 0),
        commentsCount: prev.commentsCount + 1,
      };
    });
  };

  // 댓글 좋아요
  const handleCommentLike = (commentId: string) => {
    const updateLikeRecursive = (comments: FeedbackComment[]): FeedbackComment[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        if (c.replies) {
          return { ...c, replies: updateLikeRecursive(c.replies) };
        }
        return c;
      });
    };

    setFeedback((prev) => {
      if (!prev) return prev;
      return { ...prev, comments: updateLikeRecursive(prev.comments || []) };
    });
  };

  // 총 댓글 수 계산
  const countAllComments = (comments: FeedbackComment[]): number => {
    return comments.reduce((acc, c) => {
      return acc + 1 + (c.replies ? countAllComments(c.replies) : 0);
    }, 0);
  };

  const totalComments = feedback.comments ? countAllComments(feedback.comments) : 0;

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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/project/${id}/community/feedback`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            피드백 목록으로 돌아가기
          </Link>
        </div>

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
                  <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                    {feedback.title}
                  </h1>

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <Avatar fallback={feedback.author.displayName} size="md" />
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

                  {/* Images */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-6">
                      {feedback.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`피드백 이미지 ${index + 1}`}
                          className="max-h-60 rounded-xl border border-surface-200 dark:border-surface-700 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(img, "_blank")}
                        />
                      ))}
                    </div>
                  )}
                </div>

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
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                      <Share2 className="h-4 w-4" />
                      공유
                    </button>
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

                {/* Comment Input */}
                <div className="mb-6 pb-6 border-b border-surface-100 dark:border-surface-800">
                  <div className="flex gap-3">
                    <Avatar fallback={user?.displayName || "?"} size="sm" />
                    <div className="flex-1">
                      <CommentInput
                        placeholder="의견을 남겨주세요..."
                        onSubmit={handleAddComment}
                      />
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {feedback.comments && feedback.comments.length > 0 ? (
                  <div className="divide-y divide-surface-100 dark:divide-surface-800">
                    {feedback.comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReply}
                        onLike={handleCommentLike}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-surface-400 text-sm">
                    아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
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
                  {isProjectMember && (
                    <p className="text-xs text-surface-400 mt-1">
                      관리자에게만 노출됩니다.
                    </p>
                  )}
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

                  {/* 담당자 */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-surface-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      담당자
                    </span>
                    {isProjectMember ? (
                      <select
                        value={feedback.assignee?.id || ""}
                        onChange={(e) => handleAssigneeChange(e.target.value)}
                        className="w-[120px] h-7 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="">없음</option>
                        {dummyProjectMembers.map((member) => (
                          <option key={member.id} value={member.id}>{member.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      feedback.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar fallback={feedback.assignee.displayName} size="xs" className="h-5 w-5" />
                          <span className="text-sm text-surface-700 dark:text-surface-300">
                            {feedback.assignee.displayName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-surface-400">-</span>
                      )
                    )}
                  </div>

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
                      {feedback.developerResponse ? "공식 답변 수정" : "공식 답변 작성"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleTogglePin}
                    >
                      <Pin className={cn("h-4 w-4 mr-2", feedback.isPinned && "fill-current text-amber-500")} />
                      {feedback.isPinned ? "고정 해제" : "상단 고정"}
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
    </div>
  );
}
