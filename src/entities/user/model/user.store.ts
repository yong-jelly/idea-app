import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "./user.types";

interface UserStore extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addPoints: (points: number) => void;
}

// 데모용 사용자 데이터
const demoUser: User = {
  id: "1",
  username: "indie_dev",
  displayName: "김인디",
  avatar: undefined,
  bio: "풀스택 인디 개발자 🚀 AI와 웹 개발을 좋아합니다.",
  website: "https://indie.dev",
  github: "indie-dev",
  twitter: "indie_dev",
  points: 1250,
  level: "gold",
  subscribedProjectsCount: 12,
  supportedProjectsCount: 28,
  projectsCount: 5,
  createdAt: "2024-01-15T00:00:00Z",
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: demoUser, // 데모용으로 로그인 상태
      isAuthenticated: true,
      isLoading: false,

      login: (user) => set({ user, isAuthenticated: true }),
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      
      addPoints: (points) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, points: state.user.points + points }
            : null,
        })),
    }),
    {
      name: "user-storage",
    }
  )
);

