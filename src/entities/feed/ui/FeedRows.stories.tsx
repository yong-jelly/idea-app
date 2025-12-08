import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";

// Row Components
import {
  TextPostRow,
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
  AnnouncementRow,
  DiscussionRow,
  FeedbackRow,
  MilestoneProgressRow,
  RewardRow,
  RewardRowCompact,
  ChangelogRow,
  ChangelogRowCompact,
} from "./rows";

// Types
import type {
  TextPost,
  ProjectUpdatePost,
  MilestoneAchievedPost,
  FeatureAcceptedPost,
  DevPost,
  FeedbackPost,
  MilestoneProgress,
  Reward,
  ChangelogEntry,
} from "../model/feed.types";

// ========== 데모 데이터 ==========

const mockAuthor = {
  id: "1",
  username: "indie_dev",
  displayName: "김인디",
  avatar: undefined,
};

const mockAuthorWithRole = {
  ...mockAuthor,
  role: "Founder",
};

const mockInteractions = {
  likesCount: 156,
  commentsCount: 45,
  repostsCount: 23,
  bookmarksCount: 67,
  isLiked: false,
  isReposted: false,
  isBookmarked: false,
};

const mockTextPost: TextPost = {
  id: "1",
  type: "text",
  author: mockAuthor,
  content: "오늘 드디어 AI 코드 리뷰 도구의 베타 버전을 완성했습니다! 🎉\n\n정말 긴 여정이었지만, 커뮤니티의 응원 덕분에 여기까지 올 수 있었어요. 곧 테스터 모집을 시작할 예정이니 많은 관심 부탁드립니다.",
  interactions: mockInteractions,
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
};

const mockProjectUpdatePost: ProjectUpdatePost = {
  id: "2",
  type: "project_update",
  author: mockAuthor,
  content: "오픈소스 API 게이트웨이 v2.0을 릴리즈했습니다! 🚀\n\n주요 변경사항:\n- 성능 50% 개선\n- 새로운 인증 플러그인\n- 향상된 로깅 시스템\n\nGitHub에서 확인해주세요!",
  projectId: "p1",
  projectTitle: "오픈소스 API 게이트웨이",
  interactions: mockInteractions,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
};

const mockMilestonePost: MilestoneAchievedPost = {
  id: "3",
  type: "milestone",
  author: mockAuthor,
  content: "실시간 협업 화이트보드 프로젝트가 첫 번째 마일스톤을 달성했습니다! 기본 캔버스 기능과 실시간 동기화가 완성되었어요.",
  projectId: "p2",
  projectTitle: "실시간 협업 화이트보드",
  milestoneTitle: "MVP 기능 완성",
  interactions: { ...mockInteractions, isLiked: true, isBookmarked: true },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
};

const mockFeatureAcceptedPost: FeatureAcceptedPost = {
  id: "4",
  type: "feature_accepted",
  author: mockAuthor,
  content: "커뮤니티에서 요청해주신 '오프라인 모드' 기능을 추가하기로 결정했습니다! 다음 업데이트에서 만나보실 수 있어요.",
  projectId: "p3",
  projectTitle: "모바일 퍼즐 게임",
  featureTitle: "오프라인 모드 지원",
  interactions: { ...mockInteractions, isReposted: true },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
};

const mockAnnouncement: DevPost = {
  id: "dp1",
  type: "announcement",
  title: "🎉 v2.0 베타 테스트 시작!",
  content: "안녕하세요! 드디어 v2.0 베타 버전을 공개합니다. 새로운 AI 기능과 개선된 UI를 체험해보세요. 베타 테스터 피드백을 기다립니다!",
  author: mockAuthorWithRole,
  isPinned: true,
  interactions: { likesCount: 45, commentsCount: 23, isLiked: false },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
};

const mockDiscussion: DevPost = {
  id: "dp2",
  type: "discussion",
  title: "다음 기능 투표: 어떤 기능을 먼저 개발할까요?",
  content: "다음 업데이트에 추가할 기능을 고민 중입니다.\n\n1) 다크모드 지원\n2) 모바일 앱\n3) API 확장\n\n여러분의 의견을 들려주세요!",
  author: { ...mockAuthorWithRole, role: "Developer" },
  interactions: { likesCount: 67, commentsCount: 89, isLiked: true },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
};

const mockBugFeedback: FeedbackPost = {
  id: "fb1",
  type: "bug",
  title: "Safari에서 이미지 로딩 오류",
  content: "Safari 브라우저에서 이미지가 간헐적으로 로딩되지 않는 문제가 있습니다. 재현 방법: 1. Safari에서 갤러리 페이지 접근 2. 스크롤...",
  author: mockAuthor,
  status: "in_progress",
  votesCount: 23,
  isVoted: true,
  commentsCount: 12,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
};

const mockFeatureFeedback: FeedbackPost = {
  id: "fb2",
  type: "feature",
  title: "다국어 지원 요청",
  content: "영어, 일본어 등 다국어 지원이 되면 좋겠습니다. 해외 사용자들도 많이 관심을 가지고 있어요!",
  author: mockAuthor,
  status: "open",
  votesCount: 156,
  isVoted: false,
  commentsCount: 34,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
};

const mockMilestone: MilestoneProgress = {
  id: "m1",
  title: "베타 테스트",
  description: "1000명의 베타 테스터와 함께 제품 검증",
  targetDate: "2024-12-01",
  deliverables: ["베타 테스터 모집", "피드백 시스템 구축", "버그 수정"],
  isCompleted: false,
  progress: 75,
};

const mockCompletedMilestone: MilestoneProgress = {
  id: "m2",
  title: "MVP 출시",
  description: "핵심 기능을 포함한 최소 기능 제품 출시",
  targetDate: "2024-10-01",
  deliverables: ["코어 기능 구현", "기본 UI 디자인", "사용자 인증"],
  isCompleted: true,
  completedAt: "2024-09-28",
  progress: 100,
};

const mockReward: Reward = {
  id: "r1",
  title: "얼리버드 서포터",
  description: "프로젝트 초기 지원자를 위한 특별 보상",
  pointsRequired: 100,
  quantity: 500,
  claimedCount: 342,
  type: "digital",
};

const mockPremiumReward: Reward = {
  id: "r2",
  title: "프리미엄 1개월 이용권",
  description: "프리미엄 기능을 1개월간 무료로 이용",
  pointsRequired: 500,
  quantity: 100,
  claimedCount: 78,
  type: "access",
};

const mockChangelog: ChangelogEntry = {
  id: "cl1",
  version: "2.0.0-beta",
  title: "v2.0 베타 릴리즈",
  description: "대규모 업데이트! AI 기능과 새로운 UI를 만나보세요.",
  changes: [
    { type: "feature", description: "AI 기반 자동 추천 시스템 추가" },
    { type: "feature", description: "다크모드 지원" },
    { type: "improvement", description: "전체 UI/UX 개선" },
    { type: "fix", description: "Safari 이미지 로딩 오류 수정" },
    { type: "breaking", description: "API v1 지원 종료" },
  ],
  releasedAt: "2024-12-01",
};

// ========== Decorator ==========

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Story />
    </div>
  </BrowserRouter>
);

// ========== Stories ==========

/**
 * # 피드 Row 컴포넌트
 * 
 * 이 페이지에서는 프로젝트에서 사용되는 모든 피드 Row 컴포넌트를 확인할 수 있습니다.
 * 
 * ## 피드 종류 개요
 * 
 * ### 1. 일반 피드 (4종)
 * - **TextPostRow** - 일반 텍스트 포스트
 * - **ProjectUpdateRow** - 프로젝트 업데이트
 * - **MilestoneAchievedRow** - 마일스톤 달성
 * - **FeatureAcceptedRow** - 기능 제안 수락
 * 
 * ### 2. 개발사 피드 (2종)
 * - **AnnouncementRow** - 공지/업데이트 안내
 * - **DiscussionRow** - 토론/투표
 * 
 * ### 3. 피드백 피드 (4종)
 * - **FeedbackRow** - 버그, 기능 요청, 개선 제안, 질문
 * 
 * ### 4. 기타 (3종)
 * - **MilestoneProgressRow** - 마일스톤 진행 상황
 * - **RewardRow** - 리워드 교환
 * - **ChangelogRow** - 변경사항
 */
const meta = {
  title: "Entities/Feed/FeedRows",
  component: TextPostRow,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
프로젝트의 다양한 피드 타입을 표시하는 Row 컴포넌트 모음입니다.

**총 14가지 피드 타입**을 지원하며, 각 타입별로 최적화된 UI를 제공합니다.

## 사용법

\`\`\`tsx
import { TextPostRow, ProjectUpdateRow } from "@/entities/feed";

// 일반 텍스트 포스트
<TextPostRow 
  post={textPost} 
  onLike={() => {}} 
/>

// 프로젝트 업데이트
<ProjectUpdateRow 
  post={updatePost} 
  onComment={() => {}} 
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TextPostRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== 일반 피드 ==========

export const TextPost: Story = {
  name: "1-1. TextPostRow (일반 텍스트)",
  render: () => (
    <TextPostRow
      post={mockTextPost}
      onLike={() => console.log("Like")}
      onComment={() => console.log("Comment")}
      onRepost={() => console.log("Repost")}
      onBookmark={() => console.log("Bookmark")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "사용자가 작성한 일반 텍스트 포스트입니다. 이미지 첨부도 지원합니다.",
      },
    },
  },
};

export const ProjectUpdate: Story = {
  name: "1-2. ProjectUpdateRow (프로젝트 업데이트)",
  render: () => (
    <ProjectUpdateRow
      post={mockProjectUpdatePost}
      onLike={() => console.log("Like")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "프로젝트의 새로운 업데이트(릴리즈, 변경사항 등)를 알리는 포스트입니다.",
      },
    },
  },
};

export const MilestoneAchieved: Story = {
  name: "1-3. MilestoneAchievedRow (마일스톤 달성)",
  render: () => (
    <MilestoneAchievedRow
      post={mockMilestonePost}
      onLike={() => console.log("Like")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "프로젝트가 마일스톤을 달성했을 때 표시되는 축하 포스트입니다.",
      },
    },
  },
};

export const FeatureAccepted: Story = {
  name: "1-4. FeatureAcceptedRow (기능 제안 수락)",
  render: () => (
    <FeatureAcceptedRow
      post={mockFeatureAcceptedPost}
      onLike={() => console.log("Like")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "커뮤니티에서 요청한 기능이 수락되었을 때 표시되는 포스트입니다.",
      },
    },
  },
};

// ========== 개발사 피드 ==========

export const Announcement: Story = {
  name: "2-1. AnnouncementRow (공지사항)",
  render: () => (
    <AnnouncementRow
      post={mockAnnouncement}
      onLike={() => console.log("Like")}
      onComment={() => console.log("Comment")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "개발사에서 발행하는 공지사항이나 업데이트 안내입니다. 고정 기능을 지원합니다.",
      },
    },
  },
};

export const Discussion: Story = {
  name: "2-2. DiscussionRow (토론)",
  render: () => (
    <DiscussionRow
      post={mockDiscussion}
      participantsCount={89}
      onLike={() => console.log("Like")}
      onJoin={() => console.log("Join")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "개발사에서 시작한 토론이나 투표입니다. 커뮤니티 참여를 유도합니다.",
      },
    },
  },
};

// ========== 피드백 피드 ==========

export const BugReport: Story = {
  name: "3-1. FeedbackRow - 버그 리포트",
  render: () => (
    <FeedbackRow
      feedback={mockBugFeedback}
      onVote={() => console.log("Vote")}
      onClick={() => console.log("Click")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "사용자가 제보한 버그 리포트입니다. 투표와 상태 표시를 지원합니다.",
      },
    },
  },
};

export const FeatureRequest: Story = {
  name: "3-2. FeedbackRow - 기능 요청",
  render: () => (
    <FeedbackRow
      feedback={mockFeatureFeedback}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "사용자가 요청한 새로운 기능입니다.",
      },
    },
  },
};

export const AllFeedbackTypes: Story = {
  name: "3-3. FeedbackRow - 모든 타입",
  render: () => (
    <div className="space-y-4">
      <FeedbackRow
        feedback={{ ...mockBugFeedback, type: "bug", status: "resolved" }}
        onVote={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockFeatureFeedback, type: "feature", status: "in_progress" }}
        onVote={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockBugFeedback, id: "fb3", type: "improvement", title: "검색 기능 개선 제안", status: "open" }}
        onVote={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockBugFeedback, id: "fb4", type: "question", title: "API 사용법 문의", status: "closed" }}
        onVote={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "버그, 기능 요청, 개선 제안, 질문 - 4가지 피드백 타입을 모두 보여줍니다.",
      },
    },
  },
};

// ========== 마일스톤 ==========

export const MilestoneInProgress: Story = {
  name: "4-1. MilestoneProgressRow (진행 중)",
  render: () => (
    <MilestoneProgressRow
      milestone={mockMilestone}
      onClick={() => console.log("Click")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "진행 중인 마일스톤의 상태와 진행률을 보여줍니다.",
      },
    },
  },
};

export const MilestoneCompleted: Story = {
  name: "4-2. MilestoneProgressRow (완료)",
  render: () => (
    <MilestoneProgressRow
      milestone={mockCompletedMilestone}
      onClick={() => console.log("Click")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "완료된 마일스톤을 보여줍니다.",
      },
    },
  },
};

// ========== 리워드 ==========

export const RewardCard: Story = {
  name: "5-1. RewardRow (기본)",
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <RewardRow
        reward={mockReward}
        userPoints={500}
        onClaim={() => console.log("Claim")}
      />
      <RewardRow
        reward={mockPremiumReward}
        userPoints={200}
        onClaim={() => console.log("Claim")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "프로젝트 리워드를 표시합니다. 포인트 보유량에 따라 교환 가능 여부가 달라집니다.",
      },
    },
  },
};

export const RewardCompact: Story = {
  name: "5-2. RewardRowCompact (컴팩트)",
  render: () => (
    <div className="space-y-2">
      <RewardRowCompact reward={mockReward} onClick={() => console.log("Click")} />
      <RewardRowCompact reward={mockPremiumReward} onClick={() => console.log("Click")} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "리워드의 컴팩트한 버전입니다. 목록이나 사이드바에 적합합니다.",
      },
    },
  },
};

// ========== 변경사항 ==========

export const ChangelogCard: Story = {
  name: "6-1. ChangelogRow (기본)",
  render: () => (
    <ChangelogRow
      entry={mockChangelog}
      onClick={() => console.log("Click")}
      onViewMore={() => console.log("View more")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "프로젝트 릴리즈/변경사항 히스토리를 표시합니다.",
      },
    },
  },
};

export const ChangelogCompact: Story = {
  name: "6-2. ChangelogRowCompact (컴팩트)",
  render: () => (
    <div className="space-y-2">
      <ChangelogRowCompact entry={mockChangelog} onClick={() => console.log("Click")} />
      <ChangelogRowCompact
        entry={{ ...mockChangelog, version: "1.5.2", title: "버그 수정" }}
        onClick={() => console.log("Click")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "변경사항의 컴팩트한 버전입니다.",
      },
    },
  },
};

// ========== 통합 예시 ==========

export const FeedTimeline: Story = {
  name: "7. 피드 타임라인 예시",
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
        📮 피드 타임라인
      </h2>
      <TextPostRow post={mockTextPost} />
      <ProjectUpdateRow post={mockProjectUpdatePost} />
      <MilestoneAchievedRow post={mockMilestonePost} />
      <FeatureAcceptedRow post={mockFeatureAcceptedPost} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "실제 피드 타임라인에서 보이는 것처럼 여러 타입의 포스트가 함께 표시되는 예시입니다.",
      },
    },
  },
};

export const DevFeedExample: Story = {
  name: "8. 개발사 피드 예시",
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
        📢 개발사 피드
      </h2>
      <AnnouncementRow post={mockAnnouncement} />
      <DiscussionRow post={mockDiscussion} participantsCount={89} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "개발사가 운영하는 공지사항과 토론 피드 예시입니다.",
      },
    },
  },
};

