import type { Meta, StoryObj } from "@storybook/react";
import { ProjectHeader } from "../ui/ProjectHeader";
import type { Project } from "@/entities/project";

const sampleProject: Project = {
  id: "1",
  title: "인디메이커",
  shortDescription: "개발자와 사용자를 연결하는 프로젝트 플랫폼",
  fullDescription: "인디메이커는 개발자들이 자신의 프로젝트를 소개하고, 사용자들과 소통할 수 있는 플랫폼입니다.",
  category: "web",
  techStack: ["React", "TypeScript", "Tailwind CSS", "Supabase"],
  author: {
    id: "user-1",
    username: "indiemaker",
    displayName: "인디메이커",
    avatar: undefined,
  },
  thumbnail: undefined,
  galleryImages: [],
  repositoryUrl: "https://github.com/example/project",
  demoUrl: "https://example.com",
  currentFunding: 0,
  targetFunding: 0,
  backersCount: 0,
  likesCount: 0,
  commentsCount: 0,
  daysLeft: 0,
  status: "in_progress",
  featured: false,
  createdAt: new Date().toISOString(),
};

const meta: Meta<typeof ProjectHeader> = {
  title: "Widgets/ProjectDetail/ProjectHeader",
  component: ProjectHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
프로젝트 상세 페이지의 헤더 컴포넌트입니다. 프로젝트 아이콘, 제목, 짧은 설명을 표시합니다.

## 기능
- 프로젝트 썸네일 또는 카테고리 아이콘 표시
- 프로젝트 제목 및 짧은 설명 표시
- 다크 모드 지원

## 사용 예시
\`\`\`tsx
<ProjectHeader project={project} />
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    project: {
      description: "프로젝트 정보",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectHeader>;

export const Default: Story = {
  args: {
    project: sampleProject,
  },
};

export const WithThumbnail: Story = {
  args: {
    project: {
      ...sampleProject,
      thumbnail: "https://via.placeholder.com/96",
    },
  },
};

export const MobileApp: Story = {
  args: {
    project: {
      ...sampleProject,
      title: "모바일 앱 프로젝트",
      category: "mobile",
      shortDescription: "혁신적인 모바일 앱 서비스",
    },
  },
};

export const GameProject: Story = {
  args: {
    project: {
      ...sampleProject,
      title: "인디 게임",
      category: "game",
      shortDescription: "독창적인 게임플레이를 제공하는 인디 게임",
    },
  },
};

export const LongTitle: Story = {
  args: {
    project: {
      ...sampleProject,
      title: "매우 긴 프로젝트 제목이 들어가는 경우 어떻게 표시되는지 확인하기 위한 예시입니다",
      shortDescription: "긴 제목이 있을 때 레이아웃이 어떻게 유지되는지 확인합니다.",
    },
  },
};


