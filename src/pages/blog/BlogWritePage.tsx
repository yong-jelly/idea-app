/**
 * @file BlogWritePage.tsx
 * @description 글 작성·수정. 미니멀한 2열 레이아웃. 수정은 작성자만(라우트는 로그인 필요). 제목 50자·참고 URL 200자 제한.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import { LeftSidebar } from "@/widgets";
import { MarkdownPreview } from "@/features/blog";
import { upsertBlogPost, fetchBlogPostBySlug } from "@/entities/blog";
import { useUserStore } from "@/entities/user";
import { excerptFromMarkdown } from "./lib/excerpt";
import { isBlogPostAuthor } from "./lib/postAuthor";
import { Button } from "@/shared/ui";

/** 제목 입력 최대 길이 */
const BLOG_TITLE_MAX_LEN = 50;
/** 참고 링크 URL 최대 길이 */
const BLOG_LINK_URL_MAX_LEN = 200;

export function BlogWritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const { user, isLoading: userLoading } = useUserStore();
  const isEdit = location.pathname.endsWith("/edit");

  const [postId, setPostId] = useState<string | null>(null);
  const [loadedAuthorId, setLoadedAuthorId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isEdit || !slugParam) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await fetchBlogPostBySlug(slugParam);
      if (cancelled) return;
      if (error || !data) {
        setLoadError("글을 불러올 수 없습니다.");
        setLoading(false);
        return;
      }
      setLoadedAuthorId(data.author_id);
      setPostId(data.id);
      /* DB에 더 긴 값이 있으면 입력 규칙에 맞게 잘라 표시 */
      setTitle((data.title ?? "").slice(0, BLOG_TITLE_MAX_LEN));
      setLinkUrl((data.link_url ?? "").slice(0, BLOG_LINK_URL_MAX_LEN));
      setBody(data.content_md);
      if (!isEdit) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, slugParam]);

  useEffect(() => {
    if (!isEdit || loadedAuthorId == null) return;
    if (userLoading) return;
    if (!user) {
      setLoadError("로그인 정보를 확인할 수 없습니다.");
      setLoading(false);
      return;
    }
    if (!isBlogPostAuthor(user, loadedAuthorId)) {
      setLoadError("이 글을 수정할 권한이 없습니다.");
    }
    setLoading(false);
  }, [isEdit, loadedAuthorId, user, userLoading]);

  const handleSave = async (nextStatus: "draft" | "published") => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > BLOG_TITLE_MAX_LEN) {
      alert(`제목은 ${BLOG_TITLE_MAX_LEN}자 이하로 입력해 주세요.`);
      return;
    }
    const trimmedLink = linkUrl.trim();
    if (trimmedLink.length > BLOG_LINK_URL_MAX_LEN) {
      alert(`링크 URL은 ${BLOG_LINK_URL_MAX_LEN}자 이하로 입력해 주세요.`);
      return;
    }
    setSaving(true);
    const excerpt = excerptFromMarkdown(body);
    const { data, error } = await upsertBlogPost({
      id: isEdit ? postId : null,
      title: trimmedTitle,
      link_url: trimmedLink || null,
      excerpt: excerpt || null,
      content_md: body,
      status: nextStatus,
    });
    setSaving(false);
    if (error) {
      alert(error.message || "저장 실패");
      return;
    }
    const row = data as { slug?: string };
    if (row?.slug) {
      navigate(`/blog/${row.slug}`);
    } else {
      navigate("/blog");
    }
  };

  const handleCancel = () => {
    if (window.confirm("작성을 취소하고 목록으로 돌아갈까요? 수정 중인 내용은 저장되지 않습니다.")) {
      navigate("/blog");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800 p-8 text-center text-surface-500 text-sm">
          불러오는 중...
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800 p-8 text-center">
          <p className="text-sm text-surface-600">{loadError}</p>
          <Link to="/blog" className="text-sm text-primary-600 hover:underline mt-4 inline-block">
            목록으로
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800 flex flex-col">
        {/* 헤더 - 우측 정렬 버튼군 */}
        <header className="shrink-0 h-14 sticky top-16 z-30 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-950">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="목록으로"
            >
              <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </button>
            <a 
              href="https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hidden sm:inline-block"
            >
              Markdown 도움말
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm font-medium text-surface-500 hover:text-primary-600 hover:underline px-2"
            >
              {showPreview ? "편집하기" : "미리보기"}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="rounded-full px-5"
            >
              취소
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSave("published")} 
              disabled={saving || !title.trim() || !body.trim()}
              className="rounded-full px-6"
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {showPreview ? (
            /* 미리보기 영역 */
            <div className="p-4 md:p-8 bg-surface-50/30 dark:bg-surface-900/20 overflow-y-auto flex-1">
              <div className="prose prose-surface dark:prose-invert max-w-3xl mx-auto">
                {title && <h1 className="text-2xl md:text-3xl font-medium mb-8">{title}</h1>}
                <MarkdownPreview markdown={body} />
              </div>
            </div>
          ) : (
            /* 에디터 영역 */
            <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full flex-1 flex flex-col">
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  maxLength={BLOG_TITLE_MAX_LEN}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full text-2xl md:text-3xl font-medium bg-transparent border border-surface-100 dark:border-surface-800 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 placeholder:text-surface-300 dark:text-surface-50 p-4 transition-all"
                  aria-describedby="blog-write-title-count"
                />
                <p id="blog-write-title-count" className="text-right text-xs text-surface-400 tabular-nums">
                  {title.length}/{BLOG_TITLE_MAX_LEN}
                </p>
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  value={linkUrl}
                  maxLength={BLOG_LINK_URL_MAX_LEN}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="링크 URL (선택)"
                  className="w-full text-sm bg-transparent border border-surface-100 dark:border-surface-800 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-primary-600 placeholder:text-surface-300 p-3 transition-all"
                  aria-describedby="blog-write-link-count"
                />
                <p id="blog-write-link-count" className="text-right text-xs text-surface-400 tabular-nums">
                  {linkUrl.length}/{BLOG_LINK_URL_MAX_LEN}
                </p>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Markdown으로 내용을 작성하세요..."
                className="w-full flex-1 min-h-[500px] bg-transparent border border-surface-100 dark:border-surface-800 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-[16px] leading-relaxed resize-none font-mono dark:text-surface-200 p-4 transition-all"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
