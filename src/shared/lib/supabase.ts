import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyqpggpilgcdsawuvpzn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4rByGLkIJH0y9Qz7CKm1MA_ulfWQZtj';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase 클라이언트 생성
 * 
 * 보안 및 안정성을 위한 설정:
 * - autoRefreshToken: Access Token 만료 전 자동 갱신
 * - persistSession: localStorage에 세션 저장 (다중 탭 동기화 필수)
 * - detectSessionInUrl: OAuth 콜백에서 URL의 세션 자동 감지
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // 자동 토큰 갱신 활성화
    persistSession: true,        // localStorage에 세션 영속화 (다중 탭 동기화 필수)
    detectSessionInUrl: true,     // OAuth 콜백에서 URL의 세션 자동 감지
    storage: window.localStorage, // 명시적 스토리지 지정
  },
  global: {
    headers: {
      'X-Client-Info': 'idea-app',
    },
  },
})
