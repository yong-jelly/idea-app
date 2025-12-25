import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router";
import { ProjectMetaTags } from "../ui/ProjectMetaTags";
import type { Project } from "@/entities/project";

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-5xl">
      <Story />
    </div>
  </BrowserRouter>
);

const sampleProject: Pick<Project, "category" | "techStack"> = {
  category: "web",
  techStack: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
};

const meta: Meta<typeof ProjectMetaTags> = {
  title: "Widgets/ProjectDetail/ProjectMetaTags",
  component: ProjectMetaTags,
  decorators: [withRouter],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
프로젝트의 카테고리와 기술 스택을 표시하는 컴포넌트입니다.

## 기능
- 프로젝트 카테고리 표시 (클릭 시 카테고리 필터링)
- 기술 스택 태그 목록 표시
- 다크 모드 지원

## 사용 예시
\`\`\`tsx
<ProjectMetaTags 
  project={{
    category: "web",
    techStack: ["React", "TypeScript", "Tailwind CSS"],
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
      description: "프로젝트 카테고리 및 기술 스택 정보",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectMetaTags>;

export const Default: Story = {
  args: {
    project: sampleProject,
  },
};

export const MobileApp: Story = {
  args: {
    project: {
      category: "mobile",
      techStack: ["React Native", "TypeScript", "Firebase"],
    },
  },
};

export const GameProject: Story = {
  args: {
    project: {
      category: "game",
      techStack: ["Unity", "C#", "Blender"],
    },
  },
};

export const ManyTechStack: Story = {
  args: {
    project: {
      category: "web",
      techStack: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Supabase",
        "Vite",
        "Zustand",
        "React Router",
        "Storybook",
      ],
    },
  },
};

export const SingleTech: Story = {
  args: {
    project: {
      category: "tool",
      techStack: ["Python"],
    },
  },
};

export const NoTechStack: Story = {
  args: {
    project: {
      category: "opensource",
      techStack: [],
    },
  },
};


