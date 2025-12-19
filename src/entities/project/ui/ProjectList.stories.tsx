import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { ProjectList } from "./ProjectList";
import { Bookmark } from "lucide-react";
import type { Project } from "../model/project.types";

// ========== 데모 데이터 ==========

const mockProjects: Project[] = [
  {
    id: "1",
    title: "AI 코드 리뷰 도구",
    shortDescription: "머신러닝을 활용한 자동 코드 리뷰 및 최적화 제안 도구",
    category: "ai",
    techStack: ["Python", "TensorFlow", "React"],
    author: {
      id: "user-1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    repositoryUrl: "https://github.com/indie-dev/ai-code-review",
    demoUrl: "https://ai-code-review.demo.com",
    currentFunding: 75000,
    targetFunding: 100000,
    backersCount: 156,
    likesCount: 234,
    commentsCount: 45,
    daysLeft: 12,
    status: "funding",
    featured: true,
    createdAt: "2024-11-01T00:00:00Z",
  },
  {
    id: "2",
    title: "실시간 협업 화이트보드",
    shortDescription: "개발팀을 위한 실시간 협업 화이트보드 및 브레인스토밍 플랫폼",
    category: "web",
    techStack: ["Next.js", "Socket.io", "MongoDB"],
    author: {
      id: "user-2",
      username: "frontend_lee",
      displayName: "이프론트",
      avatar: undefined,
    },
    currentFunding: 45000,
    targetFunding: 80000,
    backersCount: 89,
    likesCount: 167,
    commentsCount: 23,
    daysLeft: 25,
    status: "funding",
    featured: false,
    createdAt: "2024-11-10T00:00:00Z",
  },
  {
    id: "3",
    title: "모바일 퍼즐 게임",
    shortDescription: "AI 기반 적응형 난이도 조절 시스템을 가진 퍼즐 게임",
    category: "game",
    techStack: ["Unity", "C#", "Firebase"],
    author: {
      id: "user-1", // 내 프로젝트로 표시됨
      username: "me",
      displayName: "나",
      avatar: undefined,
    },
    currentFunding: 120000,
    targetFunding: 150000,
    backersCount: 278,
    likesCount: 445,
    commentsCount: 67,
    daysLeft: 8,
    status: "funding",
    featured: true,
    createdAt: "2024-10-20T00:00:00Z",
  },
  {
    id: "4",
    title: "오픈소스 API 게이트웨이",
    shortDescription: "경량화된 고성능 API 게이트웨이 솔루션",
    category: "opensource",
    techStack: ["Go", "Redis", "Docker"],
    author: {
      id: "user-3",
      username: "backend_kim",
      displayName: "김백엔드",
      avatar: undefined,
    },
    currentFunding: 200000,
    targetFunding: 200000,
    backersCount: 456,
    likesCount: 789,
    commentsCount: 123,
    daysLeft: 0,
    status: "completed",
    featured: false,
    createdAt: "2024-09-15T00:00:00Z",
  },
];

// ========== Decorator ==========

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-5xl mx-auto p-4 bg-white dark:bg-surface-950">
      <Story />
    </div>
  </BrowserRouter>
);

// ========== Meta ==========

/**
 * # 프로젝트 목록 컴포넌트
 * 
 * 프로젝트 목록을 표시하는 공통 컴포넌트입니다.
 * 로딩, 에러, 빈 상태, 목록 표시를 모두 처리합니다.
 * 
 * ## 주요 기능
 * - 프로젝트 목록 표시
 * - 로딩 상태 처리
 * - 에러 상태 처리
 * - 빈 상태 처리
 * - 내 프로젝트 자동 감지 및 별표시
 * - 순위 표시 옵션
 * - 더 보기 버튼 지원
 * 
 * ## 사용 위치
 * - `/explore` - 프로젝트 탐색 페이지
 * - `/bookmark/project` - 저장한 프로젝트 페이지
 * - 기타 프로젝트 목록이 필요한 모든 페이지
 */
const meta: Meta<typeof ProjectList> = {
  title: "Entities/Project/ProjectList",
  component: ProjectList,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
프로젝트 목록을 표시하는 공통 컴포넌트입니다.

## 사용법

\`\`\`tsx
import { ProjectList } from "@/entities/project";

<ProjectList
  projects={projects}
  isLoading={isLoading}
  error={error}
  onUpvote={handleUpvote}
  showRank={true}
  hasMore={hasMore}
  onLoadMore={handleLoadMore}
/>
\`\`\`

## 주요 기능

- **자동 내 프로젝트 감지**: 현재 사용자와 프로젝트 작성자를 비교하여 자동으로 별표시
- **로딩 상태**: 초기 로딩 시 스켈레톤 UI 표시
- **에러 처리**: 에러 발생 시 에러 메시지 표시
- **빈 상태**: 프로젝트가 없을 때 커스텀 빈 상태 컴포넌트 표시 가능
- **더 보기**: 페이지네이션을 위한 더 보기 버튼 지원

## Props

| Prop | Type | 기본값 | 설명 |
|------|------|--------|------|
| projects | Project[] | - | 표시할 프로젝트 목록 |
| isLoading | boolean | false | 로딩 중인지 여부 |
| error | string \| null | null | 에러 메시지 |
| emptyState | ReactNode | - | 빈 상태일 때 표시할 컴포넌트 |
| onUpvote | (projectId: string) => void | - | 프로젝트 좋아요 토글 핸들러 |
| showRank | boolean | false | 순위 표시 여부 |
| hasMore | boolean | false | 더 보기 버튼 표시 여부 |
| onLoadMore | () => void | - | 더 보기 버튼 클릭 핸들러 |
| isLoadingMore | boolean | false | 더 보기 버튼 로딩 중인지 여부 |
| dividerClassName | string | - | 목록 구분선 스타일 |
        `,
      },
    },
  },
  argTypes: {
    projects: {
      description: "표시할 프로젝트 목록",
    },
    isLoading: {
      description: "로딩 중인지 여부",
      control: "boolean",
    },
    error: {
      description: "에러 메시지",
      control: "text",
    },
    showRank: {
      description: "순위 표시 여부",
      control: "boolean",
    },
    hasMore: {
      description: "더 보기 버튼 표시 여부",
      control: "boolean",
    },
    isLoadingMore: {
      description: "더 보기 버튼 로딩 중인지 여부",
      control: "boolean",
    },
    onUpvote: {
      description: "프로젝트 좋아요 토글 핸들러",
      action: "upvoted",
    },
    onLoadMore: {
      description: "더 보기 버튼 클릭 핸들러",
      action: "loadMore",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectList>;

// ========== Stories ==========

/**
 * 기본 프로젝트 목록입니다.
 * 프로젝트가 정상적으로 표시됩니다.
 */
export const Default: Story = {
  args: {
    projects: mockProjects,
    isLoading: false,
    error: null,
    showRank: false,
    hasMore: false,
  },
};

/**
 * 순위가 표시되는 프로젝트 목록입니다.
 * 각 프로젝트 앞에 순위 번호가 표시됩니다.
 */
export const WithRank: Story = {
  args: {
    projects: mockProjects,
    isLoading: false,
    error: null,
    showRank: true,
    hasMore: false,
  },
};

/**
 * 로딩 중인 상태입니다.
 * 스켈레톤 UI가 표시됩니다.
 */
export const Loading: Story = {
  args: {
    projects: [],
    isLoading: true,
    error: null,
  },
};

/**
 * 에러가 발생한 상태입니다.
 * 에러 메시지가 표시됩니다.
 */
export const Error: Story = {
  args: {
    projects: [],
    isLoading: false,
    error: "프로젝트를 불러오는 중 오류가 발생했습니다.",
  },
};

/**
 * 프로젝트가 없는 빈 상태입니다.
 * 기본 빈 상태 메시지가 표시됩니다.
 */
export const Empty: Story = {
  args: {
    projects: [],
    isLoading: false,
    error: null,
  },
};

/**
 * 커스텀 빈 상태를 사용하는 예시입니다.
 * emptyState prop을 통해 커스텀 컴포넌트를 전달할 수 있습니다.
 */
export const EmptyWithCustomState: Story = {
  args: {
    projects: [],
    isLoading: false,
    error: null,
    emptyState: (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
          <Bookmark className="h-8 w-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
          저장한 프로젝트가 없습니다
        </h3>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          관심 있는 프로젝트를 저장하면 여기에 표시됩니다
        </p>
      </div>
    ),
  },
};

/**
 * 더 보기 버튼이 있는 프로젝트 목록입니다.
 * hasMore와 onLoadMore를 통해 페이지네이션을 구현할 수 있습니다.
 */
export const WithLoadMore: Story = {
  args: {
    projects: mockProjects,
    isLoading: false,
    error: null,
    showRank: false,
    hasMore: true,
    isLoadingMore: false,
    onLoadMore: () => {
      console.log("더 보기 클릭");
    },
  },
};

/**
 * 더 보기 버튼이 로딩 중인 상태입니다.
 * 버튼이 비활성화되고 "로딩 중..." 텍스트가 표시됩니다.
 */
export const LoadingMore: Story = {
  args: {
    projects: mockProjects,
    isLoading: false,
    error: null,
    showRank: false,
    hasMore: true,
    isLoadingMore: true,
    onLoadMore: () => {
      console.log("더 보기 클릭");
    },
  },
};

/**
 * 내 프로젝트가 포함된 목록입니다.
 * 내 프로젝트는 자동으로 별표시가 됩니다.
 * (현재 사용자 ID가 "user-1"인 경우 프로젝트 1과 3에 별표시)
 */
export const WithMyProjects: Story = {
  args: {
    projects: mockProjects,
    isLoading: false,
    error: null,
    showRank: false,
    hasMore: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
내 프로젝트는 자동으로 감지되어 별표시가 됩니다.
현재 사용자 ID와 프로젝트 작성자 ID를 비교하여 판단합니다.
        `,
      },
    },
  },
};

