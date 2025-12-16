/**
 * PostDetailPage 관련 모듈 배럴 파일
 */

// 타입
export type { RawComment, PostTypeConfig, PostType } from "./types";

// 상수
export { MAX_COMMENT_DEPTH, POST_TYPE_CONFIG } from "./constants";

// 유틸리티 함수
export { getRelativeTime, formatDateTime, normalizeComments, countAllComments } from "./lib";

// 목 데이터 (개발용)
export { initialComments } from "./mock-data";

// 훅
export { usePostComments } from "./usePostComments";

