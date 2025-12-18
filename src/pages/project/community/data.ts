// 더미 데이터 (개발용)
import type { DevPost, UserFeedback, ChangelogEntry, TopSupporter, ClaimedRewardHistory } from "./types";
import type { Milestone, Reward, PointRule } from "@/entities/project";

export const dummyDevPosts: DevPost[] = [
  {
    id: "dp1",
    type: "announcement",
    title: "🎉 v2.0 베타 테스트 시작!",
    content: "안녕하세요! 드디어 v2.0 베타 버전을 공개합니다. 새로운 AI 기능과 개선된 UI를 체험해보세요. 베타 테스터 피드백을 기다립니다!",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    isPinned: true,
    likesCount: 45,
    isLiked: false,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    comments: [],
  },
  {
    id: "dp2",
    type: "update",
    title: "서버 점검 안내 (12/10)",
    content: "12월 10일 새벽 2시부터 4시까지 서버 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    likesCount: 12,
    isLiked: false,
    commentsCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    comments: [],
  },
  {
    id: "dp4",
    type: "vote",
    title: "🗳️ 다음 업데이트에 어떤 기능을 추가할까요?",
    content: "여러분의 의견을 듣고 싶습니다! 가장 원하는 기능에 투표해주세요.",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    likesCount: 34,
    isLiked: false,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    voteOptions: [
      { id: "vo1", text: "다크모드 지원", votesCount: 45 },
      { id: "vo2", text: "모바일 앱 출시", votesCount: 38 },
      { id: "vo3", text: "API 확장", votesCount: 22 },
      { id: "vo4", text: "알림 기능 개선", votesCount: 18 },
    ],
    votedOptionId: undefined,
    totalVotes: 123,
  },
];

export const dummyFeedback: UserFeedback[] = [
  {
    id: "fb1",
    type: "feature",
    title: "다국어 지원 요청",
    content: "영어, 일본어 등 다국어 지원이 되면 좋겠습니다. 해외 사용자들도 많이 관심을 가지고 있어요!",
    author: {
      id: "u3",
      username: "global_user",
      displayName: "글로벌유저",
    },
    status: "in_progress",
    votesCount: 156,
    isVoted: true,
    commentsCount: 34,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "fb2",
    type: "bug",
    title: "Safari에서 이미지 로딩 오류",
    content: "Safari 브라우저에서 이미지가 간헐적으로 로딩되지 않는 문제가 있습니다. 아래 스크린샷을 참고해주세요.",
    images: [
      "https://placehold.co/400x300/f8d7da/721c24?text=Safari+Error",
      "https://placehold.co/400x300/d4edda/155724?text=Expected",
    ],
    author: {
      id: "u4",
      username: "mac_user",
      displayName: "맥유저",
    },
    status: "resolved",
    votesCount: 23,
    isVoted: false,
    commentsCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "fb3",
    type: "improvement",
    title: "검색 기능 개선 제안",
    content: "현재 검색이 제목만 검색하는데, 내용도 함께 검색되면 좋겠습니다. 필터 기능도 추가해주세요!",
    author: {
      id: "u5",
      username: "power_user",
      displayName: "파워유저",
    },
    status: "open",
    votesCount: 89,
    isVoted: false,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

// 더미 데이터는 원본 파일에서 가져오거나 여기에 추가
export const dummyMilestones: Milestone[] = [];
export const dummyRewards: Reward[] = [];
export const dummyPointRules: PointRule[] = [];
export const dummyTopSupporters: TopSupporter[] = [];
export const dummyClaimedRewards: ClaimedRewardHistory[] = [];
export const dummyChangelog: ChangelogEntry[] = [];


