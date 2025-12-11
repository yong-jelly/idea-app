import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { CommentThread, CommentNode, CommentAuthor } from "./CommentThread";

const now = new Date();
const daysAgo = (day: number) => new Date(now.getTime() - day * 24 * 60 * 60 * 1000).toISOString();

const sampleAuthor: CommentAuthor = {
  id: "me",
  username: "me",
  displayName: "나",
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
        author: { id: "me", displayName: "나" },
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
    images: ["https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600"],
    likesCount: 0,
    isLiked: false,
    depth: 0,
    createdAt: daysAgo(2),
    isDeleted: false,
  },
];

const meta: Meta<typeof CommentThread> = {
  title: "Shared/UI/CommentThread",
  component: CommentThread,
  parameters: {
    docs: {
      description: {
        component:
          "피드/커뮤니티에서 재사용 가능한 댓글 스레드 컴포넌트입니다. " +
          "최대 뎁스, 이미지 첨부 허용 여부, 첨부 가능 개수를 옵션으로 제어할 수 있습니다. " +
          "긴 댓글 접기, 라이트박스, 삭제 확인 등 UX 강화를 포함합니다.",
      },
    },
  },
  args: {
    comments: sampleComments,
    currentUser: sampleAuthor,
    currentUserId: sampleAuthor.id,
    onCreate: action("create"),
    onReply: action("reply"),
    onLike: action("like"),
    onEdit: action("edit"),
    onDelete: action("delete"),
  },
  tags: ["autodocs"],
  argTypes: {
    maxDepth: {
      control: "number",
      description: "허용할 최대 댓글 뎁스(루트=0)",
      defaultValue: 3,
    },
    enableAttachments: {
      control: "boolean",
      description: "이미지 첨부 허용 여부",
      defaultValue: true,
    },
    maxImages: {
      control: "number",
      description: "첨부 가능한 최대 이미지 수",
      defaultValue: 1,
    },
    enableAttachments: {
      description: "이미지 첨부 허용 여부 (비활성 시 안내 배지 노출)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommentThread>;

export const Default: Story = {
  args: {
    maxDepth: 3,
    enableAttachments: true,
    maxImages: 1,
  },
};

export const DeepThread: Story = {
  args: {
    comments: [
      {
        ...sampleComments[0],
        replies: [
          {
            ...sampleComments[0].replies?.[0]!,
            replies: [
              {
                id: "c1-1-1",
                author: { id: "designer", displayName: "디자이너" },
                content: "디자인 시안도 공유해볼게요.",
                likesCount: 0,
                isLiked: false,
                depth: 2,
                parentId: "c1-1",
                createdAt: daysAgo(0.2),
              },
            ],
          },
        ],
      },
    ],
    maxDepth: 4,
  },
};

export const AttachmentDisabled: Story = {
  args: {
    enableAttachments: false,
    maxImages: 0,
  },
};

export const LongContentAndLightbox: Story = {
  args: {
    comments: [
      {
        ...sampleComments[0],
        content:
          "아주 긴 댓글입니다. ".repeat(30) +
          "끝까지 읽으려면 더보기를 눌러주세요.",
        images: ["https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1000"],
      },
    ],
    enableAttachments: true,
    maxImages: 2,
  },
};
