import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BrowserRouter } from "react-router";
import {
  Megaphone,
  Sparkles,
  ThumbsUp,
  Heart,
  MessageCircle,
  Bookmark,
  Edit,
  Trash2,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button, Avatar, Badge, Card, CardContent } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";

// ========== 타입 정의 ==========

interface VoteOption {
  id: string;
  text: string;
  votesCount: number;
}

interface DevPost {
  id: string;
  type: "announcement" | "update" | "vote";
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role: string;
  };
  isPinned?: boolean;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  createdAt: string;
  voteOptions?: VoteOption[];
  votedOptionId?: string;
  totalVotes?: number;
}

// ========== DevPostCard 컴포넌트 (스토리용 단순화 버전) ==========

interface DevPostCardProps {
  post: DevPost;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
  showActions?: boolean;
}

function DevPostCard({ post, onEdit, onDelete, onTogglePin, showActions = true }: DevPostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>(post.voteOptions || []);
  const [votedOptionId, setVotedOptionId] = useState<string | undefined>(post.votedOptionId);
  const [totalVotes, setTotalVotes] = useState(post.totalVotes || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleVote = (optionId: string) => {
    if (votedOptionId === optionId) {
      setVoteOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId ? { ...opt, votesCount: opt.votesCount - 1 } : opt
        )
      );
      setTotalVotes((prev) => prev - 1);
      setVotedOptionId(undefined);
    } else {
      setVoteOptions((prev) =>
        prev.map((opt) => {
          if (opt.id === optionId) return { ...opt, votesCount: opt.votesCount + 1 };
          if (opt.id === votedOptionId) return { ...opt, votesCount: opt.votesCount - 1 };
          return opt;
        })
      );
      if (!votedOptionId) setTotalVotes((prev) => prev + 1);
      setVotedOptionId(optionId);
    }
  };

  return (
    <Card className={cn(post.isPinned && "ring-2 ring-primary-200 dark:ring-primary-800")}>
      <CardContent className="p-4">
        {post.isPinned && (
          <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
            <Bookmark className="h-3 w-3 fill-current" />
            고정됨
          </div>
        )}
        <div className="flex items-start gap-3">
          <Avatar fallback={post.author.displayName} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-surface-900 dark:text-surface-50">
                {post.author.displayName}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {post.author.role}
              </Badge>
              <span className="text-sm text-surface-400">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
              {post.title}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* 투표 UI */}
            {post.type === "vote" && voteOptions.length > 0 && (
              <div className="mt-4 space-y-2">
                {voteOptions.map((option) => {
                  const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                  const isSelected = votedOptionId === option.id;
                  const hasVoted = !!votedOptionId;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(option.id)}
                      className={cn(
                        "relative w-full text-left rounded-lg border-2 overflow-hidden transition-all",
                        isSelected
                          ? "border-primary-400 dark:border-primary-600"
                          : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                      )}
                    >
                      {hasVoted && (
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 transition-all",
                            isSelected
                              ? "bg-primary-100 dark:bg-primary-900/30"
                              : "bg-surface-100 dark:bg-surface-800"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      )}
                      <div className="relative px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />}
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary-700 dark:text-primary-300" : "text-surface-700 dark:text-surface-300"
                          )}>
                            {option.text}
                          </span>
                        </div>
                        {hasVoted && (
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            isSelected ? "text-primary-600" : "text-surface-500"
                          )}>
                            {percentage}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <p className="text-xs text-surface-400 pt-1">
                  {totalVotes}명 투표 참여
                  {votedOptionId && " · 다시 클릭하면 투표 취소"}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1 text-sm transition-colors",
                  isLiked ? "text-rose-500" : "text-surface-500 hover:text-rose-500"
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                {formatNumber(likesCount)}
              </button>
              <button className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500 transition-colors">
                <MessageCircle className="h-4 w-4" />
                {formatNumber(post.commentsCount)}
              </button>

              {showActions && (onEdit || onDelete || onTogglePin) && (
                <div className="ml-auto flex items-center gap-1">
                  {onTogglePin && (
                    <button
                      onClick={onTogglePin}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        post.isPinned
                          ? "text-primary-500 hover:bg-primary-50"
                          : "text-surface-400 hover:bg-surface-100"
                      )}
                    >
                      <Bookmark className={cn("h-4 w-4", post.isPinned && "fill-current")} />
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={onEdit} className="p-1.5 rounded text-surface-400 hover:bg-surface-100">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={onDelete} className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== 타입 정보 ==========

const POST_TYPE_INFO = {
  announcement: { label: "공지", icon: Megaphone, color: "text-primary-500 bg-primary-50" },
  update: { label: "업데이트", icon: Sparkles, color: "text-emerald-500 bg-emerald-50" },
  vote: { label: "투표", icon: ThumbsUp, color: "text-amber-500 bg-amber-50" },
};

// ========== 데모 데이터 ==========

const mockAuthor = {
  id: "u1",
  username: "indiemaker",
  displayName: "인디메이커",
  role: "Founder",
};

const mockAnnouncement: DevPost = {
  id: "dp1",
  type: "announcement",
  title: "🎉 v2.0 베타 테스트 시작!",
  content: "안녕하세요! 드디어 v2.0 베타 버전을 공개합니다.\n\n새로운 AI 기능과 개선된 UI를 체험해보세요. 베타 테스터 피드백을 기다립니다!",
  author: mockAuthor,
  isPinned: true,
  likesCount: 45,
  isLiked: false,
  commentsCount: 23,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
};

const mockUpdate: DevPost = {
  id: "dp2",
  type: "update",
  title: "서버 점검 안내 (12/10)",
  content: "12월 10일 새벽 2시부터 4시까지 서버 점검이 예정되어 있습니다.\n점검 시간 동안 서비스 이용이 제한될 수 있습니다.",
  author: { ...mockAuthor, role: "Developer" },
  likesCount: 12,
  isLiked: false,
  commentsCount: 5,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
};

const mockVote: DevPost = {
  id: "dp3",
  type: "vote",
  title: "🗳️ 다음 업데이트에 어떤 기능을 추가할까요?",
  content: "여러분의 의견을 듣고 싶습니다! 가장 원하는 기능에 투표해주세요.",
  author: mockAuthor,
  likesCount: 34,
  isLiked: false,
  commentsCount: 15,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  voteOptions: [
    { id: "vo1", text: "다크모드 지원", votesCount: 45 },
    { id: "vo2", text: "모바일 앱 출시", votesCount: 38 },
    { id: "vo3", text: "API 확장", votesCount: 22 },
    { id: "vo4", text: "알림 기능 개선", votesCount: 18 },
  ],
  votedOptionId: undefined,
  totalVotes: 123,
};

const mockVoteWithSelection: DevPost = {
  ...mockVote,
  id: "dp3-voted",
  votedOptionId: "vo1",
};

// ========== Decorator ==========

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Story />
    </div>
  </BrowserRouter>
);

// ========== Stories ==========

/**
 * # 공지사항 피드 Row (DevPostCard)
 *
 * 프로젝트 커뮤니티 페이지의 공지사항/업데이트/투표 피드를 표시하는 카드 컴포넌트입니다.
 *
 * ## 피드 타입
 *
 * | 타입 | 설명 | 아이콘 |
 * |------|------|--------|
 * | `announcement` | 공지사항 | 📢 Megaphone |
 * | `update` | 업데이트 안내 | ✨ Sparkles |
 * | `vote` | 투표/설문 | 👍 ThumbsUp |
 *
 * ## 주요 기능
 *
 * - **상단 고정** - 중요한 공지를 목록 상단에 고정
 * - **좋아요/댓글** - 상호작용 기능
 * - **투표** - 트위터 스타일 투표 (1회 투표, 재클릭 취소)
 * - **관리 액션** - 편집, 삭제, 고정 토글
 *
 * ## 사용 위치
 *
 * `/project/:id/community/devfeed`
 */
const meta = {
  title: "Pages/Project/DevPostCard (공지사항 피드)",
  component: DevPostCard,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
프로젝트 커뮤니티의 공지사항 피드를 표시하는 카드 컴포넌트입니다.

## 타입별 특징

### 📢 공지 (announcement)
- 프로젝트의 중요 공지사항
- 상단 고정 기능 지원
- 베타 테스트, 이벤트 등 안내

### ✨ 업데이트 (update)
- 버전 릴리즈, 서버 점검 등
- 기술적인 업데이트 소식

### 🗳️ 투표 (vote)
- 커뮤니티 의견 수렴
- 트위터 스타일 투표 UI
- 실시간 퍼센트 표시
- 1회 투표, 재클릭 시 취소

## 인터랙션

\`\`\`tsx
<DevPostCard
  post={post}
  onEdit={() => openEditModal(post)}
  onDelete={() => deletePost(post.id)}
  onTogglePin={() => togglePin(post.id)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DevPostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== 기본 타입별 스토리 ==========

export const Announcement: Story = {
  name: "1-1. 공지 (Announcement)",
  args: {
    post: mockAnnouncement,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**공지 타입** - 프로젝트의 중요 공지사항을 표시합니다.

- 상단 고정 시 파란색 테두리와 "고정됨" 배지 표시
- 베타 테스트, 이벤트, 중요 안내 등에 사용
        `,
      },
    },
  },
};

export const Update: Story = {
  name: "1-2. 업데이트 (Update)",
  args: {
    post: mockUpdate,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**업데이트 타입** - 서비스 업데이트 소식을 전달합니다.

- 버전 릴리즈, 서버 점검, 기능 변경 등
- 개발팀의 기술적 안내에 사용
        `,
      },
    },
  },
};

export const VoteBeforeVoting: Story = {
  name: "1-3. 투표 - 투표 전",
  args: {
    post: mockVote,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**투표 타입 (투표 전)** - 아직 투표하지 않은 상태입니다.

- 투표 옵션이 버튼으로 표시
- 퍼센트 미표시 (투표 전)
- 클릭하면 투표 완료
        `,
      },
    },
  },
};

export const VoteAfterVoting: Story = {
  name: "1-4. 투표 - 투표 후",
  args: {
    post: mockVoteWithSelection,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**투표 타입 (투표 후)** - 투표를 완료한 상태입니다.

- 진행률 바와 퍼센트 표시
- 선택한 옵션에 체크 아이콘
- 같은 옵션 클릭 시 투표 취소
        `,
      },
    },
  },
};

// ========== 상태별 스토리 ==========

export const Pinned: Story = {
  name: "2-1. 고정된 공지",
  args: {
    post: { ...mockAnnouncement, isPinned: true },
  },
  parameters: {
    docs: {
      description: {
        story: `
**고정된 공지사항**

- 파란색 테두리 (ring-2 ring-primary-200)
- "고정됨" 배지 표시
- 피드 목록 최상단에 정렬
        `,
      },
    },
  },
};

export const WithoutActions: Story = {
  name: "2-2. 액션 버튼 없음 (일반 사용자)",
  args: {
    post: mockAnnouncement,
    showActions: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**일반 사용자 뷰** - 관리 액션 버튼이 표시되지 않습니다.

- 편집/삭제/고정 버튼 미표시
- 좋아요, 댓글 버튼만 표시
        `,
      },
    },
  },
};

export const Liked: Story = {
  name: "2-3. 좋아요 누른 상태",
  args: {
    post: { ...mockAnnouncement, isLiked: true, likesCount: 46 },
  },
  parameters: {
    docs: {
      description: {
        story: `
**좋아요 활성화 상태**

- 하트 아이콘이 빨간색으로 채워짐
- 다시 클릭하면 좋아요 취소
        `,
      },
    },
  },
};

// ========== 통합 예시 ==========

export const AllTypes: Story = {
  name: "3-1. 모든 타입 비교",
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">📢 공지</h3>
      <DevPostCard post={mockAnnouncement} />

      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 pt-4">✨ 업데이트</h3>
      <DevPostCard post={mockUpdate} />

      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 pt-4">🗳️ 투표</h3>
      <DevPostCard post={mockVote} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "공지, 업데이트, 투표 - 3가지 타입을 한눈에 비교합니다.",
      },
    },
  },
};

export const FeedTimeline: Story = {
  name: "3-2. 피드 타임라인 예시",
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {["전체", "공지", "업데이트", "투표"].map((label) => (
            <button
              key={label}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                label === "전체"
                  ? "bg-primary-100 text-primary-700"
                  : "text-surface-500 hover:bg-surface-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm">
          <Megaphone className="h-4 w-4 mr-1" />
          공지 작성
        </Button>
      </div>

      <DevPostCard post={mockAnnouncement} onTogglePin={() => {}} onEdit={() => {}} onDelete={() => {}} />
      <DevPostCard post={mockVoteWithSelection} onTogglePin={() => {}} onEdit={() => {}} onDelete={() => {}} />
      <DevPostCard post={mockUpdate} onTogglePin={() => {}} onEdit={() => {}} onDelete={() => {}} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**실제 피드 타임라인 예시**

- 필터 탭 (전체/공지/업데이트/투표)
- 공지 작성 버튼
- 고정된 게시물이 상단에 표시
        `,
      },
    },
  },
};

export const VoteInteraction: Story = {
  name: "3-3. 투표 인터랙션 데모",
  render: () => {
    const [voted, setVoted] = useState<string | undefined>(undefined);
    const [options, setOptions] = useState([
      { id: "vo1", text: "다크모드 지원", votesCount: 45 },
      { id: "vo2", text: "모바일 앱 출시", votesCount: 38 },
      { id: "vo3", text: "API 확장", votesCount: 22 },
    ]);
    const [total, setTotal] = useState(105);

    const handleVote = (optionId: string) => {
      if (voted === optionId) {
        setOptions((prev) =>
          prev.map((opt) =>
            opt.id === optionId ? { ...opt, votesCount: opt.votesCount - 1 } : opt
          )
        );
        setTotal((prev) => prev - 1);
        setVoted(undefined);
      } else {
        setOptions((prev) =>
          prev.map((opt) => {
            if (opt.id === optionId) return { ...opt, votesCount: opt.votesCount + 1 };
            if (opt.id === voted) return { ...opt, votesCount: opt.votesCount - 1 };
            return opt;
          })
        );
        if (!voted) setTotal((prev) => prev + 1);
        setVoted(optionId);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-surface-500">
          👆 아래 투표 옵션을 클릭해보세요! 같은 옵션을 다시 클릭하면 취소됩니다.
        </p>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              🗳️ 다음 기능 투표
            </h3>
            <div className="space-y-2">
              {options.map((option) => {
                const percentage = total > 0 ? Math.round((option.votesCount / total) * 100) : 0;
                const isSelected = voted === option.id;
                const hasVoted = !!voted;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    className={cn(
                      "relative w-full text-left rounded-lg border-2 overflow-hidden transition-all",
                      isSelected
                        ? "border-primary-400"
                        : "border-surface-200 hover:border-surface-300"
                    )}
                  >
                    {hasVoted && (
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 transition-all",
                          isSelected ? "bg-primary-100" : "bg-surface-100"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    <div className="relative px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-primary-700" : "text-surface-700"
                        )}>
                          {option.text}
                        </span>
                      </div>
                      {hasVoted && (
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          isSelected ? "text-primary-600" : "text-surface-500"
                        )}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-surface-400 mt-3">
              {total}명 투표 참여
              {voted && " · 다시 클릭하면 투표 취소"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**투표 인터랙션 데모**

- 옵션 클릭 → 투표 & 퍼센트 표시
- 같은 옵션 재클릭 → 투표 취소
- 실시간 집계 업데이트
        `,
      },
    },
  },
};

