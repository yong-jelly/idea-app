import { useParams, useNavigate, Link } from "react-router";
import { Calendar, Link as LinkIcon, Github, Twitter, Settings, FileText, Folder, Heart, ArrowLeft, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Button, Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore, BadgeGrid } from "@/entities/user";
import { usePostStore, type Post } from "@/entities/post";
import { ProjectListItem, useProjectStore } from "@/entities/project";
import { ProfileEditModal } from "./ProfileEditModal";
import { SignUpModal } from "@/pages/auth";
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
} from "@/entities/feed";
import { getProfileImageUrl } from "@/shared/lib/storage";

// 분리된 모듈 import
import type { ProfileTabType } from "./profile-page/types";
import { convertToFeedPost } from "./profile-page/lib";
import { demoProfiles } from "./profile-page/mock-data";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useUserStore();
  const { posts, toggleLike, toggleBookmark } = usePostStore();
  const { projects, toggleProjectLike } = useProjectStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const isOwnProfile = currentUser?.username === username;
  
  // 자신의 프로필이면 currentUser 사용, 아니면 demoProfiles에서 가져오기
  const profile = isOwnProfile && currentUser ? currentUser : (username ? demoProfiles[username] : null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!showSignUpModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSignUpModal(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showSignUpModal]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-surface-500">사용자를 찾을 수 없습니다</p>
      </div>
    );
  }

  // 자신의 프로필인데 비회원이면 빈 데이터 반환
  const userPosts = (isOwnProfile && !isAuthenticated) ? [] : posts.filter((p) => p.author.username === username);
  const userProjects = (isOwnProfile && !isAuthenticated) ? [] : projects.filter((p) => p.author.username === username);
  const likedPosts = (isOwnProfile && !isAuthenticated) ? [] : posts.filter((p) => p.isLiked);

  const handlePostClick = (post: Post) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  /**
   * 포스트 렌더링 함수
   */
  const renderPost = (post: Post) => {
    const feedPost = convertToFeedPost(post);
    const handlers = {
      onLike: () => toggleLike(post.id),
      onBookmark: () => toggleBookmark(post.id),
      onComment: () => navigate(`/${post.author.username}/status/${post.id}`),
      onClick: () => handlePostClick(post),
      isAuthenticated,
      onSignUpPrompt: () => setShowSignUpModal(true),
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
    { id: "posts" as ProfileTabType, label: "포스트", icon: FileText, count: userPosts.length },
    { id: "projects" as ProfileTabType, label: "프로젝트", icon: Folder, count: userProjects.length },
    { id: "likes" as ProfileTabType, label: "좋아요", icon: Heart, count: likedPosts.length },
    { id: "badges" as ProfileTabType, label: "배지", icon: Award, count: userBadges.length },
  ];

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
        <aside className="sticky top-16 w-60 pt-2 pb-6">
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

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="mt-5 px-1">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowSignUpModal(true);
                    return;
                  }
                  setIsEditModalOpen(true);
                }}
              >
                <Settings className="h-4 w-4" />
                프로필 편집
              </Button>
            </div>
          )}

          {/* Profile Card */}
          <div className="mt-6 mx-1 rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar ? getProfileImageUrl(profile.avatar, "md") : undefined}
                alt={profile.displayName}
                fallback={profile.displayName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-surface-900 dark:text-surface-50 truncate text-sm">
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
                    className="uppercase text-[8px] px-1 shrink-0"
                  >
                    {profile.level}
                  </Badge>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* 외부 링크 */}
            {(profile.website || profile.github || profile.twitter) && (
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center gap-2">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-500 transition-colors"
                    title={profile.website}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                    title={`GitHub: ${profile.github}`}
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-sky-500 transition-colors"
                    title={`Twitter: @${profile.twitter}`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                <span className="ml-auto text-[10px] text-surface-400 dark:text-surface-500">
                  {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                  })} 가입
                </span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Sticky Header */}
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
              {profile.bio ? (
                <p className="text-xs text-surface-500 truncate">
                  {/* {profile.bio.length > 100 ? `${profile.bio.slice(0, 100)}...` : profile.bio} */}
                  {profile.bio.length > 100 ? `${profile.bio.slice(0, 100)}...` : profile.bio}
                </p>
              ) : isOwnProfile ? (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowSignUpModal(true);
                      return;
                    }
                    setIsEditModalOpen(true);
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                >
                  아직 자기소개 정보가 없습니다. 프로필 편집을 통해 추가해 보세요!
                </button>
              ) : null}
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

        {/* Mobile Profile Card */}
        <div className="lg:hidden px-4 py-3 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-start justify-between mb-2">
            <Avatar
              src={profile.avatar ? getProfileImageUrl(profile.avatar, "lg") : undefined}
              alt={profile.displayName}
              fallback={profile.displayName}
              size="lg"
              className="h-14 w-14"
            />
            <div className="flex items-center gap-2">
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full text-xs"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowSignUpModal(true);
                      return;
                    }
                    setIsEditModalOpen(true);
                  }}
                >
                  편집
                </Button>
              )}
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-surface-900 dark:text-surface-50">
                {profile.displayName}
              </h2>
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
            <p className="text-sm text-surface-500">@{profile.username}</p>
          </div>
          {profile.bio ? (
            <p className="text-sm text-surface-700 dark:text-surface-300 mb-2">{profile.bio}</p>
          ) : isOwnProfile ? (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowSignUpModal(true);
                  return;
                }
                setIsEditModalOpen(true);
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline mb-2 text-center w-full"
            >
              아직 자기소개 정보가 없습니다. 추가해보세요!
            </button>
          ) : null}
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <Calendar className="h-3 w-3" />
            {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
            })} 가입
          </div>
        </div>

        {/* Tab Content */}
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

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}
