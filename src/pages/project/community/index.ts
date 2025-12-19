// 커뮤니티 페이지 Export 정리

// 타입
export type {
  PostComment,
  VoteOption,
  DevPost,
  UserFeedback,
  ChangelogChange,
  ChangelogEntry,
  TopSupporter,
  ClaimedRewardHistory,
  TabType,
} from "./types";

// 상수
export {
  FEEDBACK_TYPE_INFO,
  FEEDBACK_STATUS_INFO,
  POST_TYPE_INFO,
  REWARD_TYPE_INFO,
  PLATFORM_ICONS,
  CHANGE_TYPE_INFO,
  MAX_VISIBLE_CHANGES,
  extractDomain,
} from "./constants";

// 더미 데이터
export {
  dummyDevPosts,
  dummyFeedback,
  dummyMilestones,
  dummyRewards,
  dummyPointRules,
  dummyTopSupporters,
  dummyClaimedRewards,
  dummyChangelog,
} from "./data";

// 컴포넌트
export { DevPostCard } from "./components/DevPostCard";
export { DevPostCardSkeleton } from "./components/DevPostCardSkeleton";
export { CommunityPageSkeleton } from "./components/CommunityPageSkeleton";
export { FeedbackCardSkeleton } from "./components/FeedbackCardSkeleton";

// 탭 컴포넌트
export { DevFeedTab } from "./tabs/DevFeedTab";
export { FeedbackTab } from "./tabs/FeedbackTab";
export { MilestonesTab } from "./tabs/MilestonesTab";
export { RewardsTab } from "./tabs/RewardsTab";
export { ChangelogTab } from "./tabs/ChangelogTab";

// 훅
export { useModal, useModalWithClose } from "./hooks/useModal";
export { useImageUpload } from "./hooks/useImageUpload";
export { useDevFeedComments } from "./tabs/hooks/useDevFeedComments";

// 유틸리티
export { normalizeComments, countAllComments } from "./utils/comment.utils";
export { updateVoteOptions } from "./utils/vote.utils";
export { getMilestoneProgress, getMilestoneDueLabel } from "./utils/milestone.utils";
export { fileToDataURL, filesToDataURLs } from "./utils/image.utils";

