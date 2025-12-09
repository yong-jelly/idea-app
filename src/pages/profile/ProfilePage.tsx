import { useParams, useNavigate, Link } from "react-router";
import { Calendar, Link as LinkIcon, Github, Twitter, Settings, UserPlus, FileText, Folder, Heart, ArrowLeft, Award } from "lucide-react";
import { useState } from "react";
import { Button, Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore, type User, type Badge as UserBadge, BadgeDisplay, BadgeGrid, BADGE_INFO } from "@/entities/user";
import { usePostStore } from "@/entities/post";
import { ProjectListItem, useProjectStore } from "@/entities/project";
import { ProfileEditModal } from "./ProfileEditModal";
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
} from "@/entities/feed";
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  ExtendedInteractions,
} from "@/entities/feed";

// 더미 배지 데이터
const dummyBadges: UserBadge[] = [
  { id: "b1", type: "early_supporter", name: "얼리 서포터", description: "프로젝트 초기에 서포트", icon: "🌟", rarity: "rare", earnedAt: "2024-02-01T00:00:00Z", projectTitle: "Indie App" },
  { id: "b2", type: "bug_hunter", name: "버그 헌터", description: "10개 이상의 버그 발견", icon: "🐛", rarity: "epic", earnedAt: "2024-05-15T00:00:00Z" },
  { id: "b3", type: "streak_7", name: "7일 연속", description: "7일 연속 출석", icon: "🔥", rarity: "common", earnedAt: "2024-06-01T00:00:00Z", projectTitle: "Dev Tools" },
  { id: "b4", type: "beta_tester", name: "베타 테스터", description: "베타 테스트 참여", icon: "🧪", rarity: "rare", earnedAt: "2024-07-10T00:00:00Z", projectTitle: "Indie App" },
  { id: "b5", type: "top_contributor", name: "탑 기여자", description: "상위 기여자로 선정", icon: "🏆", rarity: "legendary", earnedAt: "2024-08-20T00:00:00Z", projectTitle: "Open Source Kit" },
  { id: "b6", type: "first_feedback", name: "첫 피드백", description: "첫 번째 피드백 작성", icon: "✨", rarity: "common", earnedAt: "2024-01-20T00:00:00Z" },
];

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
    subscribedProjectsCount: 12,
    supportedProjectsCount: 8,
    projectsCount: 5,
    badges: dummyBadges,
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
    subscribedProjectsCount: 5,
    supportedProjectsCount: 3,
    projectsCount: 3,
    badges: dummyBadges.slice(0, 3),
    createdAt: "2024-03-01T00:00:00Z",
  },
};

// Post 타입을 FeedPost 타입으로 변환
function convertToFeedPost(post: ReturnType<typeof usePostStore>["posts"][0]) {
  const interactions: ExtendedInteractions = {
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount,
    bookmarksCount: post.bookmarksCount,
    isLiked: post.isLiked,
    isReposted: post.isReposted,
    isBookmarked: post.isBookmarked,
  };

  const base = {
    id: post.id,
    author: post.author,
    content: post.content,
    images: post.images,
    source: post.source,
    createdAt: post.createdAt,
    interactions,
  };

  switch (post.type) {
    case "text":
      return { ...base, type: "text" as const } satisfies TextPost;
    case "project_update":
      return {
        ...base,
        type: "project_update" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
      } satisfies ProjectUpdatePost;
    case "milestone":
      return {
        ...base,
        type: "milestone" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
        milestoneTitle: post.milestoneTitle!,
      } satisfies MilestoneAchievedPost;
    case "feature_accepted":
      return {
        ...base,
        type: "feature_accepted" as const,
        projectId: post.projectId!,
        projectTitle: post.projectTitle!,
        featureTitle: post.featureTitle!,
      } satisfies FeatureAcceptedPost;
  }
}

type TabType = "posts" | "projects" | "likes" | "badges";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();
  const { posts, toggleLike, toggleRepost, toggleBookmark } = usePostStore();
  const { projects, toggleProjectLike } = useProjectStore();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = currentUser?.username === username;
  
  // 자신의 프로필이면 currentUser 사용, 아니면 demoProfiles에서 가져오기
  const profile = isOwnProfile && currentUser ? currentUser : (username ? demoProfiles[username] : null);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-surface-500">사용자를 찾을 수 없습니다</p>
      </div>
    );
  }

  const userPosts = posts.filter((p) => p.author.username === username);
  const userProjects = projects.filter((p) => p.author.username === username);
  const likedPosts = posts.filter((p) => p.isLiked);

  const handlePostClick = (post: ReturnType<typeof usePostStore>["posts"][0]) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  const renderPost = (post: ReturnType<typeof usePostStore>["posts"][0]) => {
    const feedPost = convertToFeedPost(post);
    const handlers = {
      onLike: () => toggleLike(post.id),
      onRepost: () => toggleRepost(post.id),
      onBookmark: () => toggleBookmark(post.id),
      onComment: () => navigate(`/${post.author.username}/status/${post.id}`),
      onClick: () => handlePostClick(post),
    };

    switch (feedPost.type) {
      case "text":
        return <TextPostRow key={post.id} post={feedPost} {...handlers} />;
      case "project_update":
        return <ProjectUpdateRow key={post.id} post={feedPost} {...handlers} />;
      case "milestone":
        return <MilestoneAchievedRow key={post.id} post={feedPost} {...handlers} />;
      case "feature_accepted":
        return <FeatureAcceptedRow key={post.id} post={feedPost} {...handlers} />;
    }
  };

  const userBadges = profile.badges || [];

  const profileNavItems = [
    { id: "posts" as TabType, label: "포스트", icon: FileText, count: userPosts.length },
    { id: "projects" as TabType, label: "프로젝트", icon: Folder, count: userProjects.length },
    { id: "likes" as TabType, label: "좋아요", icon: Heart, count: likedPosts.length },
    { id: "badges" as TabType, label: "배지", icon: Award, count: userBadges.length },
  ];

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
        <aside className="sticky top-16 w-60 pt-2 pb-6">
          {/* Profile Card */}
          <div className="mx-1 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                src={profile.avatar}
                alt={profile.displayName}
                fallback={profile.displayName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-surface-900 dark:text-surface-50 truncate">
                    {profile.displayName}
                  </p>
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
                    className="uppercase text-[8px] px-1"
                  >
                    {profile.level}
                  </Badge>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Badges Preview */}
            {userBadges.length > 0 && (
              <div className="mb-3">
                <BadgeDisplay 
                  badges={userBadges} 
                  maxDisplay={5} 
                  size="sm"
                  onViewAll={() => setActiveTab("badges")}
                />
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-sm mb-3">
              <span>
                <strong className="text-surface-900 dark:text-surface-50">{profile.subscribedProjectsCount || 0}</strong>
                <span className="text-surface-500 ml-1 text-xs">구독</span>
              </span>
              <span>
                <strong className="text-surface-900 dark:text-surface-50">{profile.supportedProjectsCount || 0}</strong>
                <span className="text-surface-500 ml-1 text-xs">서포트</span>
              </span>
            </div>

            {/* Action Button */}
            {isOwnProfile ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Settings className="mr-1.5 h-4 w-4" />
                프로필 편집
              </Button>
            ) : (
              <Button size="sm" className="w-full text-sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                팔로우
              </Button>
            )}
          </div>

          {/* Profile Navigation */}
          <nav className="flex flex-col gap-0.5">
            {profileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"
                      : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-600 dark:text-primary-400" : "text-surface-400 dark:text-surface-500")} />
                    {item.label}
                  </span>
                  <span className={cn(
                    "text-xs tabular-nums",
                    isActive ? "text-primary-600 dark:text-primary-400" : "text-surface-400"
                  )}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Links */}
          <div className="mt-4 px-3 space-y-1.5 text-xs text-surface-500">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
              >
                <LinkIcon className="h-3 w-3" />
                {profile.website.replace("https://", "")}
              </a>
            )}
            {profile.github && (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
              >
                <Github className="h-3 w-3" />
                {profile.github}
              </a>
            )}
            {profile.twitter && (
              <a
                href={`https://twitter.com/${profile.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-sky-500 transition-colors"
              >
                <Twitter className="h-3 w-3" />
                @{profile.twitter}
              </a>
            )}
            <div className="flex items-center gap-1.5 pt-1">
              <Calendar className="h-3 w-3" />
              {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
              })} 가입
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Sticky Header - 이름 + 탭만 */}
        <div className="sticky top-14 z-10 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="h-[53px] flex items-center gap-3 px-4">
            <Link
              to="/"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {profile.displayName}
              </h1>
              {profile.bio && (
                <p className="text-xs text-surface-500 truncate">
                  {profile.bio.length > 100 ? `${profile.bio.slice(0, 100)}...` : profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex">
            {profileNavItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-surface-900 dark:text-surface-50"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900"
                )}
              >
                {tab.label}
                <div className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full transition-colors",
                  activeTab === tab.id ? "bg-primary-500" : "bg-transparent"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Profile Card - 스크롤됨 */}
        <div className="lg:hidden px-4 py-3 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-start justify-between mb-2">
            <Avatar
              src={profile.avatar}
              alt={profile.displayName}
              fallback={profile.displayName}
              size="lg"
              className="h-14 w-14"
            />
            {isOwnProfile ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                편집
              </Button>
            ) : (
              <Button size="sm" className="rounded-full text-xs">
                팔로우
              </Button>
            )}
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-surface-900 dark:text-surface-50">
                {profile.displayName}
              </h2>
              <Badge
                variant={profile.level === "gold" ? "warning" : "secondary"}
                className="uppercase text-[8px] px-1"
              >
                {profile.level}
              </Badge>
            </div>
            <p className="text-sm text-surface-500">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className="text-sm text-surface-700 dark:text-surface-300 mb-2">{profile.bio}</p>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span>
              <strong>{profile.followingCount}</strong>
              <span className="text-surface-500 ml-1">팔로잉</span>
            </span>
            <span>
              <strong>{profile.followersCount}</strong>
              <span className="text-surface-500 ml-1">팔로워</span>
            </span>
          </div>
        </div>

        {/* Tab Content - 모든 탭을 렌더링하고 CSS로 숨김 처리하여 레이아웃 흔들림 방지 */}
        <div className="min-h-[50vh]">
          {/* 포스트 탭 */}
          <div className={activeTab === "posts" ? "block" : "hidden"}>
            {userPosts.length > 0 ? (
              userPosts.map(renderPost)
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <FileText className="h-10 w-10 text-surface-300 mb-3" />
                <p className="text-surface-500 text-sm">아직 포스트가 없습니다</p>
              </div>
            )}
          </div>

          {/* 프로젝트 탭 */}
          <div className={activeTab === "projects" ? "block" : "hidden"}>
            {userProjects.length > 0 ? (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {userProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    onUpvote={toggleProjectLike}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Folder className="h-10 w-10 text-surface-300 mb-3" />
                <p className="text-surface-500 text-sm">아직 프로젝트가 없습니다</p>
              </div>
            )}
          </div>

          {/* 좋아요 탭 */}
          <div className={activeTab === "likes" ? "block" : "hidden"}>
            {likedPosts.length > 0 ? (
              likedPosts.map(renderPost)
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Heart className="h-10 w-10 text-surface-300 mb-3" />
                <p className="text-surface-500 text-sm">좋아요한 포스트가 없습니다</p>
              </div>
            )}
          </div>

          {/* 배지 탭 */}
          <div className={activeTab === "badges" ? "block" : "hidden"}>
            <div className="p-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
                획득한 배지 ({userBadges.length})
              </h3>
              <BadgeGrid badges={userBadges} emptyMessage="아직 획득한 배지가 없습니다" />
            </div>
          </div>
        </div>
      </main>

      {/* 프로필 편집 모달 */}
      {isOwnProfile && (
        <ProfileEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </div>
  );
}
