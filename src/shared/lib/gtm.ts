/**
 * Google Tag Manager (GTM) 유틸리티 함수
 * 
 * SPA 환경에서 페이지뷰 및 커스텀 이벤트를 추적하기 위한 헬퍼 함수들
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

/**
 * dataLayer에 이벤트를 푸시합니다.
 * 
 * @param eventName - 이벤트 이름 (예: 'page_view', 'click', 'custom_event')
 * @param data - 이벤트와 함께 전송할 추가 데이터
 * 
 * @example
 * ```ts
 * // 페이지뷰 추적
 * pushToDataLayer('page_view', {
 *   page_path: '/explore',
 *   page_title: '프로젝트 탐색'
 * });
 * 
 * // 커스텀 이벤트
 * pushToDataLayer('project_view', {
 *   project_id: '123',
 *   project_name: 'My Project'
 * });
 * ```
 */
export function pushToDataLayer(
  eventName: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.dataLayer) {
    // 서버 사이드 렌더링 환경이거나 dataLayer가 없는 경우
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GTM] dataLayer is not available');
    }
    return;
  }

  const eventData: Record<string, unknown> = {
    event: eventName,
    ...data,
  };

  window.dataLayer.push(eventData);

  if (process.env.NODE_ENV === 'development') {
    console.log('[GTM] Event pushed:', eventData);
  }
}

/**
 * 페이지뷰 이벤트를 추적합니다.
 * 
 * SPA 환경에서 페이지 전환 시 호출하여 페이지뷰를 GTM에 전송합니다.
 * 
 * @param path - 현재 페이지 경로 (예: '/explore', '/project/123')
 * @param title - 페이지 제목 (선택사항)
 * 
 * @example
 * ```ts
 * // 라우터에서 사용
 * useEffect(() => {
 *   trackPageView(location.pathname, document.title);
 * }, [location.pathname]);
 * ```
 */
export function trackPageView(path: string, title?: string): void {
  pushToDataLayer('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * 커스텀 이벤트를 추적합니다.
 * 
 * @param eventName - 이벤트 이름
 * @param eventData - 이벤트 데이터
 * 
 * @example
 * ```ts
 * // 프로젝트 조회 추적
 * trackEvent('project_view', {
 *   project_id: '123',
 *   project_name: 'My Project'
 * });
 * 
 * // 버튼 클릭 추적
 * trackEvent('button_click', {
 *   button_name: 'create_project',
 *   location: 'header'
 * });
 * ```
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>
): void {
  pushToDataLayer(eventName, eventData);
}

