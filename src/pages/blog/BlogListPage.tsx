/**
 * @file BlogListPage.tsx
 * @description 블로그 목록. GeekNews 스타일의 미니멀한 정보 위주 리스트.
 */
import { Link } from "react-router";
import { LeftSidebar } from "@/widgets";
import { listBlogPosts } from "@/entities/blog";
import type { BlogPostListItem } from "@/entities/blog";
import { useUserStore } from "@/entities/user";
import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/shared/lib/utils";

export function BlogListPage() {
  const { isAuthenticated } = useUserStore();
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await listBlogPosts({ limit: 50, offset: 0 });
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setPosts([]);
      } else {
        setPosts(data?.posts ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100 dark:border-surface-800">
        {/* 헤더 영역 - 미니멀 */}
        <div className="px-4 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-surface-900 dark:text-surface-50">블로그</h1>
          </div>
          {isAuthenticated ? (
            <Link
              to="/blog/write"
              className="text-sm text-primary-600 hover:underline font-medium cursor-pointer"
            >
              쓰기
            </Link>
          ) : (
            <span className="text-sm text-surface-400 dark:text-surface-500 text-right max-w-[140px]">
              로그인 후 글 작성
            </span>
          )}
        </div>

        {/* 리스트 영역 - GeekNews 스타일 */}
        <div className="divide-y divide-surface-50 dark:divide-surface-900">
          {loading && (
            <p className="text-sm text-surface-500 p-8 text-center">불러오는 중...</p>
          )}
          {!loading && error && (
            <div className="p-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20">
              {error}
            </div>
          )}
          {!loading && !error && posts.length === 0 && (
            <p className="text-sm text-surface-500 p-8 text-center">글이 없습니다.</p>
          )}
          {!loading && !error && posts.map((post, idx) => (
            <div key={post.id} className="px-4 py-3 flex items-start gap-3 group">
              <span className="text-surface-400 text-sm w-4 text-right mt-0.5 shrink-0">
                {idx + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="text-[15px] font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 leading-snug"
                  >
                    {post.title}
                  </Link>
                  {post.link_url && (
                    <a 
                      href={post.link_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[12px] text-surface-400 hover:text-primary-500 hover:underline truncate max-w-[200px]"
                    >
                      ({(() => {
                        try {
                          return new URL(post.link_url).hostname;
                        } catch {
                          return post.link_url;
                        }
                      })()})
                    </a>
                  )}
                </div>
                {post.excerpt && (
                  <p className="mt-0.5 text-[13px] text-surface-600 dark:text-surface-400 truncate">
                    {post.excerpt}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-surface-500 dark:text-surface-400">
                  <span className="font-medium text-surface-700 dark:text-surface-300">
                    {post.author_display_name}
                  </span>
                  <span className="opacity-40">|</span>
                  <span>
                    {post.published_at
                      ? formatRelativeTime(post.published_at)
                      : formatRelativeTime(post.created_at)}
                  </span>
                  <span className="opacity-40">|</span>
                  <Link to={`/blog/${post.slug}`} className="hover:underline">
                    댓글 {post.comments_count}개
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
