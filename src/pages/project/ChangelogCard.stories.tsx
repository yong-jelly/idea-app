import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BrowserRouter } from "react-router";
import {
  Github,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Sparkles,
  ThumbsUp,
  Bug,
  AlertCircle,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

// ========== 타입 정의 ==========

interface ChangelogChange {
  id: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  description: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: ChangelogChange[];
  releasedAt: string;
  repositoryUrl?: string;
  downloadUrl?: string;
}

// ========== 상수 ==========

const CHANGE_TYPE_INFO = {
  feature: { label: "새 기능", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400", icon: Sparkles },
  improvement: { label: "개선", color: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400", icon: ThumbsUp },
  fix: { label: "수정", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: Bug },
  breaking: { label: "주의", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400", icon: AlertCircle },
};

const MAX_VISIBLE_CHANGES = 5;

// ========== 헬퍼 함수 ==========

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// ========== ChangelogCard 컴포넌트 ==========

interface ChangelogCardProps {
  entry: ChangelogEntry;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

function ChangelogCard({ entry, onEdit, onDelete, showActions = true }: ChangelogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreChanges = entry.changes.length > MAX_VISIBLE_CHANGES;
  const visibleChanges = isExpanded ? entry.changes : entry.changes.slice(0, MAX_VISIBLE_CHANGES);
  const hiddenCount = entry.changes.length - MAX_VISIBLE_CHANGES;

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {entry.version}
              </Badge>
              <span className="text-sm text-surface-500">{entry.releasedAt}</span>
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {entry.title}
            </h3>
            {/* 링크 표시 */}
            {(entry.repositoryUrl || entry.downloadUrl) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {entry.repositoryUrl && (
                  <a
                    href={entry.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.repositoryUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
                {entry.downloadUrl && (
                  <a
                    href={entry.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.downloadUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            )}
          </div>
          {/* 관리 액션 */}
          {showActions && (onEdit || onDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  title="수정"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        {entry.description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
            {entry.description}
          </p>
        )}
        <div className="space-y-2">
          {visibleChanges.map((change) => (
            <div key={change.id} className="flex items-start gap-2">
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium shrink-0", CHANGE_TYPE_INFO[change.type].color)}>
                {CHANGE_TYPE_INFO[change.type].label}
              </span>
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {change.description}
              </span>
            </div>
          ))}
        </div>
        {/* 더 보기 버튼 */}
        {hasMoreChanges && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {hiddenCount}개 더 보기
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ========== 데모 데이터 ==========

const mockChangelogSmall: ChangelogEntry = {
  id: "cl1",
  version: "1.5.2",
  title: "버그 수정 및 안정화",
  description: "여러 버그를 수정하고 안정성을 개선했습니다.",
  changes: [
    { id: "ch1", type: "fix", description: "Safari 이미지 로딩 오류 수정" },
    { id: "ch2", type: "fix", description: "모바일에서 스크롤 문제 해결" },
    { id: "ch3", type: "improvement", description: "에러 메시지 개선" },
  ],
  releasedAt: "2024-11-15",
  repositoryUrl: "https://github.com/example/project/releases/tag/v1.5.2",
};

const mockChangelogWithLinks: ChangelogEntry = {
  id: "cl2",
  version: "2.0.0-beta",
  title: "v2.0 베타 릴리즈",
  description: "대규모 업데이트! AI 기능과 새로운 UI를 만나보세요.",
  changes: [
    { id: "ch1", type: "feature", description: "AI 기반 자동 추천 시스템 추가" },
    { id: "ch2", type: "feature", description: "다크모드 지원" },
    { id: "ch3", type: "improvement", description: "전체 UI/UX 개선" },
    { id: "ch4", type: "improvement", description: "페이지 로딩 속도 50% 향상" },
  ],
  releasedAt: "2024-12-01",
  repositoryUrl: "https://github.com/example/project/releases/tag/v2.0.0-beta",
  downloadUrl: "https://example.com/downloads/v2.0.0-beta",
};

const mockChangelogManyChanges: ChangelogEntry = {
  id: "cl3",
  version: "3.0.0",
  title: "메이저 업데이트 - 완전히 새로워진 경험",
  description: "1년간의 개발 끝에 완전히 새로운 버전을 출시합니다.",
  changes: [
    { id: "ch1", type: "feature", description: "AI 기반 자동 추천 시스템 추가" },
    { id: "ch2", type: "feature", description: "다크모드 지원" },
    { id: "ch3", type: "feature", description: "실시간 알림 시스템" },
    { id: "ch4", type: "feature", description: "다국어 지원 (영어, 일본어)" },
    { id: "ch5", type: "improvement", description: "전체 UI/UX 개선" },
    { id: "ch6", type: "improvement", description: "페이지 로딩 속도 50% 향상" },
    { id: "ch7", type: "improvement", description: "모바일 반응형 레이아웃 최적화" },
    { id: "ch8", type: "fix", description: "Safari 브라우저 호환성 문제 해결" },
    { id: "ch9", type: "fix", description: "메모리 누수 문제 해결" },
    { id: "ch10", type: "breaking", description: "API v1 지원 종료" },
    { id: "ch11", type: "breaking", description: "Node.js 18+ 필수" },
  ],
  releasedAt: "2025-01-01",
  repositoryUrl: "https://github.com/example/project/releases/tag/v3.0.0",
  downloadUrl: "https://releases.example.com/v3.0.0/download",
};

const mockChangelogNoLinks: ChangelogEntry = {
  id: "cl4",
  version: "1.0.0",
  title: "최초 릴리즈",
  description: "첫 번째 정식 버전입니다.",
  changes: [
    { id: "ch1", type: "feature", description: "기본 기능 구현" },
    { id: "ch2", type: "feature", description: "사용자 인증 시스템" },
  ],
  releasedAt: "2024-06-01",
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
 * # 변경사항 카드 (ChangelogCard)
 *
 * 프로젝트의 릴리즈/변경사항을 표시하는 카드 컴포넌트입니다.
 *
 * ## 주요 기능
 *
 * - **버전 배지** - 릴리즈 버전 표시
 * - **링크 표시** - 저장소/다운로드 URL을 아이콘+도메인 형태로 표시
 * - **더보기** - 5개 이상의 변경사항은 접기/펼치기
 * - **관리 액션** - hover 시 수정/삭제 버튼
 *
 * ## 변경사항 타입
 *
 * | 타입 | 라벨 | 색상 |
 * |------|------|------|
 * | `feature` | 새 기능 | 🟢 초록 |
 * | `improvement` | 개선 | 🔵 파랑 |
 * | `fix` | 수정 | 🟡 노랑 |
 * | `breaking` | 주의 | 🔴 빨강 |
 *
 * ## 사용 위치
 *
 * `/project/:id/community/changelog`
 */
const meta = {
  title: "Pages/Project/ChangelogCard (변경사항)",
  component: ChangelogCard,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
프로젝트의 릴리즈 히스토리와 변경사항을 표시하는 카드 컴포넌트입니다.

## 기능

### 버전 정보
- 버전 배지 (예: v2.0.0-beta)
- 릴리즈 날짜

### 링크 표시
타이틀 하단에 아이콘과 도메인으로 표시:
- 📦 github.com ↗ (저장소)
- 📥 example.com ↗ (다운로드)

### 더보기 기능
변경사항이 5개를 초과하면:
- 처음 5개만 표시
- "N개 더 보기" 버튼
- 클릭 시 전체 표시 / "접기" 토글

### 관리 액션
hover 시 수정/삭제 버튼 표시 (관리자용)

## 사용법

\`\`\`tsx
<ChangelogCard
  entry={changelog}
  onEdit={() => openModal(changelog)}
  onDelete={() => deleteChangelog(changelog.id)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ChangelogCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== 기본 스토리 ==========

export const Default: Story = {
  name: "1-1. 기본 (3개 항목)",
  args: {
    entry: mockChangelogSmall,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**기본 변경사항 카드** - 3개의 변경 항목

- 저장소 링크만 포함
- 모든 항목이 바로 표시됨 (5개 이하)
        `,
      },
    },
  },
};

export const WithLinks: Story = {
  name: "1-2. 링크 포함",
  args: {
    entry: mockChangelogWithLinks,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**저장소 + 다운로드 링크 포함**

링크가 타이틀 아래에 아이콘과 함께 표시됩니다:
- 📦 github.com ↗
- 📥 example.com ↗
        `,
      },
    },
  },
};

export const ManyChanges: Story = {
  name: "1-3. 많은 변경사항 (11개)",
  args: {
    entry: mockChangelogManyChanges,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**11개의 변경 항목** - 더보기 기능 활성화

- 처음 5개만 표시
- "6개 더 보기" 버튼 클릭 시 전체 표시
- 다시 클릭하면 "접기"
        `,
      },
    },
  },
};

export const NoLinks: Story = {
  name: "1-4. 링크 없음",
  args: {
    entry: mockChangelogNoLinks,
    showActions: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**링크 없는 변경사항** - 기본 정보만 표시

저장소/다운로드 URL이 없을 때의 레이아웃입니다.
        `,
      },
    },
  },
};

export const WithoutActions: Story = {
  name: "2-1. 액션 버튼 없음",
  args: {
    entry: mockChangelogWithLinks,
    showActions: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**일반 사용자 뷰** - 수정/삭제 버튼이 표시되지 않습니다.
        `,
      },
    },
  },
};

// ========== 통합 예시 ==========

export const AllTypes: Story = {
  name: "3-1. 모든 변경사항 타입",
  render: () => (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">변경사항 타입 예시</h3>
        <div className="space-y-2">
          {(["feature", "improvement", "fix", "breaking"] as const).map((type) => {
            const info = CHANGE_TYPE_INFO[type];
            const Icon = info.icon;
            return (
              <div key={type} className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium shrink-0 flex items-center gap-1", info.color)}>
                  <Icon className="h-3 w-3" />
                  {info.label}
                </span>
                <span className="text-sm text-surface-600">
                  {type === "feature" && "새로운 기능이 추가되었습니다"}
                  {type === "improvement" && "기존 기능이 개선되었습니다"}
                  {type === "fix" && "버그가 수정되었습니다"}
                  {type === "breaking" && "호환성에 주의가 필요합니다"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "4가지 변경사항 타입과 각각의 색상/아이콘을 보여줍니다.",
      },
    },
  },
};

export const ChangelogTimeline: Story = {
  name: "3-2. 타임라인 예시",
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">총 4개의 릴리즈</p>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          변경사항 추가
        </Button>
      </div>

      <ChangelogCard
        entry={mockChangelogManyChanges}
        onEdit={() => console.log("Edit")}
        onDelete={() => console.log("Delete")}
      />
      <ChangelogCard
        entry={mockChangelogWithLinks}
        onEdit={() => console.log("Edit")}
        onDelete={() => console.log("Delete")}
      />
      <ChangelogCard
        entry={mockChangelogSmall}
        onEdit={() => console.log("Edit")}
        onDelete={() => console.log("Delete")}
      />
      <ChangelogCard
        entry={mockChangelogNoLinks}
        onEdit={() => console.log("Edit")}
        onDelete={() => console.log("Delete")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**실제 변경사항 탭 레이아웃**

- 헤더에 총 릴리즈 수와 추가 버튼
- 최신 릴리즈가 상단에 표시
- 각 카드에 hover 시 수정/삭제 버튼
        `,
      },
    },
  },
};

export const ExpandCollapseDemo: Story = {
  name: "3-3. 더보기/접기 인터랙션",
  render: () => {
    const [expanded, setExpanded] = useState(false);
    const allChanges = mockChangelogManyChanges.changes;
    const visibleChanges = expanded ? allChanges : allChanges.slice(0, 5);
    const hiddenCount = allChanges.length - 5;

    return (
      <div className="space-y-4">
        <p className="text-sm text-surface-500">
          👆 아래 "더 보기" 버튼을 클릭해보세요!
        </p>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary-100 text-primary-700">v3.0.0</Badge>
              <span className="text-sm text-surface-500">2025-01-01</span>
            </div>
            <h3 className="font-semibold text-surface-900 mb-4">
              메이저 업데이트
            </h3>
            <div className="space-y-2">
              {visibleChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium shrink-0", CHANGE_TYPE_INFO[change.type].color)}>
                    {CHANGE_TYPE_INFO[change.type].label}
                  </span>
                  <span className="text-sm text-surface-700">
                    {change.description}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {hiddenCount}개 더 보기
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
**더보기/접기 인터랙션 데모**

- 5개 초과 시 나머지 항목 숨김
- "N개 더 보기" 클릭 → 전체 표시
- "접기" 클릭 → 다시 5개만 표시
        `,
      },
    },
  },
};

export const EmptyState: Story = {
  name: "3-4. 빈 상태",
  render: () => (
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="h-10 w-10 mx-auto mb-3 text-surface-300" />
        <p className="text-surface-500">아직 변경사항이 없습니다</p>
        <Button variant="outline" size="sm" className="mt-4">
          <Plus className="h-4 w-4 mr-1" />
          첫 변경사항 추가
        </Button>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "변경사항이 없을 때 표시되는 빈 상태 UI입니다.",
      },
    },
  },
};








