# 피드 Row 컴포넌트 가이드

## 개요

이 문서는 프로젝트에서 사용되는 다양한 피드 Row 컴포넌트에 대해 설명합니다.

총 **14가지 피드 타입**을 지원하며, 각 타입별로 최적화된 UI를 제공합니다.

## 피드 종류

### 1. 일반 피드 (4종)

| 컴포넌트 | 설명 | 용도 |
|---------|------|------|
| `TextPostRow` | 일반 텍스트 포스트 | 사용자의 일반 게시물 |
| `ProjectUpdateRow` | 프로젝트 업데이트 | 릴리즈, 변경사항 알림 |
| `MilestoneAchievedRow` | 마일스톤 달성 | 프로젝트 마일스톤 축하 |
| `FeatureAcceptedRow` | 기능 제안 수락 | 커뮤니티 요청 수락 알림 |

### 2. 개발사 피드 (2종)

| 컴포넌트 | 설명 | 용도 |
|---------|------|------|
| `AnnouncementRow` | 공지/업데이트 안내 | 개발팀 공지사항 |
| `DiscussionRow` | 토론/투표 | 커뮤니티 토론 참여 유도 |

### 3. 피드백 피드 (4종)

| 컴포넌트 | 설명 | 용도 |
|---------|------|------|
| `FeedbackRow` (bug) | 버그 리포트 | 버그 제보 |
| `FeedbackRow` (feature) | 기능 요청 | 새 기능 제안 |
| `FeedbackRow` (improvement) | 개선 제안 | 기존 기능 개선 제안 |
| `FeedbackRow` (question) | 질문 | 사용법 문의 등 |

### 4. 기타 (3종)

| 컴포넌트 | 설명 | 용도 |
|---------|------|------|
| `MilestoneProgressRow` | 마일스톤 진행 | 프로젝트 진행 상황 표시 |
| `RewardRow` | 리워드 교환 | 포인트 리워드 표시 |
| `ChangelogRow` | 변경사항 | 릴리즈 히스토리 |

---

## 사용법

### 기본 Import

```tsx
import { 
  TextPostRow, 
  ProjectUpdateRow,
  MilestoneAchievedRow,
  FeatureAcceptedRow,
  AnnouncementRow,
  DiscussionRow,
  FeedbackRow,
  MilestoneProgressRow,
  RewardRow,
  ChangelogRow,
} from "@/entities/feed";
```

### 예시: 일반 텍스트 포스트

```tsx
import { TextPostRow } from "@/entities/feed";
import type { TextPost } from "@/entities/feed";

const post: TextPost = {
  id: "1",
  type: "text",
  author: {
    id: "u1",
    username: "indie_dev",
    displayName: "김인디",
  },
  content: "오늘 드디어 베타 버전을 완성했습니다! 🎉",
  interactions: {
    likesCount: 156,
    commentsCount: 45,
    repostsCount: 23,
    bookmarksCount: 67,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
  },
  createdAt: new Date().toISOString(),
};

function MyFeed() {
  return (
    <TextPostRow
      post={post}
      onLike={() => console.log("Like")}
      onComment={() => console.log("Comment")}
      onRepost={() => console.log("Repost")}
      onBookmark={() => console.log("Bookmark")}
      onShare={() => console.log("Share")}
    />
  );
}
```

### 예시: 프로젝트 업데이트

```tsx
import { ProjectUpdateRow } from "@/entities/feed";
import type { ProjectUpdatePost } from "@/entities/feed";

const updatePost: ProjectUpdatePost = {
  id: "2",
  type: "project_update",
  author: {
    id: "u1",
    username: "indie_dev",
    displayName: "김인디",
  },
  content: "v2.0 릴리즈! 🚀\n\n- 성능 50% 개선\n- 다크모드 지원",
  projectId: "p1",
  projectTitle: "나의 프로젝트",
  interactions: { /* ... */ },
  createdAt: new Date().toISOString(),
};

function ProjectFeed() {
  return <ProjectUpdateRow post={updatePost} />;
}
```

### 예시: 피드백 (버그 리포트)

```tsx
import { FeedbackRow } from "@/entities/feed";
import type { FeedbackPost } from "@/entities/feed";

const bugReport: FeedbackPost = {
  id: "fb1",
  type: "bug",
  title: "Safari에서 이미지 로딩 오류",
  content: "Safari 브라우저에서 이미지가 로딩되지 않습니다.",
  author: { /* ... */ },
  status: "in_progress",
  votesCount: 23,
  isVoted: true,
  commentsCount: 12,
  createdAt: new Date().toISOString(),
};

function FeedbackList() {
  return (
    <FeedbackRow
      feedback={bugReport}
      onVote={() => console.log("Vote")}
      onClick={() => console.log("Detail")}
    />
  );
}
```

### 예시: 마일스톤 진행

```tsx
import { MilestoneProgressRow } from "@/entities/feed";
import type { MilestoneProgress } from "@/entities/feed";

const milestone: MilestoneProgress = {
  id: "m1",
  title: "베타 테스트",
  description: "1000명의 베타 테스터와 함께 제품 검증",
  targetDate: "2024-12-01",
  deliverables: ["테스터 모집", "피드백 수집", "버그 수정"],
  isCompleted: false,
  progress: 75,
};

function MilestoneList() {
  return <MilestoneProgressRow milestone={milestone} />;
}
```

---

## 타입 정의

### 공통 타입

```typescript
// 기본 작성자 정보
interface BaseAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

// 역할 포함 작성자
interface AuthorWithRole extends BaseAuthor {
  role?: string;
}

// 기본 인터랙션
interface BaseInteractions {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

// 확장 인터랙션 (리포스트, 북마크 포함)
interface ExtendedInteractions extends BaseInteractions {
  repostsCount: number;
  bookmarksCount: number;
  isReposted: boolean;
  isBookmarked: boolean;
}
```

### 피드백 타입 & 상태

```typescript
type FeedbackType = "bug" | "feature" | "improvement" | "question";
type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
```

---

## 스토리북

스토리북에서 모든 피드 Row 컴포넌트를 확인할 수 있습니다:

```bash
bun run storybook
```

경로: `Entities/Feed/FeedRows`

---

## 디자인 가이드라인

### 색상 규칙

| 타입 | 주요 색상 | 용도 |
|------|----------|------|
| 마일스톤 달성 | Emerald (초록) | 축하, 성공 |
| 프로젝트 업데이트 | Primary (보라) | 새로운 소식 |
| 기능 수락 | Sky (하늘) | 긍정적 피드백 |
| 버그 | Rose (빨강) | 문제 보고 |
| 기능 요청 | Amber (노랑) | 아이디어 |
| 개선 제안 | Primary (보라) | 제안 |
| 질문 | Blue (파랑) | 정보 요청 |

### 인터랙션

- 모든 피드 Row는 hover 시 배경색 변화
- 좋아요/북마크는 토글 애니메이션
- 확장 가능한 컨텐츠는 ChevronDown/Up 아이콘

---

## 파일 구조

```
src/entities/feed/
├── index.ts
├── model/
│   └── feed.types.ts        # 모든 타입 정의
└── ui/
    ├── index.ts
    ├── FeedRowBase.tsx      # 공통 컴포넌트
    ├── FeedRows.stories.tsx # 스토리북
    └── rows/
        ├── index.ts
        ├── TextPostRow.tsx
        ├── ProjectUpdateRow.tsx
        ├── MilestoneAchievedRow.tsx
        ├── FeatureAcceptedRow.tsx
        ├── AnnouncementRow.tsx
        ├── DiscussionRow.tsx
        ├── FeedbackRow.tsx
        ├── MilestoneProgressRow.tsx
        ├── RewardRow.tsx
        └── ChangelogRow.tsx
```

