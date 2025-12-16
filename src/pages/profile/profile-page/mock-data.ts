/**
 * ProfilePage 데모용 목 데이터
 * TODO: API 연동 시 제거 예정
 */
import type { User, Badge as UserBadge } from "@/entities/user";

/**
 * 더미 배지 데이터
 */
export const dummyBadges: UserBadge[] = [
  { 
    id: "b1", 
    type: "early_supporter", 
    name: "얼리 서포터", 
    description: "프로젝트 초기에 서포트", 
    icon: "🌟", 
    rarity: "rare", 
    earnedAt: "2024-02-01T00:00:00Z", 
    projectTitle: "Indie App" 
  },
  { 
    id: "b2", 
    type: "bug_hunter", 
    name: "버그 헌터", 
    description: "10개 이상의 버그 발견", 
    icon: "🐛", 
    rarity: "epic", 
    earnedAt: "2024-05-15T00:00:00Z" 
  },
  { 
    id: "b3", 
    type: "streak_7", 
    name: "7일 연속", 
    description: "7일 연속 출석", 
    icon: "🔥", 
    rarity: "common", 
    earnedAt: "2024-06-01T00:00:00Z", 
    projectTitle: "Dev Tools" 
  },
  { 
    id: "b4", 
    type: "beta_tester", 
    name: "베타 테스터", 
    description: "베타 테스트 참여", 
    icon: "🧪", 
    rarity: "rare", 
    earnedAt: "2024-07-10T00:00:00Z", 
    projectTitle: "Indie App" 
  },
  { 
    id: "b5", 
    type: "top_contributor", 
    name: "탑 기여자", 
    description: "상위 기여자로 선정", 
    icon: "🏆", 
    rarity: "legendary", 
    earnedAt: "2024-08-20T00:00:00Z", 
    projectTitle: "Open Source Kit" 
  },
  { 
    id: "b6", 
    type: "first_feedback", 
    name: "첫 피드백", 
    description: "첫 번째 피드백 작성", 
    icon: "✨", 
    rarity: "common", 
    earnedAt: "2024-01-20T00:00:00Z" 
  },
];

/**
 * 데모용 프로필 데이터
 */
export const demoProfiles: Record<string, User> = {
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

