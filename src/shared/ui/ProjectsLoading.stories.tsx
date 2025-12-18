import type { Meta, StoryObj } from "@storybook/react";
import { ProjectsLoading } from "./ProjectsLoading";

const meta: Meta<typeof ProjectsLoading> = {
  title: "Shared/UI/ProjectsLoading",
  component: ProjectsLoading,
  parameters: {
    docs: {
      description: {
        component:
          "프로젝트 목록 로딩 상태를 표시하는 컴포넌트입니다. " +
          "ProjectListItem 구조에 맞춘 스켈레톤 UI를 제공하여 로딩 중 레이아웃 시프트를 방지합니다.",
      },
    },
  },
  args: {
    count: 5,
  },
  tags: ["autodocs"],
  argTypes: {
    count: {
      control: "number",
      description: "스켈레톤 프로젝트 개수",
      defaultValue: 5,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectsLoading>;

export const Default: Story = {
  args: {
    count: 5,
  },
};

export const FewItems: Story = {
  args: {
    count: 3,
  },
};

export const ManyItems: Story = {
  args: {
    count: 10,
  },
};

export const SingleItem: Story = {
  args: {
    count: 1,
  },
};

