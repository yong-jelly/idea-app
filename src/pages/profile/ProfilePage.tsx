import { useParams, useNavigate } from "react-router";
import { Link as LinkIcon, Github, Twitter, FileText, Folder, Heart, Award, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { useUserStore, BadgeGrid, fetchUserProfile } from "@/entities/user";
import { ProjectList, useProjectStore, fetchUserProjects } from "@/entities/project";
import { fetchUserPostsFeed, fetchUserLikedPostsFeed, togglePostLike, togglePostBookmark, type UnifiedFeedResponse } from "@/entities/post/api/post.api";
import { ProfileEditModal } from "./ProfileEditModal";
import { SignUpModal } from "@/pages/auth";
import { LeftSidebar } from "@/widgets";
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
  ProjectCreatedRow,
  AnnouncementRow,
  FeedbackRow,
} from "@/entities/feed";
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  ProjectCreatedPost,
  AnnouncementPost,
  FeedbackPostExtended,
  UnifiedFeedPost,
} from "@/entities/feed";
import { getProfileImageUrl } from "@/shared/lib/storage";
import { convertToUnifiedFeedPost } from "@/widgets/feed-timeline";
import { Skeleton } from "@/shared/ui";
import type { ProfileTabType } from "./profile-page/types";

function FeedSkeleton() {
  return (
    <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useUserStore();
  const { toggleProjectLike } = useProjectStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  
  // 프로필 정보
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // 포스트 탭
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [offsetPosts, setOffsetPosts] = useState(0);
  const loadMorePostsRef = useRef<HTMLDivElement>(null);
  const [isIntersectingPosts, setIsIntersectingPosts] = useState(false);
  
  // 프로젝트 탭
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const [offsetProjects, setOffsetProjects] = useState(0);
  
  // 좋아요 탭
  const [likedPosts, setLikedPosts] = useState<UnifiedFeedPost[]>([]);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState(true);
  const [hasMoreLikedPosts, setHasMoreLikedPosts] = useState(true);
  const [offsetLikedPosts, setOffsetLikedPosts] = useState(0);
  const loadMoreLikedPostsRef = useRef<HTMLDivElement>(null);
  const [isIntersectingLikedPosts, setIsIntersectingLikedPosts] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  // 프로필 정보 로드
  useEffect(() => {
    if (!username) return;
    
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      const { user, error } = await fetchUserProfile(username);
      
      if (error) {
        console.error("프로필 로드 에러:", error);
        setIsLoadingProfile(false);
        return;
      }
      
      setProfile(user);
      setIsLoadingProfile(false);
    };
    
    loadProfile();
  }, [username]);

  // 포스트 탭 로드
  useEffect(() => {
    if (!username || activeTab !== "posts") return;
    
    const loadPosts = async () => {
      setIsLoadingPosts(true);
      const { data, error } = await fetchUserPostsFeed(username, { limit: 50, offset: 0 });
      
      if (error) {
        console.error("포스트 피드 로드 에러:", error);
        setIsLoadingPosts(false);
        return;
      }

      if (data) {
        const convertedPosts = data.map(convertToUnifiedFeedPost);
        setPosts(convertedPosts);
        setOffsetPosts(50);
        setHasMorePosts(data.length === 50);
      }
      
      setIsLoadingPosts(false);
    };
    
    loadPosts();
  }, [username, activeTab]);

  // 프로젝트 탭 로드
  useEffect(() => {
    if (!username || activeTab !== "projects") return;
    
    const loadProjects = async () => {
      setIsLoadingProjects(true);
      const { projects: userProjects, error } = await fetchUserProjects(username, { limit: 50, offset: 0 });
      
      if (error) {
        console.error("프로젝트 로드 에러:", error);
        setIsLoadingProjects(false);
        return;
      }

      setProjects(userProjects);
      setOffsetProjects(50);
      setHasMoreProjects(userProjects.length === 50);
      setIsLoadingProjects(false);
    };
    
    loadProjects();
  }, [username, activeTab]);

  // 좋아요 탭 로드
  useEffect(() => {
    if (!username || activeTab !== "likes") return;
    
    const loadLikedPosts = async () => {
      setIsLoadingLikedPosts(true);
      const { data, error } = await fetchUserLikedPostsFeed(username, { limit: 50, offset: 0 });
      
      if (error) {
        console.error("좋아요 포스트 피드 로드 에러:", error);
        setIsLoadingLikedPosts(false);
        return;
      }

      if (data) {
        const convertedPosts = data.map(convertToUnifiedFeedPost);
        setLikedPosts(convertedPosts);
        setOffsetLikedPosts(50);
        setHasMoreLikedPosts(data.length === 50);
      }
      
      setIsLoadingLikedPosts(false);
    };
    
    loadLikedPosts();
  }, [username, activeTab]);

  // 포스트 더 보기
  const loadMorePosts = async () => {
    if (!username || isLoadingPosts || !hasMorePosts) return;
    
    setIsLoadingPosts(true);
    const { data, error } = await fetchUserPostsFeed(username, { limit: 50, offset: offsetPosts });
    
    if (error) {
      console.error("포스트 추가 로드 에러:", error);
      setIsLoadingPosts(false);
      return;
    }

    if (data && data.length > 0) {
      const convertedPosts = data.map(convertToUnifiedFeedPost);
      setPosts((prev) => [...prev, ...convertedPosts]);
      setOffsetPosts((prev) => prev + data.length);
      setHasMorePosts(data.length === 50);
    } else {
      setHasMorePosts(false);
    }
    
    setIsLoadingPosts(false);
  };

  // 프로젝트 더 보기
  const loadMoreProjects = async () => {
    if (!username || isLoadingProjects || !hasMoreProjects) return;
    
    setIsLoadingProjects(true);
    const { projects: moreProjects, error } = await fetchUserProjects(username, { limit: 50, offset: offsetProjects });
    
    if (error) {
      console.error("프로젝트 추가 로드 에러:", error);
      setIsLoadingProjects(false);
      return;
    }

    setProjects((prev) => [...prev, ...moreProjects]);
    setHasMoreProjects(moreProjects.length === 50);
    setOffsetProjects((prev) => prev + moreProjects.length);
    setIsLoadingProjects(false);
  };

  // 좋아요 포스트 더 보기
  const loadMoreLikedPosts = async () => {
    if (!username || isLoadingLikedPosts || !hasMoreLikedPosts) return;
    
    setIsLoadingLikedPosts(true);
    const { data, error } = await fetchUserLikedPostsFeed(username, { limit: 50, offset: offsetLikedPosts });
    
    if (error) {
      console.error("좋아요 포스트 추가 로드 에러:", error);
      setIsLoadingLikedPosts(false);
      return;
    }

    if (data && data.length > 0) {
      const convertedPosts = data.map(convertToUnifiedFeedPost);
      setLikedPosts((prev) => [...prev, ...convertedPosts]);
      setOffsetLikedPosts((prev) => prev + data.length);
      setHasMoreLikedPosts(data.length === 50);
    } else {
      setHasMoreLikedPosts(false);
    }
    
    setIsLoadingLikedPosts(false);
  };

  // IntersectionObserver for 포스트
  useEffect(() => {
    const element = loadMorePostsRef.current;
    if (!element || activeTab !== "posts") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersectingPosts(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab]);

  const handleLoadMorePosts = useCallback(() => {
    if (isIntersectingPosts && hasMorePosts && !isLoadingPosts) {
      loadMorePosts();
    }
  }, [isIntersectingPosts, hasMorePosts, isLoadingPosts]);

  useEffect(() => {
    if (activeTab === "posts") {
      handleLoadMorePosts();
    }
  }, [handleLoadMorePosts, activeTab]);

  // IntersectionObserver for 좋아요 포스트
  useEffect(() => {
    const element = loadMoreLikedPostsRef.current;
    if (!element || activeTab !== "likes") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersectingLikedPosts(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab]);

  const handleLoadMoreLikedPosts = useCallback(() => {
    if (isIntersectingLikedPosts && hasMoreLikedPosts && !isLoadingLikedPosts) {
      loadMoreLikedPosts();
    }
  }, [isIntersectingLikedPosts, hasMoreLikedPosts, isLoadingLikedPosts]);

  useEffect(() => {
    if (activeTab === "likes") {
      handleLoadMoreLikedPosts();
    }
  }, [handleLoadMoreLikedPosts, activeTab]);

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

  const handlePostClick = (post: UnifiedFeedPost) => {
    navigate(`/${post.author.username}/status/${post.id}`);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }

    const post = posts.find((p) => p.id === postId) || likedPosts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsLiked = post.interactions.isLiked;
    const previousLikesCount = post.interactions.likesCount;

    const updatePosts = (prev: UnifiedFeedPost[]) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              interactions: {
                ...p.interactions,
                isLiked: !previousIsLiked,
                likesCount: previousIsLiked
                  ? previousLikesCount - 1
                  : previousLikesCount + 1,
              },
            }
          : p
      );

    setPosts(updatePosts);
    setLikedPosts(updatePosts);

    try {
      const { data, error } = await togglePostLike(postId);

      if (error) {
        console.error("좋아요 토글 실패:", error);
        const rollback = (prev: UnifiedFeedPost[]) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isLiked: previousIsLiked,
                    likesCount: previousLikesCount,
                  },
                }
              : p
          );
        setPosts(rollback);
        setLikedPosts(rollback);
        return;
      }

      if (data) {
        const updateWithData = (prev: UnifiedFeedPost[]) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isLiked: data.is_liked,
                    likesCount: data.likes_count,
                  },
                }
              : p
          );
        setPosts(updateWithData);
        setLikedPosts(updateWithData);
      }
    } catch (err) {
      console.error("좋아요 토글 예외:", err);
      const rollback = (prev: UnifiedFeedPost[]) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                interactions: {
                  ...p.interactions,
                  isLiked: previousIsLiked,
                  likesCount: previousLikesCount,
                },
              }
            : p
        );
      setPosts(rollback);
      setLikedPosts(rollback);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!isAuthenticated) {
      setShowSignUpModal(true);
      return;
    }

    const post = posts.find((p) => p.id === postId) || likedPosts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsBookmarked = post.interactions.isBookmarked;
    const previousBookmarksCount = post.interactions.bookmarksCount;

    const updatePosts = (prev: UnifiedFeedPost[]) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              interactions: {
                ...p.interactions,
                isBookmarked: !previousIsBookmarked,
                bookmarksCount: previousIsBookmarked
                  ? previousBookmarksCount - 1
                  : previousBookmarksCount + 1,
              },
            }
          : p
      );

    setPosts(updatePosts);
    setLikedPosts(updatePosts);

    try {
      const { data, error } = await togglePostBookmark(postId);

      if (error) {
        console.error("북마크 토글 실패:", error);
        const rollback = (prev: UnifiedFeedPost[]) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isBookmarked: previousIsBookmarked,
                    bookmarksCount: previousBookmarksCount,
                  },
                }
              : p
          );
        setPosts(rollback);
        setLikedPosts(rollback);
        return;
      }

      if (data) {
        const updateWithData = (prev: UnifiedFeedPost[]) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  interactions: {
                    ...p.interactions,
                    isBookmarked: data.is_bookmarked,
                    bookmarksCount: data.bookmarks_count,
                  },
                }
              : p
          );
        setPosts(updateWithData);
        setLikedPosts(updateWithData);
      }
    } catch (err) {
      console.error("북마크 토글 예외:", err);
      const rollback = (prev: UnifiedFeedPost[]) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                interactions: {
                  ...p.interactions,
                  isBookmarked: previousIsBookmarked,
                  bookmarksCount: previousBookmarksCount,
                },
              }
            : p
        );
      setPosts(rollback);
      setLikedPosts(rollback);
    }
  };

  const renderPost = (post: UnifiedFeedPost) => {
    const handlers = {
      onLike: () => handleLike(post.id),
      onBookmark: () => handleBookmark(post.id),
      onComment: () => navigate(`/${post.author.username}/status/${post.id}`),
      onClick: () => handlePostClick(post),
      isAuthenticated,
      onSignUpPrompt: () => setShowSignUpModal(true),
    };

    switch (post.type) {
      case "text":
        return <TextPostRow key={post.id} post={post} {...handlers} />;
      case "project_update":
        return <ProjectUpdateRow key={post.id} post={post} {...handlers} />;
      case "milestone":
        return <MilestoneAchievedRow key={post.id} post={post} {...handlers} />;
      case "feature_accepted":
        return <FeatureAcceptedRow key={post.id} post={post} {...handlers} />;
      case "project_created":
        return <ProjectCreatedRow key={post.id} post={post} {...handlers} />;
      case "announcement":
      case "update":
      case "vote":
        return <AnnouncementRow key={post.id} post={post} {...handlers} />;
      case "bug":
      case "feature":
      case "improvement":
      case "question":
        return <FeedbackRow key={post.id} feedback={post} {...handlers} />;
      default:
        return null;
    }
  };

  const profileNavItems = [
    { id: "posts" as ProfileTabType, label: "포스트", icon: FileText },
    { id: "projects" as ProfileTabType, label: "프로젝트", icon: Folder },
    { id: "likes" as ProfileTabType, label: "좋아요", icon: Heart },
    { id: "badges" as ProfileTabType, label: "배지", icon: Award },
  ];

  if (isLoadingProfile) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-5xl items-start">
        <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
          <LeftSidebar />
        </div>
        <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-lg text-surface-500">사용자를 찾을 수 없습니다</p>
          </div>
        </main>
      </div>
    );
  }

  const userBadges = profile.badges || [];

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Sticky Header */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
          {/* Profile Header */}
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

          {/* Tabs */}
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
            {isLoadingPosts && posts.length === 0 ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                  <FileText className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
                  아직 포스트가 없습니다
                </h3>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  첫 번째 포스트를 작성해보세요
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
                  {posts.map(renderPost)}
                </div>
                {hasMorePosts && (
                  <div ref={loadMorePostsRef} className="py-4 text-center">
                    {isLoadingPosts && (
                      <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600 dark:border-surface-600 dark:border-t-primary-400" />
                        <span className="text-sm">로딩 중...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 프로젝트 탭 */}
          <div className={activeTab === "projects" ? "block" : "hidden"}>
            <ProjectList
              projects={projects}
              isLoading={isLoadingProjects && projects.length === 0}
              error={null}
              emptyState={
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                    <Folder className="h-8 w-8 text-surface-400" />
                  </div>
                  <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
                    아직 프로젝트가 없습니다
                  </h3>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    첫 번째 프로젝트를 등록해보세요
                  </p>
                </div>
              }
              onUpvote={(projectId) => toggleProjectLike(projectId)}
              showRank={false}
              hasMore={hasMoreProjects}
              onLoadMore={loadMoreProjects}
              isLoadingMore={isLoadingProjects && projects.length > 0}
            />
          </div>

          {/* 좋아요 탭 */}
          <div className={activeTab === "likes" ? "block" : "hidden"}>
            {isLoadingLikedPosts && likedPosts.length === 0 ? (
              <FeedSkeleton />
            ) : likedPosts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                  <Heart className="h-8 w-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
                  좋아요한 포스트가 없습니다
                </h3>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  마음에 드는 포스트에 좋아요를 눌러보세요
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
                  {likedPosts.map(renderPost)}
                </div>
                {hasMoreLikedPosts && (
                  <div ref={loadMoreLikedPostsRef} className="py-4 text-center">
                    {isLoadingLikedPosts && (
                      <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600 dark:border-surface-600 dark:border-t-primary-400" />
                        <span className="text-sm">로딩 중...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
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
