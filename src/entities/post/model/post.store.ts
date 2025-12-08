import { create } from "zustand";
import type { FeedState, Post } from "./post.types";

// 데모용 포스트 데이터 - 모든 피드 타입 + 다양한 출처 포함
const demoPosts: Post[] = [
  // 1. 일반 텍스트 (메인 피드 직접 작성 - source 없음)
  {
    id: "1",
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    type: "text",
    content: "오늘 드디어 AI 코드 리뷰 도구의 베타 버전을 완성했습니다! 🎉\n\n정말 긴 여정이었지만, 커뮤니티의 응원 덕분에 여기까지 올 수 있었어요.\n\n곧 테스터 모집을 시작할 예정이니 많은 관심 부탁드립니다.",
    images: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
    ],
    likesCount: 156,
    repostsCount: 23,
    commentsCount: 45,
    bookmarksCount: 67,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  // 2. 프로젝트에서 작성된 글 (내가 참여 중)
  {
    id: "2",
    author: {
      id: "2",
      username: "frontend_lee",
      displayName: "이프론트",
      avatar: undefined,
    },
    type: "milestone",
    content: "실시간 협업 화이트보드 프로젝트가 첫 번째 마일스톤을 달성했습니다!\n\n기본 캔버스 기능과 실시간 동기화가 완성되었어요. 다음은 도형 라이브러리 추가입니다.",
    projectId: "2",
    projectTitle: "실시간 협업 화이트보드",
    milestoneTitle: "MVP 기능 완성",
    source: {
      type: "project",
      id: "2",
      name: "실시간 협업 화이트보드",
      emoji: "🎨",
      isJoined: true,
    },
    likesCount: 89,
    repostsCount: 12,
    commentsCount: 28,
    bookmarksCount: 34,
    isLiked: true,
    isReposted: false,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  // 3. 프로젝트 커뮤니티에서 작성된 글 (내가 참여 중)
  {
    id: "3",
    author: {
      id: "3",
      username: "game_park",
      displayName: "박게임",
      avatar: undefined,
    },
    type: "feature_accepted",
    content: "커뮤니티에서 요청해주신 '오프라인 모드' 기능을 추가하기로 결정했습니다!\n\n다음 업데이트에서 만나보실 수 있어요. 투표해주신 모든 분들께 감사드립니다 🙏",
    projectId: "3",
    projectTitle: "모바일 퍼즐 게임",
    featureTitle: "오프라인 모드 지원",
    source: {
      type: "community",
      id: "3",
      name: "PIXEL PUZZLE",
      emoji: "🎮",
      isJoined: true,
    },
    likesCount: 234,
    repostsCount: 45,
    commentsCount: 67,
    bookmarksCount: 89,
    isLiked: false,
    isReposted: true,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  // 4. 프로젝트 업데이트 (내가 구독 중)
  {
    id: "4",
    author: {
      id: "4",
      username: "backend_kim",
      displayName: "김백엔드",
      avatar: undefined,
    },
    type: "project_update",
    content: "오픈소스 API 게이트웨이 v2.0을 릴리즈했습니다! 🚀\n\n주요 변경사항:\n• 성능 50% 개선\n• 새로운 인증 플러그인\n• 향상된 로깅 시스템\n\nGitHub에서 확인해주세요!",
    projectId: "4",
    projectTitle: "오픈소스 API 게이트웨이",
    source: {
      type: "subscribed",
      id: "4",
      name: "오픈소스 API 게이트웨이",
      emoji: "🔌",
      isJoined: true,
    },
    likesCount: 178,
    repostsCount: 34,
    commentsCount: 23,
    bookmarksCount: 56,
    isLiked: true,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  // 5. 팔로잉 중인 유저의 글 (기본 형태)
  {
    id: "5",
    author: {
      id: "5",
      username: "ui_designer",
      displayName: "최디자인",
      avatar: undefined,
    },
    type: "text",
    content: "새로운 디자인 시스템 컴포넌트들을 만들어봤습니다.\n미니멀하면서도 일관성 있는 디자인을 목표로 했어요!",
    images: [
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=400&fit=crop",
    ],
    source: {
      type: "following",
      isJoined: false, // 팔로잉은 isJoined 체크 안함
    },
    likesCount: 312,
    repostsCount: 78,
    commentsCount: 156,
    bookmarksCount: 45,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  // 6. 일반 텍스트 (메인 피드)
  {
    id: "6",
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    type: "text",
    content: "바이브 코딩 시대가 정말 온 것 같아요.\n\nAI 덕분에 예전에는 몇 주 걸릴 작업이 하루 만에 끝나기도 하고... 인디 개발자로서 정말 흥분되는 시기입니다!\n\n여러분은 어떻게 생각하세요?",
    likesCount: 412,
    repostsCount: 98,
    commentsCount: 186,
    bookmarksCount: 65,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  // 7. 프로젝트에서 작성된 마일스톤 (참여 안함)
  {
    id: "7",
    author: {
      id: "6",
      username: "startup_ceo",
      displayName: "정스타트업",
      avatar: undefined,
    },
    type: "milestone",
    content: "드디어 시드 펀딩 1억원을 달성했습니다! 🎊\n\n여러분의 응원과 피드백이 큰 힘이 되었습니다. 이제 본격적으로 팀 빌딩을 시작합니다.",
    projectId: "6",
    projectTitle: "AI 번역 플랫폼",
    milestoneTitle: "시드 펀딩 완료",
    source: {
      type: "project",
      id: "6",
      name: "AI 번역 플랫폼",
      emoji: "🌐",
      isJoined: false,
    },
    likesCount: 567,
    repostsCount: 123,
    commentsCount: 89,
    bookmarksCount: 234,
    isLiked: true,
    isReposted: true,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  // 8. 커뮤니티 글 (참여 안함)
  {
    id: "8",
    author: {
      id: "7",
      username: "mobile_dev",
      displayName: "모바일개발자",
      avatar: undefined,
    },
    type: "project_update",
    content: "iOS 앱 v3.0 업데이트 소식!\n\n새로운 위젯과 다크모드가 추가되었습니다. App Store에서 지금 바로 업데이트하세요.",
    images: [
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop",
    ],
    projectId: "7",
    projectTitle: "생산성 앱",
    source: {
      type: "community",
      id: "7",
      name: "생산성 앱",
      isJoined: false,
    },
    likesCount: 234,
    repostsCount: 45,
    commentsCount: 67,
    bookmarksCount: 89,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  // 9. 기능 수락 (구독 중)
  {
    id: "9",
    author: {
      id: "8",
      username: "saas_founder",
      displayName: "SaaS창업자",
      avatar: undefined,
    },
    type: "feature_accepted",
    content: "API 연동 기능 요청이 정말 많았는데요, 드디어 개발을 시작합니다!\n\nZapier, Make 등과 연동할 수 있게 될 예정이에요.",
    projectId: "8",
    projectTitle: "노코드 빌더",
    featureTitle: "API 연동 지원",
    source: {
      type: "subscribed",
      id: "8",
      name: "노코드 빌더",
      emoji: "🧩",
      isJoined: true,
    },
    likesCount: 189,
    repostsCount: 34,
    commentsCount: 56,
    bookmarksCount: 78,
    isLiked: false,
    isReposted: false,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  // 10. 일반 텍스트 (이미지 2장) - 메인 피드
  {
    id: "10",
    author: {
      id: "9",
      username: "tech_writer",
      displayName: "기술작가",
      avatar: undefined,
    },
    type: "text",
    content: "오늘 작업한 인포그래픽 공유합니다.\n\n2024년 인디 개발 트렌드를 정리해봤어요. 피드백 환영합니다! 📊",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
    ],
    likesCount: 145,
    repostsCount: 67,
    commentsCount: 23,
    bookmarksCount: 89,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  // 11. 프로젝트 커뮤니티 글 (참여 중) - 일반 텍스트
  {
    id: "11",
    author: {
      id: "10",
      username: "dev_mentor",
      displayName: "개발멘토",
      avatar: undefined,
    },
    type: "text",
    content: "오늘 온라인 스터디 모임 너무 유익했어요!\n\n다음 주에는 타입스크립트 심화 과정으로 진행할 예정입니다. 참여 원하시는 분들 댓글 남겨주세요 💪",
    source: {
      type: "community",
      id: "10",
      name: "개발자 스터디 모임",
      emoji: "📚",
      isJoined: true,
    },
    likesCount: 78,
    repostsCount: 12,
    commentsCount: 34,
    bookmarksCount: 23,
    isLiked: true,
    isReposted: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  // 12. 팔로잉 유저의 프로젝트 글
  {
    id: "12",
    author: {
      id: "11",
      username: "react_master",
      displayName: "리액트마스터",
      avatar: undefined,
    },
    type: "project_update",
    content: "React 컴포넌트 라이브러리 v1.5.0 업데이트!\n\n새로운 애니메이션 훅과 접근성 개선 사항이 포함되어 있습니다.",
    projectId: "11",
    projectTitle: "React UI Kit",
    source: {
      type: "following",
      isJoined: false,
    },
    likesCount: 245,
    repostsCount: 56,
    commentsCount: 42,
    bookmarksCount: 98,
    isLiked: false,
    isReposted: false,
    isBookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

interface PostStore extends FeedState {
  setActiveTab: (tab: FeedState["activeTab"]) => void;
  loadPosts: () => void;
  loadMore: () => void;
  addPost: (post: Omit<Post, "id" | "createdAt" | "likesCount" | "repostsCount" | "commentsCount" | "bookmarksCount" | "isLiked" | "isReposted" | "isBookmarked">) => void;
  toggleLike: (postId: string) => void;
  toggleRepost: (postId: string) => void;
  toggleBookmark: (postId: string) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: demoPosts,
  isLoading: false,
  hasMore: true,
  activeTab: "all",

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadPosts: () => {
    set({ isLoading: true });
    // 실제로는 API 호출
    setTimeout(() => {
      set({ posts: demoPosts, isLoading: false });
    }, 500);
  },

  loadMore: () => {
    const { posts, hasMore } = get();
    if (!hasMore) return;

    set({ isLoading: true });
    setTimeout(() => {
      // 데모에서는 더 이상 로드할 게 없음
      set({ isLoading: false, hasMore: false });
    }, 500);
  },

  addPost: (postData) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ posts: [newPost, ...state.posts] }));
  },

  toggleLike: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      ),
    }));
  },

  toggleRepost: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isReposted: !post.isReposted,
              repostsCount: post.isReposted ? post.repostsCount - 1 : post.repostsCount + 1,
            }
          : post
      ),
    }));
  },

  toggleBookmark: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isBookmarked: !post.isBookmarked,
              bookmarksCount: post.isBookmarked ? post.bookmarksCount - 1 : post.bookmarksCount + 1,
            }
          : post
      ),
    }));
  },
}));
