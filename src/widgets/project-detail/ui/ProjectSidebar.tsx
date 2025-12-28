import { Link } from "react-router";
import { ExternalLink, Share2, Bookmark, Megaphone, Info } from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import { formatNumber } from "@/shared/lib/utils";
import { UpvoteCard, CATEGORY_INFO, type Project } from "@/entities/project";

interface ProjectSidebarProps {
  project: Project;
  projectId: string;
  onUpvote: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export function ProjectSidebar({
  project,
  projectId,
  onUpvote,
  onBookmark,
  onShare,
}: ProjectSidebarProps) {
  const categoryInfo = CATEGORY_INFO[project.category];

  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* Upvote Card */}
        <UpvoteCard
          rank={Number(projectId) || 1}
          upvoteCount={project.likesCount}
          isUpvoted={project.isLiked}
          onUpvote={onUpvote}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
            <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {formatNumber(project.backersCount)}
            </div>
            <div className="text-[11px] text-surface-500">서포터</div>
          </div>
          <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
            <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {formatNumber(project.commentsCount)}
            </div>
            <div className="text-[11px] text-surface-500">댓글</div>
          </div>
          <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center">
            <div className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {formatNumber(project.likesCount)}
            </div>
            <div className="text-[11px] text-surface-500">저장됨</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onBookmark}
          >
            <Bookmark className="h-4 w-4" />
            저장
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            공유
          </Button>
        </div>

        {/* Community Preview */}
        <div className="rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 overflow-hidden">
          <div className="p-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary-500" />
              <span className="font-semibold text-sm text-surface-900 dark:text-surface-50">
                커뮤니티
              </span>
            </div>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {/* Recent community posts preview */}
            <Link
              to={`/project/${projectId}/community`}
              className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium">
                  공지
                </span>
                <span className="text-xs text-surface-400">1일 전</span>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                🎉 v2.0 베타 테스트 시작!
              </p>
            </Link>
            <Link
              to={`/project/${projectId}/community`}
              className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
                  피드백
                </span>
                <span className="text-xs text-surface-400">2일 전</span>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                다국어 지원 요청 +156 votes
              </p>
            </Link>
            <Link
              to={`/project/${projectId}/community`}
              className="block p-3 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                  업데이트
                </span>
                <span className="text-xs text-surface-400">3일 전</span>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-1">
                v1.5.2 버그 수정 배포 완료
              </p>
            </Link>
          </div>
          <Link
            to={`/project/${projectId}/community`}
            className="block p-3 text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
          >
            커뮤니티 전체보기 →
          </Link>
        </div>

        {/* Project Info - Enhanced */}
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
          <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-500" />
            프로젝트 정보
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-surface-500 dark:text-surface-400">런칭일</span>
              <span className="font-medium text-surface-900 dark:text-surface-50">
                {new Date(project.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500 dark:text-surface-400">카테고리</span>
              <span className="font-medium text-surface-900 dark:text-surface-50">
                {categoryInfo?.icon} {categoryInfo?.name}
              </span>
            </div>
            {/* <div className="flex items-center justify-between">
              <span className="text-surface-500 dark:text-surface-400">마일스톤</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                2/3 완료
              </span>
            </div> */}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between group"
              >
                <span className="text-surface-500 dark:text-surface-400">웹사이트</span>
                <span className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline flex items-center gap-1">
                  방문하기 <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            )}
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between group"
              >
                <span className="text-surface-500 dark:text-surface-400">GitHub</span>
                <span className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline flex items-center gap-1">
                  소스코드 <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}





