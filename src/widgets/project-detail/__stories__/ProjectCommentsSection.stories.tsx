import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { ProjectCommentsSection } from "../ui/ProjectCommentsSection";
import type { CommentNode } from "@/shared/ui/comment";
import type { User } from "@/entities/user";

const now = new Date();
const daysAgo = (day: number) => new Date(now.getTime() - day * 24 * 60 * 60 * 1000).toISOString();

const sampleUser: User = {
  id: "user-1",
  username: "testuser",
  displayName: "테스트 사용자",
  avatar: undefined,
  bio: "테스트 사용자입니다",
  points: 100,
  level: "silver",
  subscribedProjectsCount: 5,
  supportedProjectsCount: 3,
  projectsCount: 2,
  createdAt: daysAgo(30),
};

const sampleComments: CommentNode[] = [
  {
    id: "c1",
    author: { id: "founder", displayName: "인디메이커", role: "Founder" },
    content: "프로토타입이 곧 나와요. 궁금한 점은 편하게 물어봐주세요!",
    likesCount: 12,
    isLiked: true,
    depth: 0,
    createdAt: daysAgo(1),
    replies: [
      {
        id: "c1-1",
        author: { id: "user-1", displayName: "테스트 사용자" },
        content: "오 기대됩니다. 베타 신청 열리면 바로 알려주세요 🙌",
        likesCount: 2,
        isLiked: false,
        depth: 1,
        parentId: "c1",
        createdAt: daysAgo(0.5),
      },
    ],
  },
  {
    id: "c2",
    author: { id: "guest", displayName: "게스트" },
    content: "이미지 첨부가 지원되나요?",
    likesCount: 0,
    isLiked: false,
    depth: 0,
    createdAt: daysAgo(2),
    isDeleted: false,
  },
];

const meta: Meta<typeof ProjectCommentsSection> = {
  title: "Widgets/ProjectDetail/ProjectCommentsSection",
  component: ProjectCommentsSection,
  parameters: {
    docs: {
      description: {
        component:
          "프로젝트 상세 페이지의 댓글 섹션 컴포넌트입니다. " +
          "댓글 목록 표시, 새로고침, 댓글 작성/수정/삭제 기능을 제공합니다. " +
          "로딩 중에는 높이가 고정된 로딩 컴포넌트를 표시하여 레이아웃 시프트를 방지합니다.",
      },
    },
  },
  args: {
    comments: sampleComments,
    totalComments: 2,
    isLoadingComments: false,
    isLoadingMore: false,
    hasMore: false,
    currentUser: sampleUser,
    isAuthenticated: true,
    maxDepth: 2,
    onRefresh: action("refresh"),
    onLoadMore: action("loadMore"),
    onSignUpPrompt: action("signUpPrompt"),
    onCreate: action("create"),
    onReply: action("reply"),
    onLike: action("like"),
    onEdit: action("edit"),
    onDelete: action("delete"),
  },
  tags: ["autodocs"],
  argTypes: {
    totalComments: {
      control: "number",
      description: "전체 댓글 개수",
    },
    isLoadingComments: {
      control: "boolean",
      description: "댓글 로딩 중 여부",
    },
    isLoadingMore: {
      control: "boolean",
      description: "더보기 로딩 중 여부",
    },
    hasMore: {
      control: "boolean",
      description: "추가 댓글 존재 여부",
    },
    isAuthenticated: {
      control: "boolean",
      description: "사용자 인증 여부",
    },
    maxDepth: {
      control: "number",
      description: "최대 댓글 뎁스",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCommentsSection>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoadingComments: true,
    comments: [],
    totalComments: 0,
  },
};

export const LoadingWithExistingComments: Story = {
  render: (args) => {
    const [isLoading, setIsLoading] = useState(true);
    
    // 2초 후 로딩 완료 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return (
      <ProjectCommentsSection
        {...args}
        isLoadingComments={isLoading}
      />
    );
  },
  args: {
    comments: sampleComments,
    totalComments: 2,
  },
};

export const EmptyComments: Story = {
  args: {
    comments: [],
    totalComments: 0,
    isLoadingComments: false,
  },
};

export const ManyComments: Story = {
  args: {
    comments: Array.from({ length: 10 }, (_, i) => ({
      id: `c${i + 1}`,
      author: { id: `user-${i}`, displayName: `사용자 ${i + 1}` },
      content: `댓글 내용 ${i + 1}`,
      likesCount: Math.floor(Math.random() * 20),
      isLiked: false,
      depth: 0,
      createdAt: daysAgo(i),
    })),
    totalComments: 10,
    hasMore: true,
  },
};

export const Unauthenticated: Story = {
  args: {
    currentUser: null,
    isAuthenticated: false,
  },
};

export const WithReplies: Story = {
  args: {
    comments: [
      {
        id: "c1",
        author: { id: "founder", displayName: "인디메이커", role: "Founder" },
        content: "프로토타입이 곧 나와요. 궁금한 점은 편하게 물어봐주세요!",
        likesCount: 12,
        isLiked: true,
        depth: 0,
        createdAt: daysAgo(1),
        replies: [
          {
            id: "c1-1",
            author: { id: "user-1", displayName: "테스트 사용자" },
            content: "오 기대됩니다. 베타 신청 열리면 바로 알려주세요 🙌",
            likesCount: 2,
            isLiked: false,
            depth: 1,
            parentId: "c1",
            createdAt: daysAgo(0.5),
            replies: [
              {
                id: "c1-1-1",
                author: { id: "founder", displayName: "인디메이커" },
                content: "네, 곧 공지하겠습니다!",
                likesCount: 5,
                isLiked: true,
                depth: 2,
                parentId: "c1-1",
                createdAt: daysAgo(0.3),
              },
            ],
          },
        ],
      },
    ],
    totalComments: 3,
    maxDepth: 2,
  },
};






