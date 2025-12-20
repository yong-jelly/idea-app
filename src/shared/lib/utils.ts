import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스를 병합하고 충돌을 해결합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자를 한국식 축약 형태로 포맷합니다.
 * 예: 1234 -> "1.2천", 12345 -> "1.2만"
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toLocaleString("ko-KR");
}

/**
 * 좋아요 수를 k 단위로 포맷합니다.
 * 예: 0 -> "0", 100 -> "100", 1000 -> "1k", 1300 -> "1.3k", 15000 -> "15k"
 */
export function formatLikesCount(count: number): string {
  if (count === 0) {
    return "0";
  }
  if (count < 1000) {
    return count.toString();
  }
  const k = count / 1000;
  // 소수점이 0이면 정수로 표시 (예: 1k, 2k)
  if (k % 1 === 0) {
    return `${k}k`;
  }
  // 소수점이 있으면 한 자리까지 표시 (예: 1.3k, 2.5k)
  return `${k.toFixed(1)}k`;
}

/**
 * 날짜를 상대적 시간으로 포맷합니다.
 * 예: "방금 전", "5분 전", "3시간 전", "2일 전"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  
  return target.toLocaleDateString("ko-KR");
}

/**
 * 금액을 원화 형식으로 포맷합니다.
 */
export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

// ============================================================================
// 로딩 지연 시간 관리 유틸리티
// ============================================================================
// 
// 목적:
// - API 응답이 너무 빨라서 로딩 UI가 거의 보이지 않는 문제를 해결
// - 사용자에게 일관된 로딩 경험을 제공하여 UI 깜빡임 방지
// - 최소 지연 시간을 보장하여 로딩 스켈레톤/프로그레스 UI가 충분히 표시되도록 함
//
// 사용 사례:
// - 댓글 목록 로딩 (CommentsLoading)
// - 프로젝트 목록 로딩 (ProjectsLoading)
// - 기타 비동기 데이터 로딩 시 로딩 UI 표시 시간 보장
//
// 사용 예시:
// ```ts
// const startTime = Date.now();
// const data = await fetchData();
// await ensureMinDelay(startTime, { min: 300, max: 1000 });
// setData(data);
// setIsLoading(false);
// ```

/**
 * 최소 로딩 지연 시간 설정
 * 
 * @property min - 최소 지연 시간 (밀리초)
 * @property max - 최대 지연 시간 (밀리초)
 * 
 * @example
 * ```ts
 * const delay: MinLoadingDelay = { min: 300, max: 1000 };
 * ```
 */
export interface MinLoadingDelay {
  /** 최소 지연 시간 (ms) */
  min: number;
  /** 최대 지연 시간 (ms) */
  max: number;
}

/**
 * 기본 최소 로딩 지연 시간 설정
 * 
 * 일반적인 사용 사례에 적합한 기본값입니다.
 * - 최소: 300ms (너무 짧지 않아 사용자가 로딩 상태를 인지 가능)
 * - 최대: 1000ms (너무 길지 않아 사용자 경험 저하 방지)
 */
export const DEFAULT_MIN_LOADING_DELAY: MinLoadingDelay = {
  min: 300,
  max: 1000,
};

/**
 * 랜덤 지연 시간을 생성합니다.
 * 
 * 지정된 범위(min ~ max) 내에서 균등 분포로 랜덤한 지연 시간을 반환합니다.
 * 매번 다른 지연 시간을 생성하여 더 자연스러운 로딩 경험을 제공합니다.
 * 
 * @param min - 최소 지연 시간 (ms)
 * @param max - 최대 지연 시간 (ms)
 * @returns min과 max 사이의 랜덤 정수 값 (ms)
 * 
 * @example
 * ```ts
 * const delay = getRandomDelay(300, 1000);
 * // 300 ~ 1000 사이의 랜덤 값 반환 (예: 542ms)
 * ```
 * 
 * @throws {Error} min이 max보다 큰 경우
 */
export function getRandomDelay(min: number, max: number): number {
  if (min > max) {
    throw new Error(`getRandomDelay: min (${min}) must be less than or equal to max (${max})`);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 최소 지연 시간을 보장합니다.
 * 
 * API 응답이 너무 빠른 경우에도 최소 지연 시간만큼은 대기하여
 * 로딩 UI가 충분히 표시되도록 합니다.
 * 
 * 동작 방식:
 * 1. 시작 시간부터 경과한 시간을 계산
 * 2. 설정된 최소~최대 지연 시간 범위에서 랜덤 값 생성
 * 3. 경과 시간이 생성된 지연 시간보다 짧으면 부족한 시간만큼 대기
 * 4. 이미 지연 시간보다 오래 걸렸다면 즉시 반환 (추가 대기 없음)
 * 
 * @param startTime - 작업 시작 시간 (Date.now()로 측정한 타임스탬프)
 * @param minDelay - 최소 지연 시간 설정 (null이면 지연 없음)
 * 
 * @example
 * ```ts
 * // 기본 사용법
 * const startTime = Date.now();
 * const data = await fetchData();
 * await ensureMinDelay(startTime, { min: 300, max: 1000 });
 * setIsLoading(false);
 * 
 * // 커스텀 지연 시간
 * await ensureMinDelay(startTime, { min: 500, max: 1500 });
 * 
 * // 지연 비활성화
 * await ensureMinDelay(startTime, null);
 * ```
 * 
 * @example
 * ```ts
 * // React 컴포넌트에서 사용
 * useEffect(() => {
 *   const loadData = async () => {
 *     const startTime = Date.now();
 *     setIsLoading(true);
 *     
 *     const data = await fetchData();
 *     
 *     // 최소 300ms ~ 1000ms 지연 보장
 *     await ensureMinDelay(startTime, DEFAULT_MIN_LOADING_DELAY);
 *     
 *     setData(data);
 *     setIsLoading(false);
 *   };
 *   
 *   loadData();
 * }, []);
 * ```
 */
export async function ensureMinDelay(
  startTime: number,
  minDelay: MinLoadingDelay | null | undefined
): Promise<void> {
  // 지연이 비활성화된 경우 즉시 반환
  if (!minDelay) {
    return;
  }

  // 경과 시간 계산
  const elapsed = Date.now() - startTime;
  
  // 랜덤 지연 시간 생성
  const delay = getRandomDelay(minDelay.min, minDelay.max);
  
  // 경과 시간이 생성된 지연 시간보다 짧으면 부족한 시간만큼 대기
  if (elapsed < delay) {
    await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
  }
  
  // 이미 지연 시간보다 오래 걸렸다면 추가 대기 없이 반환
}

