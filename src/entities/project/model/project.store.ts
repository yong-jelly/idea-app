import { create } from "zustand";
import type { Project, FeatureRequest } from "./project.types";
import { fetchMyProjects, fetchSavedProjects } from "../api/project.api";

// 데모용 프로젝트 데이터
const demoProjects: Project[] = [
  {
    id: "1",
    title: "AI 코드 리뷰 도구",
    shortDescription: "머신러닝을 활용한 자동 코드 리뷰 및 최적화 제안 도구",
    category: "ai",
    techStack: ["Python", "TensorFlow", "React"],
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    repositoryUrl: "https://github.com/indie-dev/ai-code-review",
    demoUrl: "https://ai-code-review.demo.com",
    androidStoreUrl: "https://play.google.com/store/apps/details?id=com.example",
    iosStoreUrl: "https://apps.apple.com/app/id123456789",
    currentFunding: 75000,
    targetFunding: 100000,
    backersCount: 156,
    likesCount: 234,
    commentsCount: 45,
    daysLeft: 12,
    status: "funding",
    featured: true,
    createdAt: "2024-11-01T00:00:00Z",
  },
  {
    id: "2",
    title: "실시간 협업 화이트보드",
    shortDescription: "개발팀을 위한 실시간 협업 화이트보드 및 브레인스토밍 플랫폼",
    category: "web",
    techStack: ["Next.js", "Socket.io", "MongoDB"],
    author: {
      id: "2",
      username: "frontend_lee",
      displayName: "이프론트",
      avatar: undefined,
    },
    currentFunding: 45000,
    targetFunding: 80000,
    backersCount: 89,
    likesCount: 167,
    commentsCount: 23,
    daysLeft: 25,
    status: "funding",
    featured: false,
    createdAt: "2024-11-10T00:00:00Z",
  },
  {
    id: "3",
    title: "모바일 퍼즐 게임",
    shortDescription: "AI 기반 적응형 난이도 조절 시스템을 가진 퍼즐 게임",
    category: "game",
    techStack: ["Unity", "C#", "Firebase"],
    author: {
      id: "3",
      username: "game_park",
      displayName: "박게임",
      avatar: undefined,
    },
    currentFunding: 120000,
    targetFunding: 150000,
    backersCount: 278,
    likesCount: 445,
    commentsCount: 67,
    daysLeft: 8,
    status: "funding",
    featured: true,
    createdAt: "2024-10-20T00:00:00Z",
  },
  {
    id: "4",
    title: "오픈소스 API 게이트웨이",
    shortDescription: "경량화된 고성능 API 게이트웨이 솔루션",
    category: "opensource",
    techStack: ["Go", "Redis", "Docker"],
    author: {
      id: "4",
      username: "backend_kim",
      displayName: "김백엔드",
      avatar: undefined,
    },
    currentFunding: 200000,
    targetFunding: 200000,
    backersCount: 456,
    likesCount: 789,
    commentsCount: 123,
    daysLeft: 0,
    status: "completed",
    featured: false,
    createdAt: "2024-09-15T00:00:00Z",
  },
];

// 데모용 기능 제안 데이터
const demoFeatureRequests: FeatureRequest[] = [
  {
    id: "1",
    projectId: "1",
    author: {
      id: "5",
      username: "user_choi",
      displayName: "최유저",
      avatar: undefined,
    },
    title: "VS Code 확장 지원",
    description: "VS Code 에디터에서 직접 코드 리뷰를 받을 수 있는 확장 프로그램을 개발해주세요.",
    votesCount: 89,
    isVoted: true,
    status: "accepted",
    developerResponse: "좋은 제안입니다! 다음 마일스톤에 포함시킬 예정입니다.",
    createdAt: "2024-11-20T00:00:00Z",
    updatedAt: "2024-11-22T00:00:00Z",
  },
  {
    id: "2",
    projectId: "1",
    author: {
      id: "6",
      username: "dev_jung",
      displayName: "정개발",
      avatar: undefined,
    },
    title: "다국어 코멘트 지원",
    description: "영어 외에 한국어, 일본어 등 다양한 언어로 리뷰 코멘트를 생성하는 기능",
    votesCount: 45,
    isVoted: false,
    status: "reviewing",
    createdAt: "2024-11-25T00:00:00Z",
    updatedAt: "2024-11-25T00:00:00Z",
  },
  {
    id: "3",
    projectId: "1",
    author: {
      id: "7",
      username: "coder_lee",
      displayName: "이코더",
      avatar: undefined,
    },
    title: "GitHub Actions 연동",
    description: "PR이 생성될 때 자동으로 코드 리뷰를 실행하는 GitHub Actions 워크플로우",
    votesCount: 156,
    isVoted: true,
    status: "pending",
    createdAt: "2024-11-28T00:00:00Z",
    updatedAt: "2024-11-28T00:00:00Z",
  },
];

interface ProjectStore {
  projects: Project[];
  featureRequests: FeatureRequest[];
  isLoading: boolean;
  
  // 저장한 프로젝트 관련
  savedProjects: Project[];
  savedProjectsHasMore: boolean;
  savedProjectsLoaded: boolean;
  savedProjectsLoading: boolean;
  
  // 내가 생성한 프로젝트 관련
  myProjects: Project[];
  myProjectsLoaded: boolean;
  myProjectsLoading: boolean;
  
  getProject: (id: string) => Project | undefined;
  getProjectFeatureRequests: (projectId: string) => FeatureRequest[];
  toggleProjectLike: (projectId: string) => void;
  toggleFeatureVote: (featureId: string) => void;
  addFeatureRequest: (request: Omit<FeatureRequest, "id" | "createdAt" | "updatedAt" | "votesCount" | "isVoted" | "status">) => void;
  
  // 저장한 프로젝트 관련 액션
  loadSavedProjects: () => Promise<void>;
  refreshSavedProjects: () => Promise<void>;
  clearSavedProjects: () => void;
  
  // 내가 생성한 프로젝트 관련 액션
  loadMyProjects: () => Promise<void>;
  refreshMyProjects: () => Promise<void>;
  clearMyProjects: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: demoProjects,
  featureRequests: demoFeatureRequests,
  isLoading: false,
  
  // 저장한 프로젝트 초기 상태
  savedProjects: [],
  savedProjectsHasMore: false,
  savedProjectsLoaded: false,
  savedProjectsLoading: false,
  
  // 내가 생성한 프로젝트 초기 상태
  myProjects: [],
  myProjectsLoaded: false,
  myProjectsLoading: false,

  getProject: (id) => get().projects.find((p) => p.id === id),

  getProjectFeatureRequests: (projectId) =>
    get().featureRequests.filter((f) => f.projectId === projectId),

  toggleProjectLike: (projectId) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, likesCount: project.likesCount + 1 }
          : project
      ),
    }));
  },

  toggleFeatureVote: (featureId) => {
    set((state) => ({
      featureRequests: state.featureRequests.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              isVoted: !feature.isVoted,
              votesCount: feature.isVoted ? feature.votesCount - 1 : feature.votesCount + 1,
            }
          : feature
      ),
    }));
  },

  addFeatureRequest: (request) => {
    const newRequest: FeatureRequest = {
      ...request,
      id: Date.now().toString(),
      votesCount: 1,
      isVoted: true,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      featureRequests: [newRequest, ...state.featureRequests],
    }));
  },
  
  // 저장한 프로젝트 로드 (이미 로드되어 있으면 스킵)
  loadSavedProjects: async () => {
    const state = get();
    if (state.savedProjectsLoaded || state.savedProjectsLoading) {
      return;
    }
    
    set({ savedProjectsLoading: true });
    
    try {
      const { projects, error } = await fetchSavedProjects({
        limit: 50,
        offset: 0,
      });
      
      if (!error && projects) {
        set({
          savedProjects: projects,
          savedProjectsHasMore: projects.length >= 50,
          savedProjectsLoaded: true,
        });
      }
    } finally {
      set({ savedProjectsLoading: false });
    }
  },
  
  // 저장한 프로젝트 강제 새로고침
  refreshSavedProjects: async () => {
    const state = get();
    if (state.savedProjectsLoading) {
      return;
    }
    
    set({ savedProjectsLoading: true });
    
    try {
      const { projects, error } = await fetchSavedProjects({
        limit: 50,
        offset: 0,
      });
      
      if (!error && projects) {
        set({
          savedProjects: projects,
          savedProjectsHasMore: projects.length >= 50,
          savedProjectsLoaded: true,
        });
      }
    } finally {
      set({ savedProjectsLoading: false });
    }
  },
  
  // 저장한 프로젝트 초기화 (로그아웃 시)
  clearSavedProjects: () => {
    set({
      savedProjects: [],
      savedProjectsHasMore: false,
      savedProjectsLoaded: false,
      savedProjectsLoading: false,
    });
  },
  
  // 내가 생성한 프로젝트 로드 (이미 로드되어 있으면 스킵)
  loadMyProjects: async () => {
    const state = get();
    if (state.myProjectsLoaded || state.myProjectsLoading) {
      return;
    }
    
    set({ myProjectsLoading: true });
    
    try {
      const { projects, error } = await fetchMyProjects({
        limit: 10,
        offset: 0,
      });
      
      if (!error && projects) {
        set({
          myProjects: projects,
          myProjectsLoaded: true,
        });
      }
    } finally {
      set({ myProjectsLoading: false });
    }
  },
  
  // 내가 생성한 프로젝트 강제 새로고침
  refreshMyProjects: async () => {
    const state = get();
    if (state.myProjectsLoading) {
      return;
    }
    
    set({ myProjectsLoading: true });
    
    try {
      const { projects, error } = await fetchMyProjects({
        limit: 10,
        offset: 0,
      });
      
      if (!error && projects) {
        set({
          myProjects: projects,
          myProjectsLoaded: true,
        });
      }
    } finally {
      set({ myProjectsLoading: false });
    }
  },
  
  // 내가 생성한 프로젝트 초기화 (로그아웃 시)
  clearMyProjects: () => {
    set({
      myProjects: [],
      myProjectsLoaded: false,
      myProjectsLoading: false,
    });
  },
}));

