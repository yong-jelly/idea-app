import type { Meta, StoryObj } from "@storybook/react";
import { Inbox, FileText, Bookmark, Search, MessageSquare } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/UI/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "데이터가 없을 때 사용자에게 친절한 안내를 제공하는 빈 상태 컴포넌트입니다.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "패딩 크기",
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * 기본 빈 상태입니다.
 * 아이콘, 제목, 설명을 포함합니다.
 */
export const Default: Story = {
  args: {
    icon: <Inbox className="h-8 w-8" />,
    title: "데이터가 없습니다",
    description: "표시할 내용이 없습니다.",
  },
};

/**
 * 피드가 비어있을 때 사용하는 예시입니다.
 */
export const EmptyFeed: Story = {
  args: {
    icon: <MessageSquare className="h-8 w-8" />,
    title: "피드가 비어있습니다",
    description: "아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!",
    action: (
      <Button size="sm" variant="primary">
        포스트 작성
      </Button>
    ),
  },
};

/**
 * 검색 결과가 없을 때 사용하는 예시입니다.
 */
export const EmptySearch: Story = {
  args: {
    icon: <Search className="h-8 w-8" />,
    title: "검색 결과가 없습니다",
    description: "다른 키워드로 검색해보세요.",
  },
};

/**
 * 저장한 항목이 없을 때 사용하는 예시입니다.
 */
export const EmptyBookmarks: Story = {
  args: {
    icon: <Bookmark className="h-8 w-8" />,
    title: "저장한 항목이 없습니다",
    description: "관심 있는 항목을 저장하면 여기에 표시됩니다.",
  },
};

/**
 * 문서가 없을 때 사용하는 예시입니다.
 */
export const EmptyDocuments: Story = {
  args: {
    icon: <FileText className="h-8 w-8" />,
    title: "문서가 없습니다",
    description: "첫 번째 문서를 작성해보세요.",
    action: (
      <Button size="sm" variant="outline">
        문서 작성
      </Button>
    ),
  },
};

/**
 * 아이콘 없이 사용하는 예시입니다.
 */
export const WithoutIcon: Story = {
  args: {
    title: "내용이 없습니다",
    description: "표시할 내용이 없습니다.",
  },
};

/**
 * 액션 버튼만 있는 예시입니다.
 */
export const WithActionOnly: Story = {
  args: {
    icon: <Inbox className="h-8 w-8" />,
    title: "데이터가 없습니다",
    action: (
      <Button size="sm" variant="primary">
        새로 만들기
      </Button>
    ),
  },
};

/**
 * 작은 크기 예시입니다.
 */
export const SmallSize: Story = {
  args: {
    icon: <Inbox className="h-6 w-6" />,
    title: "데이터가 없습니다",
    description: "표시할 내용이 없습니다.",
    size: "sm",
  },
};

/**
 * 큰 크기 예시입니다.
 */
export const LargeSize: Story = {
  args: {
    icon: <Inbox className="h-12 w-12" />,
    title: "데이터가 없습니다",
    description: "표시할 내용이 없습니다.",
    size: "lg",
  },
};



