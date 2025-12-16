import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "./user.types";

/**
 * 사용자 스토어 인터페이스
 * 인증 상태, 사용자 정보, 세션 토큰을 관리합니다.
 */
interface UserStore extends AuthState {
  /** JWT 세션 토큰 (인증된 사용자의 경우에만 존재) */
  sessionToken: string | null;
  
  /** 사용자 로그인 처리 및 세션 생성 */
  login: (user: User) => void;
  
  /** 사용자 로그아웃 처리 (세션은 유지, clearSession과 함께 사용 권장) */
  logout: () => void;
  
  /** 개발용: 회원/비회원 토글 (JWT 세션 생성/삭제) */
  toggleAuth: () => void;
  
  /** 사용자 정보 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  
  /** 사용자 포인트 추가 */
  addPoints: (points: number) => void;
  
  /** JWT 세션 생성 및 사용자 인증 상태 설정 */
  createSession: () => string;
  
  /** 세션 초기화 및 완전 로그아웃 처리 */
  clearSession: () => void;
}

/**
 * 데모용 사용자 데이터
 * 개발 환경에서 기본 사용자 정보로 사용됩니다.
 */
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

/**
 * JWT 토큰 생성 함수
 * 
 * 주의: 이 함수는 클라이언트 사이드에서 간단한 데모용으로만 사용됩니다.
 * 실제 프로덕션 환경에서는 서버에서 JWT를 생성하고 서명해야 합니다.
 * 
 * @param userId - 사용자 ID
 * @returns 생성된 JWT 토큰 문자열
 */
function generateJWT(userId: string): string {
  console.log("[SESSION] JWT 토큰 생성 시작", { userId, timestamp: new Date().toISOString() });
  
  // JWT 헤더: 알고리즘과 토큰 타입 지정
  const header = {
    alg: "HS256", // HMAC SHA-256 알고리즘
    typ: "JWT",   // JSON Web Token 타입
  };
  
  // JWT 페이로드: 사용자 정보 및 만료 시간 포함
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    iat: now, // issued at: 토큰 발급 시간
    exp: now + 60 * 60 * 24 * 7, // expiration: 7일 후 만료
  };
  
  console.log("[SESSION] JWT 페이로드 생성", { 
    userId, 
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    expiresIn: "7일"
  });
  
  // Base64 인코딩 (실제로는 서버에서 HMAC 서명을 사용해야 함)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // 간단한 서명 (실제로는 비밀키로 HMAC 서명해야 함)
  const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);
  
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  console.log("[SESSION] JWT 토큰 생성 완료", { 
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + "..."
  });
  
  return token;
}

/**
 * 사용자 스토어 생성
 * Zustand를 사용하여 전역 상태 관리 및 localStorage 영속화
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // 초기 상태: 비회원 상태로 시작
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,

      /**
       * 사용자 로그인 처리
       * 사용자 정보를 받아 JWT 세션을 생성하고 인증 상태를 설정합니다.
       * 
       * @param user - 로그인할 사용자 정보
       */
      login: (user) => {
        console.log("[SESSION] 로그인 시도", { 
          userId: user.id, 
          username: user.username,
          displayName: user.displayName 
        });
        
        const token = generateJWT(user.id);
        
        set({ 
          user, 
          isAuthenticated: true, 
          sessionToken: token 
        });
        
        console.log("[SESSION] 로그인 완료", { 
          userId: user.id,
          username: user.username,
          hasSessionToken: !!token,
          authenticated: true
        });
      },
      
      /**
       * 사용자 로그아웃 처리
       * 사용자 정보와 인증 상태를 초기화합니다.
       * 세션 토큰은 clearSession()에서 함께 제거됩니다.
       */
      logout: () => {
        const currentUser = get().user;
        
        console.log("[SESSION] 로그아웃 시도", { 
          userId: currentUser?.id,
          username: currentUser?.username 
        });
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          sessionToken: null 
        });
        
        console.log("[SESSION] 로그아웃 완료", { 
          authenticated: false,
          sessionCleared: true
        });
      },
      
      /**
       * 세션 생성
       * 데모용 사용자로 JWT 세션을 생성하고 인증 상태를 활성화합니다.
       * 개발 환경에서 회원 모드로 전환할 때 사용됩니다.
       * 
       * @returns 생성된 JWT 토큰
       */
      createSession: () => {
        console.log("[SESSION] 세션 생성 시작", { 
          demoUserId: demoUser.id,
          demoUsername: demoUser.username 
        });
        
        const token = generateJWT(demoUser.id);
        
        set({ 
          sessionToken: token, 
          user: demoUser, 
          isAuthenticated: true 
        });
        
        console.log("[SESSION] 세션 생성 완료", { 
          userId: demoUser.id,
          username: demoUser.username,
          tokenLength: token.length,
          authenticated: true
        });
        
        return token;
      },
      
      /**
       * 세션 초기화
       * 세션 토큰과 사용자 정보를 완전히 제거하여 비회원 상태로 전환합니다.
       * 로그아웃 시 호출됩니다.
       */
      clearSession: () => {
        const currentState = get();
        
        console.log("[SESSION] 세션 초기화 시작", { 
          hadSession: !!currentState.sessionToken,
          wasAuthenticated: currentState.isAuthenticated,
          userId: currentState.user?.id
        });
        
        set({ 
          sessionToken: null, 
          user: null, 
          isAuthenticated: false 
        });
        
        console.log("[SESSION] 세션 초기화 완료", { 
          sessionToken: null,
          user: null,
          authenticated: false
        });
      },
      
      /**
       * 인증 상태 토글 (개발용)
       * 현재 인증 상태에 따라 세션을 생성하거나 삭제합니다.
       * - 인증된 상태: 세션 초기화 (비회원으로 전환)
       * - 비인증 상태: 세션 생성 (회원으로 전환)
       */
      toggleAuth: () => {
        const state = get();
        const currentAuthState = state.isAuthenticated;
        
        console.log("[SESSION] 인증 상태 토글", { 
          currentState: currentAuthState ? "인증됨" : "비인증",
          hasSessionToken: !!state.sessionToken,
          userId: state.user?.id
        });
        
        if (currentAuthState) {
          // 현재 인증된 상태 → 로그아웃: 세션 초기화
          console.log("[SESSION] 로그아웃 처리 시작 (토글)");
          state.clearSession();
        } else {
          // 현재 비인증 상태 → 로그인: 세션 생성
          console.log("[SESSION] 로그인 처리 시작 (토글)");
          const token = state.createSession();
          console.log("[SESSION] 토글 완료: 비인증 → 인증", { 
            tokenCreated: !!token 
          });
        }
      },
      
      /**
       * 사용자 정보 업데이트
       * 현재 로그인된 사용자의 정보를 부분적으로 업데이트합니다.
       * 
       * @param updates - 업데이트할 사용자 정보 (부분 업데이트 가능)
       */
      updateUser: (updates) => {
        const currentUser = get().user;
        
        if (!currentUser) {
          console.warn("[SESSION] 사용자 정보 업데이트 실패: 로그인되지 않음");
          return;
        }
        
        console.log("[SESSION] 사용자 정보 업데이트", { 
          userId: currentUser.id,
          updates: Object.keys(updates)
        });
        
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
        
        console.log("[SESSION] 사용자 정보 업데이트 완료", { 
          userId: currentUser.id 
        });
      },
      
      /**
       * 사용자 포인트 추가
       * 현재 로그인된 사용자의 포인트를 증가시킵니다.
       * 
       * @param points - 추가할 포인트 수
       */
      addPoints: (points) => {
        const currentUser = get().user;
        
        if (!currentUser) {
          console.warn("[SESSION] 포인트 추가 실패: 로그인되지 않음");
          return;
        }
        
        console.log("[SESSION] 포인트 추가", { 
          userId: currentUser.id,
          currentPoints: currentUser.points,
          addedPoints: points,
          newPoints: currentUser.points + points
        });
        
        set((state) => ({
          user: state.user
            ? { ...state.user, points: state.user.points + points }
            : null,
        }));
      },
    }),
    {
      // localStorage에 저장될 키 이름
      name: "user-storage",
    }
  )
);
