import type { Meta, StoryObj } from "@storybook/react";
import { ProjectSection } from "../ProjectSection";
import { useProjectStore } from "@/entities/project";
import type { Project } from "@/entities/project";

// Mock 프로젝트 데이터
const mockMyProjects: Project[] = [
  {
    id: "1",
    title: "내가 생성한 프로젝트 1",
    shortDescription: "최신 프로젝트",
    category: "web",
    techStack: ["React", "TypeScript"],
    author: {
      id: "user-1",
      username: "me",
      displayName: "나",
      avatar: undefined,
    },
    currentFunding: 0,
    targetFunding: 0,
    backersCount: 0,
    likesCount: 0,
    commentsCount: 0,
    daysLeft: 0,
    status: "in_progress",
    featured: false,
    isMyProject: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "내가 생성한 프로젝트 2",
    shortDescription: "두 번째 프로젝트",
    category: "mobile",
    techStack: ["React Native"],
    author: {
      id: "user-1",
      username: "me",
      displayName: "나",
      avatar: undefined,
    },
    currentFunding: 0,
    targetFunding: 0,
    backersCount: 0,
    likesCount: 0,
    commentsCount: 0,
    daysLeft: 0,
    status: "in_progress",
    featured: false,
    isMyProject: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const mockBookmarkedProjects: Project[] = [
  {
    id: "3",
    title: "저장한 프로젝트 1",
    shortDescription: "다른 사람의 프로젝트",
    category: "game",
    techStack: ["Unity"],
    author: {
      id: "user-2",
      username: "other",
      displayName: "다른 사람",
      avatar: undefined,
    },
    currentFunding: 0,
    targetFunding: 0,
    backersCount: 0,
    likesCount: 0,
    commentsCount: 0,
    daysLeft: 0,
    status: "in_progress",
    featured: false,
    isMyProject: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "4",
    title: "저장한 프로젝트 2",
    shortDescription: "또 다른 프로젝트",
    category: "ai",
    techStack: ["Python", "TensorFlow"],
    author: {
      id: "user-3",
      username: "another",
      displayName: "또 다른 사람",
      avatar: undefined,
    },
    currentFunding: 0,
    targetFunding: 0,
    backersCount: 0,
    likesCount: 0,
    commentsCount: 0,
    daysLeft: 0,
    status: "in_progress",
    featured: false,
    isMyProject: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const meta: Meta<typeof ProjectSection> = {
  title: "Widgets/Sidebar/ProjectSection",
  component: ProjectSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
사이드바의 프로젝트 섹션 컴포넌트입니다. 내가 생성한 프로젝트와 저장한 프로젝트를 표시합니다.

## 기능
- 내가 생성한 프로젝트가 상단에 표시됨 (별 아이콘 표시)
- 내가 저장한 프로젝트가 하단에 표시됨
- 최대 15개까지 표시하고, 그 이상일 경우 "더 보기" 버튼 표시
- 헤더 클릭 시 /bookmark/project로 이동

## 구조
- 1개의 헤더만 존재 (프로젝트 >)
- 내가 생성한 프로젝트: 생성일 최신순으로 정렬, 해제 불가
- 내가 저장한 프로젝트: 저장일 순으로 정렬
        `,
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story, context) => {
      // Mock zustand store
      const { savedProjects, savedProjectsLoaded, savedProjectsLoading } = context.args as any;
      
      // Store 상태 설정
      useProjectStore.setState({
        savedProjects: savedProjects || [],
        savedProjectsLoaded: savedProjectsLoaded ?? true,
        savedProjectsLoading: savedProjectsLoading ?? false,
      });

      return (
        <div className="w-[260px]">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectSection>;

export const Default: Story = {
  args: {
    savedProjects: [...mockMyProjects, ...mockBookmarkedProjects],
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};

export const OnlyMyProjects: Story = {
  args: {
    savedProjects: mockMyProjects,
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};

export const OnlyBookmarkedProjects: Story = {
  args: {
    savedProjects: mockBookmarkedProjects,
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};

export const Empty: Story = {
  args: {
    savedProjects: [],
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};

export const Loading: Story = {
  args: {
    savedProjects: [],
    savedProjectsLoaded: false,
    savedProjectsLoading: true,
  },
};

export const ManyProjects: Story = {
  args: {
    savedProjects: [
      ...mockMyProjects,
      ...mockBookmarkedProjects,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `project-${i + 5}`,
        title: `프로젝트 ${i + 5}`,
        shortDescription: `프로젝트 설명 ${i + 5}`,
        category: "web" as const,
        techStack: ["React"],
        author: {
          id: `user-${i + 4}`,
          username: `user${i + 4}`,
          displayName: `사용자 ${i + 4}`,
          avatar: undefined,
        },
        currentFunding: 0,
        targetFunding: 0,
        backersCount: 0,
        likesCount: 0,
        commentsCount: 0,
        daysLeft: 0,
        status: "in_progress" as const,
        featured: false,
        isMyProject: i % 3 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    ],
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};

export const WithThumbnails: Story = {
  args: {
    savedProjects: [
      {
        ...mockMyProjects[0],
        thumbnail: "https://via.placeholder.com/96",
      },
      {
        ...mockBookmarkedProjects[0],
        thumbnail: "https://via.placeholder.com/96",
      },
    ],
    savedProjectsLoaded: true,
    savedProjectsLoading: false,
  },
};





