import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { FeedbackRow, type FeedbackData } from "./FeedbackRow";

// ========== 데모 데이터 ==========

const mockFeatureFeedback: FeedbackData = {
  id: "fb1",
  type: "feature",
  status: "in_progress",
  title: "다국어 지원 요청",
  content: "영어, 일본어 등 다국어 지원이 되면 좋겠습니다. 해외 사용자들도 많이 관심을 가지고 있어요!",
  author: {
    id: "u1",
    username: "global_user",
    displayName: "글로벌유저",
  },
  votesCount: 156,
  isVoted: true,
  commentsCount: 34,
  hasDevResponse: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
};

const mockBugFeedback: FeedbackData = {
  id: "fb2",
  type: "bug",
  status: "resolved",
  title: "Safari에서 이미지 로딩 오류",
  content: "Safari 브라우저에서 이미지가 간헐적으로 로딩되지 않는 문제가 있습니다. 재현 방법과 환경 정보를 첨부합니다.",
  images: ["image1.png"],
  author: {
    id: "u2",
    username: "mac_user",
    displayName: "맥유저",
  },
  votesCount: 23,
  isVoted: false,
  commentsCount: 12,
  hasDevResponse: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
};

const mockImprovementFeedback: FeedbackData = {
  id: "fb3",
  type: "improvement",
  status: "open",
  title: "검색 기능 개선 제안",
  content: "현재 검색이 제목만 검색하는데, 내용도 함께 검색되면 좋겠습니다. 필터 기능도 추가해주세요!",
  author: {
    id: "u3",
    username: "power_user",
    displayName: "파워유저",
  },
  votesCount: 89,
  isVoted: false,
  commentsCount: 15,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
};

const mockQuestionFeedback: FeedbackData = {
  id: "fb4",
  type: "question",
  status: "closed",
  title: "API 사용 방법 문의",
  content: "REST API를 사용하려고 하는데 인증 방식이 어떻게 되나요? 문서에서 찾을 수가 없네요.",
  author: {
    id: "u4",
    username: "api_user",
    displayName: "API유저",
  },
  votesCount: 5,
  isVoted: false,
  commentsCount: 3,
  hasDevResponse: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
};

const mockHighVoteFeedback: FeedbackData = {
  id: "fb5",
  type: "feature",
  status: "open",
  title: "다크모드 지원",
  content: "눈의 피로를 줄이기 위해 다크모드를 지원해주세요! 많은 사용자들이 원하는 기능입니다.",
  author: {
    id: "u5",
    username: "dark_lover",
    displayName: "다크모드매니아",
  },
  votesCount: 523,
  isVoted: true,
  commentsCount: 87,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
};

// ========== Decorator ==========

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Story />
    </div>
  </BrowserRouter>
);

// ========== Meta ==========

/**
 * # 피드백 Row 컴포넌트
 * 
 * 피드백 목록에서 각 피드백을 표시하는 컴포넌트입니다.
 * GitHub Issues UI를 참고하여 설계되었습니다.
 * 
 * ## 주요 기능
 * - 피드백 타입 표시 (버그, 기능 요청, 개선 제안, 질문)
 * - 상태 표시 (접수됨, 진행 중, 해결됨, 닫힘)
 * - 투표 기능
 * - 댓글 수 표시
 * - 개발팀 답변 여부 표시
 * - 이미지 첨부 표시
 * - 컴팩트 모드 지원
 * 
 * ## 사용 위치
 * - `/project/:id/community/feedback` - 피드백 목록
 */
const meta = {
  title: "Entities/Project/FeedbackRows",
  component: FeedbackRow,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
피드백 목록에서 각 피드백을 표시하는 Row 컴포넌트입니다.

## 사용법

\`\`\`tsx
import { FeedbackRow } from "@/entities/project";

<FeedbackRow
  feedback={feedback}
  onClick={() => navigate(\`/project/\${id}/community/feedback/\${feedback.id}\`)}
  onVote={() => handleVote(feedback.id)}
/>
\`\`\`

## 피드백 타입

| 타입 | 라벨 | 아이콘 색상 |
|------|------|------------|
| bug | 버그 | 빨간색 |
| feature | 기능 요청 | 주황색 |
| improvement | 개선 제안 | 파란색 |
| question | 질문 | 청록색 |

## 피드백 상태

| 상태 | 라벨 | 설명 |
|------|------|------|
| open | 접수됨 | 새로 등록된 피드백 |
| in_progress | 진행 중 | 개발팀이 검토/작업 중 |
| resolved | 해결됨 | 문제 해결 또는 기능 구현 완료 |
| closed | 닫힘 | 처리 완료 또는 반려됨 |
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FeedbackRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== Stories ==========

export const FeatureRequest: Story = {
  name: "1-1. 기능 요청",
  render: () => (
    <FeedbackRow
      feedback={mockFeatureFeedback}
      onClick={() => console.log("Navigate to feedback")}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
기능 요청 타입의 피드백입니다.

- 주황색 라이트벌브 아이콘
- 개발팀 답변 뱃지 표시
- 높은 투표수와 댓글 수
        `,
      },
    },
  },
};

export const BugReport: Story = {
  name: "1-2. 버그 리포트",
  render: () => (
    <FeedbackRow
      feedback={mockBugFeedback}
      onClick={() => console.log("Navigate to feedback")}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
버그 리포트 타입의 피드백입니다.

- 빨간색 버그 아이콘
- 이미지 첨부 표시
- "해결됨" 상태
        `,
      },
    },
  },
};

export const Improvement: Story = {
  name: "1-3. 개선 제안",
  render: () => (
    <FeedbackRow
      feedback={mockImprovementFeedback}
      onClick={() => console.log("Navigate to feedback")}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
개선 제안 타입의 피드백입니다.

- 파란색 스파클 아이콘
- "접수됨" 상태 (새로운 피드백)
        `,
      },
    },
  },
};

export const Question: Story = {
  name: "1-4. 질문",
  render: () => (
    <FeedbackRow
      feedback={mockQuestionFeedback}
      onClick={() => console.log("Navigate to feedback")}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
질문 타입의 피드백입니다.

- 청록색 메시지 아이콘
- "닫힘" 상태 (처리 완료)
        `,
      },
    },
  },
};

export const HighVotes: Story = {
  name: "1-5. 높은 투표수",
  render: () => (
    <FeedbackRow
      feedback={mockHighVoteFeedback}
      onClick={() => console.log("Navigate to feedback")}
      onVote={() => console.log("Vote")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
높은 투표수를 받은 인기 피드백입니다.

- 투표수가 많으면 formatNumber로 축약 표시 (예: 1.2K)
- 커뮤니티에서 많은 관심을 받는 기능 요청
        `,
      },
    },
  },
};

export const CompactMode: Story = {
  name: "2-1. 컴팩트 모드",
  render: () => (
    <div className="space-y-2 max-w-lg">
      <FeedbackRow feedback={mockFeatureFeedback} compact onClick={() => {}} />
      <FeedbackRow feedback={mockBugFeedback} compact onClick={() => {}} />
      <FeedbackRow feedback={mockImprovementFeedback} compact onClick={() => {}} />
      <FeedbackRow feedback={mockQuestionFeedback} compact onClick={() => {}} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
컴팩트 모드의 피드백 Row입니다.

- 사이드바나 위젯에 적합한 작은 사이즈
- 핵심 정보만 표시 (투표수, 타입, 제목, 상태, 댓글 수)
- 내용 미리보기 생략
        `,
      },
    },
  },
};

export const AllStatuses: Story = {
  name: "2-2. 모든 상태",
  render: () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500 mb-2">상태별 피드백</h3>
      <FeedbackRow
        feedback={{ ...mockImprovementFeedback, status: "open" }}
        onClick={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockFeatureFeedback, status: "in_progress" }}
        onClick={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockBugFeedback, status: "resolved" }}
        onClick={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockQuestionFeedback, status: "closed" }}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
모든 상태의 피드백을 보여줍니다.

1. **접수됨** (open) - 회색, 새로 등록된 피드백
2. **진행 중** (in_progress) - 파란색, 개발팀이 검토 중
3. **해결됨** (resolved) - 녹색, 문제 해결됨
4. **닫힘** (closed) - 회색 어두움, 처리 완료
        `,
      },
    },
  },
};

export const FeedbackList: Story = {
  name: "3. 피드백 목록 예시",
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          💬 피드백 (5)
        </h2>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            전체
          </span>
          <span className="px-2 py-1 rounded text-xs text-surface-500">기능 요청</span>
          <span className="px-2 py-1 rounded text-xs text-surface-500">버그</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <FeedbackRow feedback={mockHighVoteFeedback} onClick={() => {}} onVote={() => {}} />
        <FeedbackRow feedback={mockFeatureFeedback} onClick={() => {}} onVote={() => {}} />
        <FeedbackRow feedback={mockBugFeedback} onClick={() => {}} onVote={() => {}} />
        <FeedbackRow feedback={mockImprovementFeedback} onClick={() => {}} onVote={() => {}} />
        <FeedbackRow feedback={mockQuestionFeedback} onClick={() => {}} onVote={() => {}} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
피드백 목록 페이지에서 보이는 형태입니다.

**정렬 기준:**
- 기본: 투표수 높은 순
- 최신순, 댓글 많은 순 등 옵션 제공

**필터:**
- 타입별 (전체, 기능 요청, 버그, 개선 제안, 질문)
- 상태별 (접수됨, 진행 중, 해결됨)
        `,
      },
    },
  },
};

export const FeedbackWithDevResponse: Story = {
  name: "4. 개발팀 답변 있는 피드백",
  render: () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-surface-500 mb-2">개발팀이 답변한 피드백</h3>
      <FeedbackRow
        feedback={{ ...mockFeatureFeedback, hasDevResponse: true }}
        onClick={() => {}}
      />
      <FeedbackRow
        feedback={{ ...mockBugFeedback, hasDevResponse: true }}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
개발팀이 답변한 피드백입니다.

- "개발팀 답변" 뱃지가 표시됩니다
- 사용자가 공식 답변이 있는 피드백을 빠르게 식별할 수 있습니다
        `,
      },
    },
  },
};

