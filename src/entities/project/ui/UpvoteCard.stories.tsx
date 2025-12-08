import type { Meta, StoryObj } from "@storybook/react";
import { UpvoteCard } from "./UpvoteCard";

const meta: Meta<typeof UpvoteCard> = {
  title: "Entities/Project/UpvoteCard",
  component: UpvoteCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
프로젝트 상세 페이지에서 사용되는 응원 카드 컴포넌트입니다.

## 기능
- 오늘의 순위 표시
- 응원하기 버튼 (토글 가능)
- 응원 카운트 표시

## 사용 예시
\`\`\`tsx
<UpvoteCard
  rank={1}
  upvoteCount={234}
  isUpvoted={false}
  onUpvote={() => console.log('응원!')}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    rank: {
      control: { type: "number", min: 1, max: 100 },
      description: "현재 순위",
    },
    upvoteCount: {
      control: { type: "number", min: 0 },
      description: "업보트 수",
    },
    isUpvoted: {
      control: "boolean",
      description: "업보트 여부",
    },
    onUpvote: {
      action: "upvote",
      description: "업보트 클릭 핸들러",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UpvoteCard>;

/** 기본 상태 */
export const Default: Story = {
  args: {
    rank: 1,
    upvoteCount: 234,
    isUpvoted: false,
  },
};

/** 업보트된 상태 */
export const Upvoted: Story = {
  args: {
    rank: 1,
    upvoteCount: 235,
    isUpvoted: true,
  },
};

/** 낮은 순위 */
export const LowRank: Story = {
  args: {
    rank: 42,
    upvoteCount: 56,
    isUpvoted: false,
  },
};

/** 높은 업보트 수 */
export const HighUpvotes: Story = {
  args: {
    rank: 1,
    upvoteCount: 12500,
    isUpvoted: true,
  },
};

