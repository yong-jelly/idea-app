# 빈 상태 컴포넌트 (EmptyState)

## 개요

`EmptyState`는 데이터가 없을 때 사용자에게 친절한 안내를 제공하는 공통 컴포넌트입니다. 피드, 목록, 검색 결과 등 다양한 상황에서 일관된 빈 상태 UI를 제공합니다.

## 위치

- **컴포넌트**: `src/shared/ui/EmptyState.tsx`
- **스토리**: `src/shared/ui/EmptyState.stories.tsx`
- **Export**: `src/shared/ui/index.ts`

## 주요 기능

### 1. 아이콘 표시

빈 상태를 시각적으로 표현하기 위한 아이콘을 표시할 수 있습니다. lucide-react 아이콘을 사용하는 것을 권장합니다.

```tsx
import { MessageSquare } from "lucide-react";

<EmptyState
  icon={<MessageSquare className="h-8 w-8" />}
  title="피드가 비어있습니다"
/>
```

### 2. 제목과 설명

명확한 제목과 선택적인 설명을 제공할 수 있습니다.

```tsx
<EmptyState
  title="피드가 비어있습니다"
  description="아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!"
/>
```

### 3. 액션 버튼

사용자가 다음 행동을 취할 수 있도록 액션 버튼을 추가할 수 있습니다.

```tsx
import { Button } from "@/shared/ui";

<EmptyState
  title="피드가 비어있습니다"
  description="첫 번째 포스트를 작성해보세요!"
  action={<Button size="sm">포스트 작성</Button>}
/>
```

### 4. 크기 조정

패딩 크기를 `sm`, `md`, `lg` 중에서 선택할 수 있습니다.

```tsx
<EmptyState
  title="데이터가 없습니다"
  size="lg" // sm, md, lg 중 선택
/>
```

## 사용법

### 기본 사용

```tsx
import { EmptyState } from "@/shared/ui";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox className="h-8 w-8" />}
  title="데이터가 없습니다"
  description="표시할 내용이 없습니다."
/>
```

### 피드 빈 상태

```tsx
import { EmptyState } from "@/shared/ui";
import { MessageSquare } from "lucide-react";
import { Button } from "@/shared/ui";

<EmptyState
  icon={<MessageSquare className="h-8 w-8" />}
  title="피드가 비어있습니다"
  description="아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!"
  action={<Button size="sm" variant="primary">포스트 작성</Button>}
  size="lg"
/>
```

### 검색 결과 빈 상태

```tsx
import { EmptyState } from "@/shared/ui";
import { Search } from "lucide-react";

<EmptyState
  icon={<Search className="h-8 w-8" />}
  title="검색 결과가 없습니다"
  description="다른 키워드로 검색해보세요."
/>
```

### 저장 목록 빈 상태

```tsx
import { EmptyState } from "@/shared/ui";
import { Bookmark } from "lucide-react";

<EmptyState
  icon={<Bookmark className="h-8 w-8" />}
  title="저장한 항목이 없습니다"
  description="관심 있는 항목을 저장하면 여기에 표시됩니다."
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `ReactNode` | No | - | 아이콘 컴포넌트 (lucide-react 아이콘 등) |
| `title` | `string` | Yes | - | 제목 |
| `description` | `string` | No | - | 설명 텍스트 |
| `action` | `ReactNode` | No | - | 액션 버튼 (ReactNode) |
| `className` | `string` | No | - | 추가 클래스명 |
| `size` | `"sm" \| "md" \| "lg"` | No | `"md"` | 패딩 크기 |

## 스타일 가이드

### 아이콘 크기

- 기본: `h-8 w-8` (32px)
- 큰 크기: `h-12 w-12` (48px)
- 작은 크기: `h-6 w-6` (24px)

### 색상

- 아이콘: `text-surface-400 dark:text-surface-500`
- 제목: `text-surface-900 dark:text-surface-50`
- 설명: `text-surface-500 dark:text-surface-400`

### 여백

- 작은 크기 (`sm`): `py-12 px-4`
- 기본 크기 (`md`): `py-16 px-4`
- 큰 크기 (`lg`): `py-24 px-4`

## 적용 예시

### FeedTimeline에 적용

```tsx
if (posts.length === 0 && !isLoading) {
  return (
    <EmptyState
      icon={<MessageSquare className="h-8 w-8" />}
      title="피드가 비어있습니다"
      description="아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!"
      size="lg"
    />
  );
}
```

## 주의사항

1. **로딩 상태와 구분**: 빈 상태는 로딩이 완료된 후에만 표시해야 합니다.
2. **아이콘 선택**: 상황에 맞는 적절한 아이콘을 선택하세요.
3. **액션 제공**: 가능한 경우 사용자가 다음 행동을 취할 수 있도록 액션 버튼을 제공하세요.
4. **일관성**: 프로젝트 전반에서 동일한 스타일과 톤앤매너를 유지하세요.

## 관련 컴포넌트

- `Button`: 액션 버튼으로 사용
- `Skeleton`: 로딩 상태 표시
- `ProjectsLoading`: 프로젝트 목록 로딩 상태




