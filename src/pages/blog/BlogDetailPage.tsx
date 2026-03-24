/**
 * @file BlogDetailPage.tsx
 * @description 블로그 상세. 미니멀한 정보 위주 구성. 수정·삭제는 작성자만. URL 복사는 작성자 행 우측.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Copy from "lucide-react/dist/esm/icons/copy";
import { LeftSidebar } from "@/widgets";
import { MarkdownRenderer } from "@/shared/ui/markdown/MarkdownRenderer";
import { CommentThread } from "@/shared/ui/comment";
import { fetchBlogPostBySlug, deleteBlogPost, type BlogPostDetail } from "@/entities/blog";
import { useUserStore } from "@/entities/user";
import { SignUpModal } from "@/pages/auth";
import { formatRelativeTime } from "@/shared/lib/utils";
import { getProfileImageUrl } from "@/shared/lib/storage";
import { copyTextToClipboard } from "@/shared/lib/copyToClipboard";
import { useBlogComments } from "./hooks/useBlogComments";
import { isBlogPostAuthor } from "./lib/postAuthor";

import { Button } from "@/shared/ui";

const COPY_FEEDBACK_MS = 2000;

export function BlogDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserStore();
  const [post, setPost] = useState<BlogPostDetail | null | undefined>(undefined);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const urlCopiedTimerRef = useRef<number | null>(null);

  const {
    comments,
    isLoadingComments,
    isLoadingMoreComments,
    totalComments,
    hasMore,
    handleAddComment,
    handleReply,
    handleCommentLike,
    handleEditComment,
    handleDeleteComment,
    handleLoadMoreComments,
  } = useBlogComments(user, {
    blogPostId: post?.id ?? "",
    isAuthenticated,
    onSignUpPrompt: () => setShowSignUpModal(true),
  });

  useEffect(() => {
    if (!slug) {
      setPost(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchBlogPostBySlug(slug);
      if (cancelled) return;
      if (error) {
        setPost(null);
        return;
      }
      setPost(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      if (urlCopiedTimerRef.current != null) {
        window.clearTimeout(urlCopiedTimerRef.current);
      }
    };
  }, []);

  const handleCopyPageUrl = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    const ok = await copyTextToClipboard(url);
    if (!ok) {
      alert("복사에 실패했습니다. 주소창의 URL을 직접 복사해 주세요.");
      return;
    }
    if (urlCopiedTimerRef.current != null) {
      window.clearTimeout(urlCopiedTimerRef.current);
    }
    setUrlCopied(true);
    urlCopiedTimerRef.current = window.setTimeout(() => {
      setUrlCopied(false);
      urlCopiedTimerRef.current = null;
    }, COPY_FEEDBACK_MS);
  }, []);

  const handleDeletePost = async () => {
    if (!post) return;
    if (!window.confirm("이 글을 삭제할까요?")) return;
    const { success, error } = await deleteBlogPost(post.id);
    if (error || !success) {
      alert(error?.message || "삭제 실패");
      return;
    }
    navigate("/blog");
  };

  if (post === undefined) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800 p-8 text-center text-surface-500 text-sm">
          로딩 중...
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800 p-8 text-center">
          <p className="text-sm text-surface-600 dark:text-surface-400">글을 찾을 수 없습니다.</p>
          <Link to="/blog" className="text-sm text-primary-600 hover:underline mt-4 inline-block">
            블로그 목록으로
          </Link>
        </main>
      </div>
    );
  }

  const canEditOrDelete = isAuthenticated && isBlogPostAuthor(user, post.author_id);

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800">
        {/* 툴바 - 목록으로만 */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-surface-950/95 border-b border-surface-100 dark:border-surface-800 px-4 py-2 flex items-center">
          <button
            type="button"
            onClick={() => navigate("/blog")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
            title="목록으로"
          >
            <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
          </button>
        </div>

        <article className="px-4 py-8 md:px-10 md:py-12 max-w-3xl mx-auto">
          <header className="mb-10">
            <h1 className="text-2xl md:text-3xl font-medium text-surface-900 dark:text-surface-50 leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex min-w-0 items-center gap-2 text-[13px] text-surface-500 dark:text-surface-400">
                <span className="font-medium text-surface-900 dark:text-surface-200 truncate">
                  {post.author_display_name}
                </span>
                <span className="opacity-40 shrink-0">|</span>
                <span className="shrink-0">
                  {post.published_at
                    ? formatRelativeTime(post.published_at)
                    : formatRelativeTime(post.created_at)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCopyPageUrl}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                  title="현재 페이지 주소를 클립보드에 복사"
                >
                  <Copy className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  {urlCopied ? "복사됨" : "URL 복사"}
                </button>
                {canEditOrDelete ? (
                  <>
                    <Button variant="outline" size="sm" className="rounded-full px-5" asChild>
                      <Link to={`/blog/${post.slug}/edit`} className="cursor-pointer">
                        수정
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeletePost}
                      className="rounded-full px-5 shadow-none"
                    >
                      삭제
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          {post.link_url && (
            <div className="mb-8 p-4 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800">
              {/* <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">참고 링크</p> */}
              <a 
                href={post.link_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
              >
                {post.link_url}
              </a>
            </div>
          )}

          <div className="prose prose-surface dark:prose-invert max-w-none">
            <MarkdownRenderer markdown={post.content_md} variant="blog" />
          </div>
        </article>

        {/* 댓글 영역 */}
        <section className="border-t border-surface-100 dark:border-surface-800 px-4 py-10 md:px-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-6">
            댓글 {totalComments > 0 ? `(${totalComments})` : ""}
          </h2>
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
                : undefined
            }
            currentUserId={user?.id}
            isAuthenticated={isAuthenticated}
            onSignUpPrompt={() => setShowSignUpModal(true)}
            onCreate={handleAddComment}
            onReply={handleReply}
            onLike={handleCommentLike}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            enableAttachments={false}
            maxImages={0}
            maxLength={2000}
            hasMore={hasMore}
            isLoadingMore={isLoadingMoreComments}
            onLoadMore={handleLoadMoreComments}
            isLoadingComments={isLoadingComments}
          />
        </section>

        <SignUpModal open={showSignUpModal} onOpenChange={setShowSignUpModal} />
      </main>
    </div>
  );
}
