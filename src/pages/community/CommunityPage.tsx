import { useState } from "react";
import { MessageSquare, Calendar, Trophy, TrendingUp, Plus, Search, Users } from "lucide-react";
import { Input, Select, Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui";
import { LeftSidebar } from "@/widgets";

// 데모 데이터
const forumCategories = [
  { id: "general", name: "일반 토론", count: 234, description: "개발 관련 자유 토론" },
  { id: "tips", name: "개발 팁", count: 156, description: "유용한 개발 팁 공유" },
  { id: "collaboration", name: "협업 모집", count: 89, description: "프로젝트 협업 파트너 모집" },
  { id: "qa", name: "기술 Q&A", count: 345, description: "기술적 질문과 답변" },
  { id: "feedback", name: "피드백 요청", count: 123, description: "프로젝트 피드백 요청" },
];

const recentPosts = [
  {
    id: 1,
    title: "React 18의 새로운 기능들에 대해 어떻게 생각하시나요?",
    author: "김리액트",
    category: "tips",
    replies: 23,
    views: 456,
    timeAgo: "2시간 전",
    isHot: true,
  },
  {
    id: 2,
    title: "AI 스타트업 공동창업자를 찾습니다",
    author: "박창업",
    category: "collaboration",
    replies: 12,
    views: 234,
    timeAgo: "4시간 전",
    isHot: false,
  },
  {
    id: 3,
    title: "Next.js 13 App Router 마이그레이션 경험 공유",
    author: "이넥스트",
    category: "tips",
    replies: 34,
    views: 789,
    timeAgo: "6시간 전",
    isHot: true,
  },
];

const leaderboard = [
  { rank: 1, name: "김개발", points: 2450, badge: "🥇", contributions: "프로젝트 15개 후원, 댓글 89개" },
  { rank: 2, name: "박프론트", points: 2180, badge: "🥈", contributions: "프로젝트 12개 후원, 댓글 67개" },
  { rank: 3, name: "이백엔드", points: 1950, badge: "🥉", contributions: "프로젝트 10개 후원, 댓글 54개" },
  { rank: 4, name: "최풀스택", points: 1720, badge: "🏅", contributions: "프로젝트 8개 후원, 댓글 43개" },
  { rank: 5, name: "정디자인", points: 1580, badge: "🏅", contributions: "프로젝트 7개 후원, 댓글 38개" },
];

export function CommunityPage() {
  const [activeTab, setActiveTab] = useState("forum");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      {/* Left Sidebar */}
      <div className="hidden lg:block">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">커뮤니티</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            개발자들과 소통하고 지식을 공유하며 함께 성장해보세요
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="forum" className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4" />
              토론 포럼
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 gap-2">
              <Calendar className="h-4 w-4" />
              이벤트
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 gap-2">
              <Trophy className="h-4 w-4" />
              리더보드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="space-y-6">
            {/* Search & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="토론 주제 검색..."
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                새 글 작성
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {/* Categories */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">카테고리</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {forumCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div>
                        <div className="text-sm font-medium">{category.name}</div>
                        <div className="text-xs text-slate-500">{category.description}</div>
                      </div>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Posts */}
              <div className="space-y-4 lg:col-span-3">
                {recentPosts.map((post) => (
                  <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {post.isHot && (
                              <Badge variant="destructive" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                HOT
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {forumCategories.find((c) => c.id === post.category)?.name}
                            </Badge>
                          </div>
                          <h3 className="font-medium hover:text-primary-600">{post.title}</h3>
                          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Avatar size="xs" fallback={post.author} />
                              <span>{post.author}</span>
                            </div>
                            <span>{post.timeAgo}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.replies}
                          </div>
                          <div className="mt-1">조회 {post.views}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                다가오는 이벤트
              </h3>
              <p className="mt-1 text-slate-500">아직 등록된 이벤트가 없습니다</p>
              <Button className="mt-4">
                <Plus className="mr-1 h-4 w-4" />
                이벤트 등록
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  커뮤니티 리더보드
                </CardTitle>
                <CardDescription>이번 달 가장 활발한 커뮤니티 멤버들입니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaderboard.map((member) => (
                  <div
                    key={member.rank}
                    className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <div className="text-2xl">{member.badge}</div>
                    <Avatar size="md" fallback={member.name} />
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-slate-500">{member.contributions}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{member.points.toLocaleString()}P</div>
                      <div className="text-sm text-slate-500">#{member.rank}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

