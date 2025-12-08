import { useParams } from "react-router";
import { Calendar, Link as LinkIcon, MapPin, Github, Twitter, Settings, UserPlus } from "lucide-react";
import { Button, Card, CardContent, Avatar, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Separator } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { useUserStore, type User } from "@/entities/user";
import { PostCard, usePostStore } from "@/entities/post";
import { ProjectCard, useProjectStore } from "@/entities/project";

// 데모용 프로필 데이터
const demoProfiles: Record<string, User> = {
  indie_dev: {
    id: "1",
    username: "indie_dev",
    displayName: "김인디",
    avatar: undefined,
    bio: "풀스택 인디 개발자 🚀 AI와 웹 개발을 좋아합니다. 사이드 프로젝트로 세상을 바꾸고 싶어요.",
    website: "https://indie.dev",
    github: "indie-dev",
    twitter: "indie_dev",
    points: 1250,
    level: "gold",
    followersCount: 156,
    followingCount: 89,
    projectsCount: 5,
    createdAt: "2024-01-15T00:00:00Z",
  },
  frontend_lee: {
    id: "2",
    username: "frontend_lee",
    displayName: "이프론트",
    avatar: undefined,
    bio: "프론트엔드 개발자 | React, TypeScript 전문",
    website: undefined,
    github: "frontend-lee",
    twitter: undefined,
    points: 890,
    level: "silver",
    followersCount: 89,
    followingCount: 45,
    projectsCount: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
};

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useUserStore();
  const { posts, toggleLike, toggleRepost, toggleBookmark } = usePostStore();
  const { projects, toggleProjectLike } = useProjectStore();

  const profile = username ? demoProfiles[username] : null;
  const isOwnProfile = currentUser?.username === username;

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          사용자를 찾을 수 없습니다
        </h1>
      </div>
    );
  }

  const userPosts = posts.filter((p) => p.author.username === username);
  const userProjects = projects.filter((p) => p.author.username === username);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <Avatar
              src={profile.avatar}
              alt={profile.displayName}
              fallback={profile.displayName}
              size="xl"
              className="h-24 w-24"
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {profile.displayName}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline">
                      <Settings className="mr-1 h-4 w-4" />
                      프로필 편집
                    </Button>
                  ) : (
                    <Button>
                      <UserPlus className="mr-1 h-4 w-4" />
                      팔로우
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-3 text-slate-700 dark:text-slate-300">{profile.bio}</p>

              {/* Meta Info */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 md:justify-start">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {profile.website.replace("https://", "")}
                  </a>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <Github className="h-4 w-4" />
                    {profile.github}
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <Twitter className="h-4 w-4" />
                    @{profile.twitter}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                  })}에 가입
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex justify-center gap-6 md:justify-start">
                <div className="text-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {profile.projectsCount}
                  </span>
                  <span className="ml-1 text-slate-500">프로젝트</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {profile.followersCount}
                  </span>
                  <span className="ml-1 text-slate-500">팔로워</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {profile.followingCount}
                  </span>
                  <span className="ml-1 text-slate-500">팔로잉</span>
                </div>
              </div>

              {/* Level & Points */}
              <div className="mt-4 flex items-center justify-center gap-3 md:justify-start">
                <Badge
                  variant={
                    profile.level === "platinum"
                      ? "default"
                      : profile.level === "gold"
                      ? "warning"
                      : profile.level === "silver"
                      ? "secondary"
                      : "outline"
                  }
                  className="uppercase"
                >
                  {profile.level}
                </Badge>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {profile.points.toLocaleString()} P
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="posts" className="flex-1">
            포스트
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex-1">
            프로젝트
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1">
            좋아요
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onBookmark={toggleBookmark}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-slate-500">아직 포스트가 없습니다</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects" className="grid gap-6 md:grid-cols-2">
          {userProjects.length > 0 ? (
            userProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onLike={toggleProjectLike}
              />
            ))
          ) : (
            <Card className="col-span-2 p-12 text-center">
              <p className="text-slate-500">아직 프로젝트가 없습니다</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="likes">
          <Card className="p-12 text-center">
            <p className="text-slate-500">좋아요한 콘텐츠가 없습니다</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

