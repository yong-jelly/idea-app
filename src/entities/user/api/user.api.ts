import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl } from "@/shared/lib/storage";
import type { User } from "../model/user.types";

/**
 * 사용자 프로필 조회 결과
 */
export interface FetchUserProfileResult {
  user: User | null;
  error: Error | null;
}

/**
 * 사용자 프로필 조회
 * 
 * @param username - 조회할 사용자의 username
 * @returns 사용자 프로필 정보 또는 에러
 */
export async function fetchUserProfile(
  username: string
): Promise<FetchUserProfileResult> {
  try {
    if (!username) {
      return {
        user: null,
        error: new Error("username이 필요합니다"),
      };
    }

    const { data, error } = await supabase
      .schema("odd")
      .rpc("v1_fetch_user_profile", {
        p_username: username,
      });

    if (error) {
      console.error("사용자 프로필 조회 에러:", error);
      return {
        user: null,
        error: new Error(error.message),
      };
    }

    if (!data || data.length === 0) {
      return {
        user: null,
        error: new Error("사용자를 찾을 수 없습니다"),
      };
    }

    const dbUser = data[0] as any;

    const user: User = {
      id: dbUser.id.toString(),
      username: dbUser.username || "",
      displayName: dbUser.display_name || "",
      avatar: dbUser.avatar_url || undefined, // 원본 avatar_url 저장 (표시 시 변환)
      bio: dbUser.bio || undefined,
      website: dbUser.website || undefined,
      github: dbUser.github || undefined,
      twitter: dbUser.twitter || undefined,
      points: dbUser.points || 0,
      level: (dbUser.level as "bronze" | "silver" | "gold" | "platinum") || "bronze",
      subscribedProjectsCount: dbUser.subscribed_projects_count || 0,
      supportedProjectsCount: dbUser.supported_projects_count || 0,
      projectsCount: dbUser.projects_count || 0,
      badges: [], // 배지는 별도로 조회 필요
      createdAt: dbUser.created_at,
    };

    return {
      user,
      error: null,
    };
  } catch (err) {
    console.error("사용자 프로필 조회 예외:", err);
    return {
      user: null,
      error: err instanceof Error ? err : new Error("알 수 없는 에러가 발생했습니다"),
    };
  }
}

