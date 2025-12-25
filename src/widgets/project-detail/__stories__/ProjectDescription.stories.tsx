import type { Meta, StoryObj } from "@storybook/react";
import { ProjectDescription } from "../ui/ProjectDescription";
import type { Project } from "@/entities/project";

const sampleProject: Pick<Project, "fullDescription" | "shortDescription"> = {
  shortDescription: "개발자와 사용자를 연결하는 프로젝트 플랫폼",
  fullDescription:
    "인디메이커는 개발자들이 자신의 프로젝트를 소개하고, 사용자들과 소통할 수 있는 플랫폼입니다. " +
    "프로젝트를 등록하고, 피드백을 받으며, 커뮤니티를 형성할 수 있습니다. " +
    "또한 마일스톤을 설정하고 진행 상황을 공유할 수 있어 투명한 개발 프로세스를 제공합니다.",
};

const meta: Meta<typeof ProjectDescription> = {
  title: "Widgets/ProjectDetail/ProjectDescription",
  component: ProjectDescription,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
프로젝트의 상세 설명을 표시하는 컴포넌트입니다.

## 기능
- 프로젝트의 전체 설명 표시 (fullDescription 우선)
- 전체 설명이 없으면 짧은 설명 표시
- 다크 모드 지원
- 가독성을 위한 적절한 줄 간격

## 사용 예시
\`\`\`tsx
<ProjectDescription 
  project={{
    shortDescription: "짧은 설명",
    fullDescription: "상세한 설명 내용...",
  }} 
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    project: {
      description: "프로젝트 설명 정보",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectDescription>;

export const WithFullDescription: Story = {
  args: {
    project: sampleProject,
  },
};

export const ShortDescriptionOnly: Story = {
  args: {
    project: {
      shortDescription: "개발자와 사용자를 연결하는 프로젝트 플랫폼",
      fullDescription: undefined,
    },
  },
};

export const LongDescription: Story = {
  args: {
    project: {
      shortDescription: "짧은 설명",
      fullDescription:
        "이것은 매우 긴 프로젝트 설명입니다. " +
        "여러 문단으로 구성되어 있고, 프로젝트의 목적, 기능, 특징 등을 상세히 설명합니다. " +
        "사용자들이 프로젝트에 대해 충분히 이해할 수 있도록 필요한 모든 정보를 포함합니다. " +
        "프로젝트의 기술 스택, 개발 과정, 향후 계획 등도 포함될 수 있습니다. " +
        "이런 긴 설명이 있을 때도 레이아웃이 깨지지 않고 잘 표시되는지 확인할 수 있습니다.",
    },
  },
};

export const EmptyDescription: Story = {
  args: {
    project: {
      shortDescription: "",
      fullDescription: undefined,
    },
  },
};



