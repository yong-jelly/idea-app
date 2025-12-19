import { useParams, useNavigate, Link } from "react-router";
import { Link as LinkIcon, Github, Twitter, FileText, Folder, Heart, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Button, Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore, BadgeGrid } from "@/entities/user";
import { usePostStore, type Post } from "@/entities/post";
import { ProjectListItem, useProjectStore } from "@/entities/project";
import { ProfileEditModal } from "./ProfileEditModal";
import { SignUpModal } from "@/pages/auth";
import { LeftSidebar } from "@/widgets";
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
      {/* Left Sidebar - Desktop Only (피드와 동일) */}
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar onProfileEditClick={() => {
          if (!isAuthenticated) {
            setShowSignUpModal(true);
            return;
          }
          setIsEditModalOpen(true);
        }} />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Sticky Header */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
          {/* Profile Header - 데스크톱과 모바일 모두 표시 */}
          <div className="px-4 py-4 border-b border-surface-100 dark:border-surface-800/50">
            <div className="flex items-start gap-3 lg:gap-4">
              <Avatar
                src={profile.avatar ? getProfileImageUrl(profile.avatar, "lg") : undefined}
                alt={profile.displayName}
                fallback={profile.displayName}
                size="lg"
                className="h-14 w-14 lg:h-16 lg:w-16 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg lg:text-xl font-semibold text-surface-900 dark:text-white">
                    {profile.displayName}
                  </h1>
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
                    className="uppercase text-[9px] px-1.5 py-0.5"
                  >
                    {profile.level}
                  </Badge>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                  @{profile.username}
                </p>
                {profile.bio ? (
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {profile.bio}
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
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                  >
                    자기소개를 추가해보세요
                  </button>
                ) : null}
                
                {/* 외부 링크 */}
                {(profile.website || profile.github || profile.twitter) && (
                  <div className="flex items-center gap-3 mt-3">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
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
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
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
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-sky-500 transition-colors"
                        title={`Twitter: @${profile.twitter}`}
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    <span className="ml-auto text-xs text-surface-400 dark:text-surface-500">
                      {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                      })} 가입
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs - FeedPage와 동일한 스타일 */}
          <div className="flex items-center px-1">
            {profileNavItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 h-14 text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "text-surface-900 dark:text-white"
                      : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="text-xs text-surface-400 dark:text-surface-500">
                        {tab.count}
                      </span>
                    )}
                  </span>
                  
                  {/* 활성 탭 배경 효과 */}
                  {activeTab === tab.id && (
                    <span className="absolute inset-x-2 inset-y-2 rounded-xl bg-surface-100/70 dark:bg-surface-800/50 -z-0 transition-all" />
                  )}
                  
                  {/* 하단 인디케이터 */}
                  <span
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary-500 transition-all duration-300",
                      activeTab === tab.id ? "w-8 opacity-100" : "w-0 opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>


        {/* Tab Content */}
        <div className="min-h-[50vh]">
          {/* 포스트 탭 */}
          <div className={activeTab === "posts" ? "block" : "hidden"}>
            {userPosts.length > 0 ? (
              userPosts.map(renderPost)
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                  <FileText className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  아직 포스트가 없습니다
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
                  첫 번째 포스트를 작성해보세요
                </p>
              </div>
            )}
          </div>

          {/* 프로젝트 탭 */}
          <div className={activeTab === "projects" ? "block" : "hidden"}>
            {userProjects.length > 0 ? (
              <div className="divide-y divide-surface-100/80 dark:divide-surface-800/50">
                {userProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    onUpvote={toggleProjectLike}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                  <Folder className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  아직 프로젝트가 없습니다
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
                  첫 번째 프로젝트를 등록해보세요
                </p>
              </div>
            )}
          </div>

          {/* 좋아요 탭 */}
          <div className={activeTab === "likes" ? "block" : "hidden"}>
            {likedPosts.length > 0 ? (
              likedPosts.map(renderPost)
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                  <Heart className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  좋아요한 포스트가 없습니다
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
                  마음에 드는 포스트에 좋아요를 눌러보세요
                </p>
              </div>
            )}
          </div>

          {/* 배지 탭 */}
          <div className={activeTab === "badges" ? "block" : "hidden"}>
            {userBadges.length > 0 ? (
              <div className="p-6">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-6 text-lg">
                  획득한 배지 ({userBadges.length})
                </h3>
                <BadgeGrid badges={userBadges} emptyMessage="아직 획득한 배지가 없습니다" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                  <Award className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  아직 획득한 배지가 없습니다
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
                  활동을 통해 배지를 획득해보세요
                </p>
              </div>
            )}
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
