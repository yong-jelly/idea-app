import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "./user.types";
import { supabase } from "@/shared/lib/supabase";

/**
 * DB 사용자 인터페이스 (RPC 응답)
 */
interface DbUser {
  id: number;
  auth_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum" | string;
  subscribed_projects_count: number;
  supported_projects_count: number;
  projects_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 사용자 스토어 인터페이스
 * Supabase Auth 세션 기반 인증 상태 및 사용자 정보를 관리합니다.
 */
interface UserStore extends AuthState {
  /** 동기화 진행 중 플래그 (중복 호출 방지) */
  isSyncing: boolean;
  
  /** JWT 세션 토큰 (deprecated - Supabase 세션 사용) */
  sessionToken: string | null;
  
  // ===== Supabase 세션 기반 메서드 =====
  
  /** 사용자 상태 설정 */
  setUser: (user: User | null) => void;
  
  /** Supabase 세션에서 사용자 정보 동기화 */
  syncUserFromSession: () => Promise<void>;
  
  /** 앱 초기화 시 세션 복구 */
  initSession: () => Promise<void>;
  
  /** 사용자 로그아웃 처리 (Supabase 세션 정리 포함) */
  logout: () => Promise<void>;
  
  // ===== 기존 메서드 (하위 호환성 유지) =====
  
  /** 사용자 로그인 처리 및 세션 생성 (deprecated - Supabase 인증 사용) */
  login: (user: User) => void;
  
  /** 개발용: 회원/비회원 토글 (deprecated) */
  toggleAuth: () => void;
  
  /** 사용자 정보 업데이트 */
  updateUser: (updates: Partial<User>) => void;
  
  /** 사용자 포인트 추가 */
  addPoints: (points: number) => void;
  
  /** JWT 세션 생성 및 사용자 인증 상태 설정 (deprecated) */
  createSession: () => string;
  
  /** 세션 초기화 및 완전 로그아웃 처리 (deprecated) */
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
      isSyncing: false,
      sessionToken: null,

      // ===== Supabase 세션 기반 메서드 =====

      /**
       * 사용자 상태 설정
       * @param user - 설정할 사용자 정보 (null이면 로그아웃 상태)
       */
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isSyncing: false,
        });
      },

      /**
       * Supabase 세션에서 사용자 정보 동기화
       * RPC 호출을 통해 DB에서 최신 사용자 정보를 가져와 스토어에 반영합니다.
       * 중복 호출 방지 및 타임아웃 처리가 포함되어 있습니다.
       */
      syncUserFromSession: async () => {
        const currentState = get();

        // 중복 호출 방지
        if (currentState.isSyncing) {
          // 로그인 상태가 있으면 정상적인 중복 호출로 간주하고 건너뛰기
          if (currentState.isAuthenticated && currentState.user) {
            return;
          }
          // 로그인 상태가 없는데 동기화 중이면 이전 동기화가 완료되지 않은 것
          // 플래그를 리셋하고 새로 시작
          set({ isSyncing: false });
        }

        // 동기화 시작
        set({ isSyncing: true });

        try {
          // 세션 확인 (최대 5번 시도, 500ms 간격)
          let session = null;
          let authUser = null;
          
          for (let i = 0; i < 5; i++) {
            const { data: { session: currentSession }, error: sessionError } = 
              await supabase.auth.getSession();
            
            if (!sessionError && currentSession?.user) {
              session = currentSession;
              authUser = currentSession.user;
              break;
            }
            
            if (i < 4) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          if (!authUser || !session?.access_token) {
            // 세션이 없으면 로그아웃 상태로 설정
            set({ user: null, isAuthenticated: false, isSyncing: false });
            return;
          }

          // RPC 호출로 사용자 정보 조회 (타임아웃 20초, 최대 2번 재시도)
          const timeout = 20000;
          let dbUser: DbUser | null = null;
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              // 재시도 전 세션 재확인
              if (attempt > 0) {
                const { data: { session: retrySession } } = 
                  await supabase.auth.getSession();
                if (!retrySession?.access_token) {
                  set({ user: null, isAuthenticated: false, isSyncing: false });
                  return;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              }

              const startTime = Date.now();
              const rpcPromise = supabase
                .schema("odd")
                .rpc("v1_upsert_user", {
                  p_auth_id: authUser.id,
                  p_email: authUser.email,
                  p_display_name: authUser.user_metadata?.full_name || 
                                  authUser.user_metadata?.name || 
                                  null,
                  p_avatar_url: authUser.user_metadata?.avatar_url || null,
                })
                .single();

              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("RPC 호출 타임아웃")), timeout);
              });

              const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
              const duration = Date.now() - startTime;

              if (error) {
                // 재시도 불가능한 에러 체크
                if (error.code === "PGRST301" || error.code === "23505") {
                  throw error;
                }
                lastError = error;
                console.warn(`[SESSION] RPC 호출 실패 (시도 ${attempt + 1}/3):`, {
                  error: error.message,
                  code: error.code,
                  duration: `${duration}ms`,
                });
                continue;
              }

              if (data) {
                dbUser = data as DbUser;
                console.log(`[SESSION] RPC 호출 성공 (시도 ${attempt + 1}/3):`, {
                  duration: `${duration}ms`,
                  userId: dbUser.id,
                });
                break;
              }
            } catch (err) {
              if (err instanceof Error && err.message === "RPC 호출 타임아웃") {
                lastError = err;
                console.warn(`[SESSION] RPC 호출 타임아웃 (시도 ${attempt + 1}/3)`);
                continue;
              }
              throw err;
            }
          }

          if (!dbUser) {
            // 모든 시도 실패
            console.error("[SESSION] 사용자 정보 동기화 실패:", lastError);
            set({ user: null, isAuthenticated: false, isSyncing: false });
            if (lastError) {
              console.error("[SESSION] 에러 상세:", {
                message: lastError.message,
                ...(lastError instanceof Error && 'code' in lastError 
                  ? { code: (lastError as any).code } 
                  : {}),
              });
            }
            return;
          }

          // 스토어에 사용자 정보 저장
          const user: User = {
            id: dbUser.id.toString(),
            username: dbUser.username || "",
            displayName: dbUser.display_name || "",
            avatar: dbUser.avatar_url || undefined,
            bio: dbUser.bio || undefined,
            website: dbUser.website || undefined,
            github: dbUser.github || undefined,
            twitter: dbUser.twitter || undefined,
            points: dbUser.points,
            level: (dbUser.level as "bronze" | "silver" | "gold" | "platinum") || "bronze",
            subscribedProjectsCount: dbUser.subscribed_projects_count,
            supportedProjectsCount: dbUser.supported_projects_count,
            projectsCount: dbUser.projects_count,
            createdAt: dbUser.created_at,
          };

          set({
            user,
            isAuthenticated: true,
            isSyncing: false,
          });

          console.log("[SESSION] 사용자 정보 동기화 완료:", {
            userId: user.id,
            username: user.username,
          });
        } catch (err) {
          console.error("[SESSION] 사용자 정보 동기화 중 예외 발생:", err);
          set({ user: null, isAuthenticated: false, isSyncing: false });
        }
      },

      /**
       * 앱 초기화 시 세션 복구
       * 브라우저 새로고침 시 Supabase 세션을 확인하고 사용자 정보를 복구합니다.
       */
      initSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error || !session?.user) {
            // 세션이 없으면 로그아웃 상태로 설정
            set({ user: null, isAuthenticated: false, isSyncing: false });
            return;
          }

          // 세션이 있으면 사용자 정보 동기화
          await get().syncUserFromSession();
        } catch (err) {
          console.error("[SESSION] 세션 초기화 중 예외 발생:", err);
          set({ user: null, isAuthenticated: false, isSyncing: false });
        }
      },

      /**
       * 사용자 로그아웃 처리
       * Supabase 세션을 정리하고 스토어 상태를 초기화합니다.
       */
      logout: async () => {
        const currentUser = get().user;

        console.log("[SESSION] 로그아웃 시도", {
          userId: currentUser?.id,
          username: currentUser?.username,
        });

        try {
          // Supabase 세션 정리
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("[SESSION] Supabase 로그아웃 에러:", error);
          }
        } catch (err) {
          console.error("[SESSION] 로그아웃 중 예외 발생:", err);
        }

        // 스토어 상태 초기화
        set({
          user: null,
          isAuthenticated: false,
          isSyncing: false,
          sessionToken: null,
        });

        console.log("[SESSION] 로그아웃 완료");
      },

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
