import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Plus } from "lucide-react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Shared/UI/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "다양한 변형과 크기를 지원하는 버튼 컴포넌트입니다.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
      description: "버튼의 시각적 스타일",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
      description: "버튼의 크기",
    },
    isLoading: {
      control: "boolean",
      description: "로딩 상태 표시",
    },
    disabled: {
      control: "boolean",
      description: "비활성화 상태",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "프로젝트 등록",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "취소",
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    children: "더 보기",
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    children: "설정",
    variant: "ghost",
  },
};

export const Destructive: Story = {
  args: {
    children: "삭제",
    variant: "destructive",
  },
};

export const Small: Story = {
  args: {
    children: "작은 버튼",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "큰 버튼",
    size: "lg",
  },
};

export const Icon: Story = {
  args: {
    children: <Plus className="h-5 w-5" />,
    size: "icon",
    variant: "primary",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Heart className="h-4 w-4" />
        좋아요
      </>
    ),
    variant: "outline",
  },
};

export const Loading: Story = {
  args: {
    children: "저장 중",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "비활성화",
    disabled: true,
  },
};

