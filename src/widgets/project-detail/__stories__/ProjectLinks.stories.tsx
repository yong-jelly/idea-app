import type { Meta, StoryObj } from "@storybook/react";
import { ProjectLinks } from "../ui/ProjectLinks";
import type { Project } from "@/entities/project";

const sampleProject: Pick<
  Project,
  | "repositoryUrl"
  | "demoUrl"
  | "androidStoreUrl"
  | "iosStoreUrl"
  | "macStoreUrl"
> = {
  repositoryUrl: "https://github.com/example/project",
  demoUrl: "https://example.com",
  androidStoreUrl: "https://play.google.com/store/apps/details?id=com.example",
  iosStoreUrl: "https://apps.apple.com/app/id123456789",
  macStoreUrl: "https://apps.apple.com/app/id987654321",
};

const meta: Meta<typeof ProjectLinks> = {
  title: "Widgets/ProjectDetail/ProjectLinks",
  component: ProjectLinks,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
프로젝트의 외부 링크들을 표시하는 컴포넌트입니다. 저장소, 웹사이트, 앱스토어 링크를 제공합니다.

## 기능
- GitHub 저장소 링크
- 웹사이트/데모 링크
- Google Play 스토어 링크
- App Store 링크
- Mac App Store 링크
- 링크가 없는 경우 비활성화 상태 표시

## 사용 예시
\`\`\`tsx
<ProjectLinks 
  project={{
    repositoryUrl: "https://github.com/...",
    demoUrl: "https://example.com",
    androidStoreUrl: "https://play.google.com/...",
    iosStoreUrl: "https://apps.apple.com/...",
    macStoreUrl: "https://apps.apple.com/...",
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
      description: "프로젝트 링크 정보",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectLinks>;

export const AllLinks: Story = {
  args: {
    project: sampleProject,
  },
};

export const WebOnly: Story = {
  args: {
    project: {
      repositoryUrl: "https://github.com/example/project",
      demoUrl: "https://example.com",
      androidStoreUrl: undefined,
      iosStoreUrl: undefined,
      macStoreUrl: undefined,
    },
  },
};

export const MobileOnly: Story = {
  args: {
    project: {
      repositoryUrl: undefined,
      demoUrl: undefined,
      androidStoreUrl: "https://play.google.com/store/apps/details?id=com.example",
      iosStoreUrl: "https://apps.apple.com/app/id123456789",
      macStoreUrl: undefined,
    },
  },
};

export const NoLinks: Story = {
  args: {
    project: {
      repositoryUrl: undefined,
      demoUrl: undefined,
      androidStoreUrl: undefined,
      iosStoreUrl: undefined,
      macStoreUrl: undefined,
    },
  },
};

export const PartialLinks: Story = {
  args: {
    project: {
      repositoryUrl: "https://github.com/example/project",
      demoUrl: undefined,
      androidStoreUrl: "https://play.google.com/store/apps/details?id=com.example",
      iosStoreUrl: undefined,
      macStoreUrl: undefined,
    },
  },
};





