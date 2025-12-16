import React, { useCallback, useMemo, useRef, useState } from "react";
import { Reply, ThumbsUp, Edit, Trash2, ChevronDown, ChevronUp, ImageIcon, Send, X } from "lucide-react";

import { Avatar, Badge, Button, Separator, Textarea } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";

/**
 * 댓글 작성자 정보
 * - 댓글 작성자 표기(아바타, 이름, 역할)와 권한 체크(currentUserId와 비교)에 활용된다.
 */
export interface CommentAuthor {
  id: string;
  username?: string;
  displayName: string;
  role?: string;
  avatarUrl?: string;
}

/**
 * 댓글 데이터 모델
 * - isDeleted: 소프트 삭제 상태 플래그. 회색 처리 및 본문 숨김에 사용된다.
 * - depth: 루트 0 기준의 뎁스 값. maxDepth 제한 및 들여쓰기 UI에 사용된다.
 * - replies: 자식 댓글 목록. 뎁스별 정렬/토글에 사용된다.
 */
export interface CommentNode {
  id: string;
  author: CommentAuthor;
  content: string;
  images?: string[];
  likesCount: number;
  isLiked: boolean;
  depth: number;
  parentId?: string;
  replies?: CommentNode[];
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface CommentThreadProps {
  comments: CommentNode[];
  currentUser?: CommentAuthor;
  currentUserId?: string;
  maxDepth?: number;
  enableAttachments?: boolean;
  maxImages?: number;
  /** 현재 사용자 인증 여부 - 비회원이면 좋아요/답글 시 onSignUpPrompt 호출 */
  isAuthenticated?: boolean;
  /** 비회원이 회원용 기능(좋아요, 답글) 클릭 시 호출되는 콜백 */
  onSignUpPrompt?: () => void;
  onCreate: (content: string, images: string[]) => void | Promise<void>;
  onReply: (parentId: string, content: string, images: string[]) => void | Promise<void>;
  onLike: (commentId: string) => void;
  onEdit?: (commentId: string, content: string, images: string[]) => void | Promise<void>;
  onDelete?: (commentId: string) => void | Promise<void>;
}

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_IMAGES = 1;
const COLLAPSE_CHAR_LIMIT = 320;

interface ComposerProps {
  placeholder?: string;
  onSubmit: (content: string, images: string[]) => void;
  onCancel?: () => void;
  initialContent?: string;
  initialImages?: string[];
  autoFocus?: boolean;
  showCancel?: boolean;
  enableAttachments: boolean;
  maxImages: number;
}

/**
 * 댓글 작성/수정 공용 입력 컴포넌트
 * - 단일 책임: 텍스트 입력, 이미지 첨부, 단축키(⌘/Ctrl+Enter 전송, Esc 취소) 처리
 * - 전송/취소 시 상위(onSubmit/onCancel)로 모든 상태를 전달하여 부모가 데이터 관리
 */
function CommentComposer({
  placeholder = "댓글을 입력하세요...",
  onSubmit,
  onCancel,
  initialContent = "",
  initialImages = [],
  autoFocus,
  showCancel,
  enableAttachments,
  maxImages,
}: ComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<string[]>(initialImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && images.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    const maybePromise = onSubmit(content.trim(), images) as unknown;
    if (maybePromise && typeof (maybePromise as any).then === "function") {
      await (maybePromise as Promise<void>);
    }
    setContent("");
    setImages([]);
    setIsSubmitting(false);
  }, [content, images, isSubmitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isSubmitKey = (e.metaKey || e.ctrlKey) && e.key === "Enter";
    if (isSubmitKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !enableAttachments) return;

    const remainingSlots = maxImages - images.length;
    const targetFiles = Array.from(files).slice(0, Math.max(remainingSlots, 0));

    targetFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setImages((prev) => [...prev, loadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const hasReachedLimit = images.length >= maxImages;

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] text-sm"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 좌측: 단축키 안내를 항상 고정 배치해 전송 방법을 즉시 인지 */}
        <span
          className={cn(
            "text-[11px] text-surface-400 transition-opacity duration-200",
            isFocused ? "opacity-100" : "opacity-80"
          )}
        >
          ⌘+Enter로 전송 · Esc로 취소
        </span>

        {/* 우측: 첨부(옵션), 취소/작성 액션을 한 라인으로 묶어 시야 분산 최소화 */}
        <div className="flex items-center gap-2">
          {enableAttachments ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              {/* 이미지 첨부: 옵션이 켜져 있을 때만 노출, 남은 슬롯을 수치로 안내 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "text-surface-600 hover:text-primary-500 border-dashed px-3",
                  hasReachedLimit && "opacity-60 cursor-not-allowed"
                )}
                disabled={hasReachedLimit}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  이미지 첨부 <span className="font-semibold">{images.length}</span>/<span>{maxImages}</span>
                </span>
              </Button>
            </>
          ) : (
            <span
              className="text-[11px] text-surface-300 dark:text-surface-600 px-2 py-1 rounded-md border border-dashed border-surface-200 dark:border-surface-700"
              title="이미지 첨부 비활성화됨"
            >
              이미지 첨부 비활성화됨
            </span>
          )}

          {showCancel && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={(!content.trim() && images.length === 0) || isSubmitting}>
            <Send className={cn("h-3.5 w-3.5 mr-1", isSubmitting && "animate-spin")} />
            {isSubmitting ? "전송 중..." : "작성"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: CommentNode;
  currentUser?: CommentAuthor;
  currentUserId?: string;
  maxDepth: number;
  enableAttachments: boolean;
  maxImages: number;
  isAuthenticated?: boolean;
  /** 비회원이 회원용 기능 클릭 시 호출 */
  onSignUpPrompt?: () => void;
  onReply: (parentId: string, content: string, images: string[]) => void;
  onLike: (commentId: string) => void;
  onEdit?: (commentId: string, content: string, images: string[]) => void;
  onDelete?: (commentId: string) => void;
}

/**
 * 단일 댓글 렌더링
 * - 본문/이미지/메타 + 좋아요/답글/수정/삭제 액션
 * - 삭제 상태일 때는 회색 톤으로 전환하고 본문을 대체 텍스트로 교체
 * - 인라인 수정: 동일 자리에 Composer를 재사용하여 맥락 유지
 */
function CommentItem({
  comment,
  currentUser,
  currentUserId,
  maxDepth,
  enableAttachments,
  maxImages,
  isAuthenticated = true,
  onSignUpPrompt,
  onReply,
  onLike,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const isDeleted = comment.isDeleted;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(
    comment.content.length > COLLAPSE_CHAR_LIMIT
  );

  // maxDepth/ depth가 누락되거나 비정상일 때를 대비해 방어적으로 기본값을 적용
  const effectiveMaxDepth = Number.isFinite(maxDepth) && (maxDepth as number) > 0 ? (maxDepth as number) : DEFAULT_MAX_DEPTH;
  const safeDepth = Number.isFinite(comment.depth) && comment.depth >= 0 ? comment.depth : 0;
  const hasReplies = comment.replies && comment.replies.length > 0;
  // 최대 뎁스보다 작은 경우에만 답글 허용 (예: maxDepth=3 -> depth 0,1,2 에서 답글 가능)
  // 비회원일 때는 답글 기능 숨김
  const canReply = !isDeleted && safeDepth < effectiveMaxDepth && isAuthenticated;
  const effectiveUserId = currentUserId || currentUser?.id;
  const isMine = effectiveUserId && comment.author.id === effectiveUserId;

  const handleSubmitReply = (content: string, images: string[]) => {
    onReply(comment.id, content, images);
    setShowReplyInput(false);
  };

  const handleSubmitEdit = (content: string, images: string[]) => {
    if (onEdit) {
      onEdit(comment.id, content, images);
    }
    setIsEditing(false);
  };

  const displayContent = isCollapsed
    ? `${comment.content.slice(0, COLLAPSE_CHAR_LIMIT)}...`
    : comment.content;

  return (
    <div
      className={cn(
        "relative",
        comment.depth > 0 && "ml-10",
        confirmDelete && !isDeleted && "bg-rose-50/60 dark:bg-rose-950/20 rounded-lg px-2 py-1"
      )}
    >
      {comment.depth > 0 && (
        <div className="absolute -left-5 top-0 bottom-0 border-l border-dashed border-surface-200/80 dark:border-surface-700/70" />
      )}

      <div className="py-4">
        <div className="flex gap-3">
          <div className={cn("shrink-0", isDeleted && "opacity-50 grayscale")}>
            <Avatar fallback={comment.author.displayName} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("font-medium text-sm", isDeleted ? "text-surface-400" : "text-surface-900 dark:text-surface-50")}>
                {comment.author.displayName}
              </span>
              {comment.author.role && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {comment.author.role}
                </Badge>
              )}
              <span className="text-xs text-surface-400">
                {formatRelativeTime(comment.createdAt)}
                {comment.updatedAt && !comment.isDeleted && <span className="ml-1 text-[10px] text-surface-400">(수정됨)</span>}
              </span>
            </div>

            {isEditing ? (
              <CommentComposer
                placeholder="댓글을 수정하세요..."
                onSubmit={handleSubmitEdit}
                onCancel={() => setIsEditing(false)}
                showCancel
                autoFocus
                initialContent={comment.content}
                initialImages={comment.images || []}
                enableAttachments={enableAttachments}
                maxImages={maxImages}
              />
            ) : (
              <>
                <p
                  className={cn(
                    "text-sm whitespace-pre-wrap mb-2",
                    isDeleted
                      ? "text-surface-400"
                      : "text-surface-700 dark:text-surface-300"
                  )}
                >
                  {isDeleted ? "삭제된 댓글입니다." : displayContent}
                </p>
                {!isDeleted && comment.content.length > COLLAPSE_CHAR_LIMIT && (
                  <button
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className="text-xs text-primary-500 hover:text-primary-600 transition-colors mb-2"
                  >
                    {isCollapsed ? "더보기" : "접기"}
                  </button>
                )}

                {comment.images && comment.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {comment.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`댓글 이미지 ${index + 1}`}
                        className="max-h-40 rounded-lg border border-surface-200 dark:border-surface-700 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImage(img)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* 좋아요 버튼 - 비회원 시 회원가입 모달 표시 */}
                  {!isDeleted && (
                    <button
                      onClick={() => {
                        if (!isAuthenticated && onSignUpPrompt) {
                          onSignUpPrompt();
                          return;
                        }
                        onLike(comment.id);
                      }}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-md",
                        comment.isLiked
                          ? "text-primary-500"
                          : "text-surface-400 hover:text-primary-500"
                      )}
                    >
                      <ThumbsUp className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")} />
                      {comment.likesCount > 0 && formatNumber(comment.likesCount)}
                    </button>
                  )}

                  {canReply && (
                    <button
                      onClick={() => setShowReplyInput((prev) => !prev)}
                      className="flex items-center gap-1 text-xs text-surface-400 hover:text-primary-500 transition-colors px-2 py-1 rounded-md"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      답글
                    </button>
                  )}

                  {isMine && !comment.isDeleted && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs text-surface-400 hover:text-primary-500 transition-colors px-2 py-1 rounded-md"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        수정
                      </button>
                      {!confirmDelete ? (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </button>
                      ) : (
                        <span className="flex items-center gap-2 text-xs text-rose-400">
                          <span>삭제할까요?</span>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-2 py-0.5 rounded-md bg-surface-100 text-surface-500 hover:bg-surface-200 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={async () => {
                              const maybePromise = onDelete?.(comment.id) as unknown;
                              if (maybePromise && typeof (maybePromise as any).then === "function") {
                                await (maybePromise as Promise<void>);
                              }
                              setConfirmDelete(false);
                            }}
                            className="px-2 py-0.5 rounded-md bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                          >
                            삭제
                          </button>
                        </span>
                      )}
                    </>
                  )}

                  {hasReplies && (
                    <button
                      onClick={() => setShowReplies((prev) => !prev)}
                      className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors px-1.5 py-1 rounded-md"
                    >
                      {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {comment.replies!.length}개의 답글
                    </button>
                  )}
                </div>

                {showReplyInput && (
                  <div className="mt-3">
                    <CommentComposer
                      placeholder={`@${comment.author.displayName}에게 답글...`}
                      onSubmit={handleSubmitReply}
                      onCancel={() => setShowReplyInput(false)}
                      showCancel
                      autoFocus
                      enableAttachments={enableAttachments}
                      maxImages={maxImages}
                    />
                  </div>
                )}
              </>
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
              currentUserId={currentUserId}
              maxDepth={maxDepth}
              enableAttachments={enableAttachments}
              maxImages={maxImages}
              isAuthenticated={isAuthenticated}
              onSignUpPrompt={onSignUpPrompt}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* 라이트박스: 첨부 이미지 크게 보기 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative">
            <img
              src={lightboxImage}
              alt="확대 이미지"
              className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl border border-surface-800"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 댓글 스레드 루트 컴포넌트
 * - 옵션화된 뎁스/이미지 첨부 설정을 제공
 * - 각 레벨별 최신 댓글이 위로 오도록 정렬해주는 정렬 레이어 포함
 */
export function CommentThread({
  comments,
  currentUser,
  currentUserId,
  maxDepth = DEFAULT_MAX_DEPTH,
  enableAttachments = true,
  maxImages = DEFAULT_MAX_IMAGES,
  isAuthenticated = true,
  onSignUpPrompt,
  onCreate,
  onReply,
  onLike,
  onEdit,
  onDelete,
}: CommentThreadProps) {
  const sortByRecent = useCallback((items: CommentNode[]): CommentNode[] => {
    return [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => ({
        ...c,
        replies: c.replies ? sortByRecent(c.replies) : [],
      }));
  }, []);

  const orderedComments = useMemo(() => sortByRecent(comments), [comments, sortByRecent]);

  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <div className="flex gap-3">
          <Avatar fallback={currentUser?.displayName || "?"} size="sm" />
          <div className="flex-1">
            <CommentComposer
              placeholder="의견을 남겨주세요..."
              onSubmit={onCreate}
              enableAttachments={enableAttachments}
              maxImages={maxImages}
            />
          </div>
        </div>
      ) : (
        <div className="text-sm text-surface-500 dark:text-surface-400">
          댓글을 작성하려면 로그인이 필요합니다
        </div>
      )}

      <Separator />

      {orderedComments.length > 0 ? (
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {orderedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              currentUserId={currentUserId}
              maxDepth={maxDepth}
              enableAttachments={enableAttachments}
              maxImages={maxImages}
              isAuthenticated={isAuthenticated}
              onSignUpPrompt={onSignUpPrompt}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-surface-400 text-sm">
          아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
        </div>
      )}
    </div>
  );
}

export default CommentThread;
