import { Link } from "react-router";
import { Rocket, MessageSquare, Trophy, ArrowRight, Flame, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Progress } from "@/shared/ui";
import { formatNumber } from "@/shared/lib/utils";
import { useProjectStore } from "@/entities/project";

// 데모용 커뮤니티 데이터
const hotDiscussions = [
  {
    id: 1,
    title: "React 18의 새로운 기능들에 대해 어떻게 생각하시나요?",
    author: "김리액트",
    replies: 23,
    isHot: true,
  },
  {
    id: 2,
    title: "AI 스타트업 공동창업자를 찾습니다",
    author: "박창업",
    replies: 12,
    isHot: false,
  },
  {
    id: 3,
    title: "Next.js 13 App Router 마이그레이션 경험 공유",
    author: "이넥스트",
    replies: 34,
    isHot: true,
  },
];

const topContributors = [
  { name: "김개발", points: 2450, badge: "🥇" },
  { name: "박프론트", points: 2180, badge: "🥈" },
  { name: "이백엔드", points: 1950, badge: "🥉" },
];

export function RightSidebar() {
  const { projects } = useProjectStore();
  
  // 진행 중인 프로젝트만 필터링하고 상위 3개만 표시
  const activeProjects = projects
    .filter((p) => p.status === "funding")
    .slice(0, 3);

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-[350px] shrink-0 overflow-y-auto pb-6 space-y-5">
      {/* Active Projects */}
      <Card variant="bordered">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary-600" />
              진행 중인 프로젝트
            </span>
            <Link 
              to="/explore" 
              className="text-xs font-normal text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-0.5"
            >
              전체보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {activeProjects.map((project) => {
            const progress = Math.round((project.currentFunding / project.targetFunding) * 100);
            
            return (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block rounded-lg p-3 -mx-1 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border border-surface-100 dark:border-surface-800"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={project.author.avatar}
                    alt={project.author.displayName}
                    fallback={project.title}
                    size="md"
                    className="rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-surface-900 dark:text-surface-50 truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      by {project.author.displayName}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {progress}% 달성
                        </span>
                        <span className="text-surface-400 dark:text-surface-500">
                          D-{project.daysLeft}
                        </span>
                      </div>
                      <Progress value={progress} size="sm" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Hot Discussions */}
      <Card variant="bordered">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent-amber" />
              인기 토론
            </span>
            <Link 
              to="/community" 
              className="text-xs font-normal text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-0.5"
            >
              전체보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-2">
          {hotDiscussions.map((discussion) => (
            <Link
              key={discussion.id}
              to={`/community/discussion/${discussion.id}`}
              className="block rounded-lg p-2.5 -mx-1 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                {discussion.isHot && (
                  <Flame className="h-3.5 w-3.5 text-accent-rose shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 line-clamp-2">
                    {discussion.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-surface-400 dark:text-surface-500">
                    <span>{discussion.author}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {discussion.replies}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card variant="bordered">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent-amber" />
              이번 주 TOP 기여자
            </span>
            <Link 
              to="/community?tab=leaderboard" 
              className="text-xs font-normal text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-0.5"
            >
              전체보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {topContributors.map((contributor, index) => (
              <div
                key={contributor.name}
                className="flex items-center gap-3 rounded-lg p-2 -mx-1 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <span className="text-lg w-6 text-center">{contributor.badge}</span>
                <Avatar
                  fallback={contributor.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                    {contributor.name}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatNumber(contributor.points)}P
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card variant="bordered">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-surface-400 dark:text-surface-500 mb-1">
                <Rocket className="h-3.5 w-3.5" />
                <span className="text-xs">프로젝트</span>
              </div>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {projects.length}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-surface-400 dark:text-surface-500 mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">멤버</span>
              </div>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-50">
                1.2K
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-surface-400 dark:text-surface-500 space-y-2 px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/about" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">소개</Link>
          <Link to="/terms" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">이용약관</Link>
          <Link to="/privacy" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors">개인정보처리방침</Link>
        </div>
        <p>© 2024 IndieStart. All rights reserved.</p>
      </div>
    </aside>
  );
}
