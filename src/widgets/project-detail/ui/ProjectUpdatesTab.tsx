import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Megaphone } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { supabase } from "@/shared/lib/supabase";
import { POST_TYPE_INFO } from "@/pages/project/community/constants";

interface ProjectUpdatesTabProps {
  projectId: string;
}

interface AnnouncementPost {
  id: string;
  title: string;
  createdAt: string;
  authorUsername: string;
  postType: "announcement" | "update" | "vote";
}

const MAX_DISPLAY_COUNT = 10;
const MAX_SHOW_MORE_THRESHOLD = 15;

export function ProjectUpdatesTab({ projectId }: ProjectUpdatesTabProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<AnnouncementPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!projectId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 공지 탭의 모든 타입 조회 (announcement, update, vote)
        const { data, error: fetchError } = await supabase
          .schema("odd")
          .rpc("v1_fetch_community_posts", {
            p_project_id: projectId,
            p_post_type: null, // null이면 모든 타입 조회
            p_limit: MAX_SHOW_MORE_THRESHOLD + 1, // 더 보기 버튼 표시를 위해 1개 더 조회
            p_offset: 0,
          });

        if (fetchError) {
          console.error("공지 조회 실패:", fetchError);
          setError(new Error(fetchError.message));
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setPosts([]);
          setIsLoading(false);
          return;
        }

        // 데이터 변환 (공지 탭의 모든 타입 포함)
        const announcements: AnnouncementPost[] = data.map((row: any) => ({
          id: row.id,
          title: row.title || "",
          createdAt: row.created_at,
          authorUsername: row.author_username || "",
          postType: (row.post_type || "announcement") as "announcement" | "update" | "vote",
        }));

        // 최근 날짜 순으로 정렬 (고정 기능 무시)
        const sortedAnnouncements = announcements.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // 내림차순 (최신순)
        });

        setPosts(sortedAnnouncements);
      } catch (err) {
        console.error("공지 조회 에러:", err);
        setError(err instanceof Error ? err : new Error("알 수 없는 오류"));
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500 dark:text-surface-400">업데이트를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500 dark:text-surface-400">
          업데이트를 불러오는데 실패했습니다
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="h-8 w-8" />}
        title="업데이트가 없습니다"
        description="프로젝트 공지사항이 등록되면 여기에 표시됩니다"
        size="md"
      />
    );
  }

  const displayPosts = posts.slice(0, MAX_DISPLAY_COUNT);
  const hasMore = posts.length > MAX_SHOW_MORE_THRESHOLD;

  const handlePostClick = () => {
    // 프로젝트 커뮤니티 페이지로 이동
    navigate(`/project/${projectId}/community`);
  };

  const handleViewMore = () => {
    // 프로젝트 공지 탭으로 이동
    navigate(`/project/${projectId}/community/devfeed`);
  };

  return (
    <div className="space-y-3">
      {displayPosts.map((post) => {
        const typeInfo = POST_TYPE_INFO[post.postType] || POST_TYPE_INFO.announcement;
        const Icon = typeInfo.icon;

        return (
          <Card key={post.id} className="transition-colors">
            <CardContent className="p-0">
              <div
                className="p-3 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                onClick={handlePostClick}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center h-6 w-6 shrink-0 rounded-md",
                    typeInfo.color
                  )}>
                    <Icon className="h-3 w-3" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm text-surface-900 dark:text-surface-50 line-clamp-1">
                        {post.title}
                      </span>
                      <ChevronRight className="h-3 w-3 text-surface-400 shrink-0" />
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {formatRelativeTime(post.createdAt)}
                    </p>
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
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}

