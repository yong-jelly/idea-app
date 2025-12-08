export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  subscribedProjectsCount: number;
  supportedProjectsCount: number;
  projectsCount: number;
  createdAt: string;
}

export interface UserProfile extends User {
  isOwnProfile: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

