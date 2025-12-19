# 프로젝트 목록 컴포넌트

## 개요

`ProjectList`는 프로젝트 목록을 표시하는 공통 컴포넌트입니다. 로딩, 에러, 빈 상태, 목록 표시를 모두 처리하며, 내 프로젝트 여부를 자동으로 감지하여 별표시를 표시합니다.

## 위치

- **컴포넌트**: `src/entities/project/ui/ProjectList.tsx`
- **스토리**: `src/entities/project/ui/ProjectList.stories.tsx`
- **Export**: `src/entities/project/ui/index.ts`

## 주요 기능

### 1. 자동 내 프로젝트 감지

현재 사용자 ID와 프로젝트 작성자 ID를 비교하여 자동으로 `isMyProject` 속성을 설정합니다. 내 프로젝트는 `ProjectListItem`에서 별표시로 표시됩니다.

```tsx
// 자동으로 처리됨
const isMyProject = user && user.id === project.author.id;
```

### 2. 로딩 상태 처리

초기 로딩 시 `ProjectsLoading` 컴포넌트를 사용하여 스켈레톤 UI를 표시합니다.

```tsx
<ProjectList
  projects={projects}
  isLoading={true} // 스켈레톤 UI 표시
/>
```

### 3. 에러 상태 처리

에러가 발생하면 에러 메시지를 표시합니다.

```tsx
<ProjectList
  projects={projects}
  error="프로젝트를 불러오는 중 오류가 발생했습니다."
/>
```

### 4. 빈 상태 처리

프로젝트가 없을 때 기본 메시지 또는 커스텀 컴포넌트를 표시할 수 있습니다.

```tsx
// 기본 빈 상태
<ProjectList projects={[]} />

// 커스텀 빈 상태
<ProjectList
  projects={[]}
  emptyState={
    <div className="py-16 text-center">
      <h3>저장한 프로젝트가 없습니다</h3>
    </div>
  }
/>
```

### 5. 더 보기 버튼

페이지네이션을 위한 더 보기 버튼을 지원합니다.

```tsx
<ProjectList
  projects={projects}
  hasMore={true}
  isLoadingMore={isLoadingMore}
  onLoadMore={handleLoadMore}
/>
```

## 사용법

### 기본 사용

```tsx
import { ProjectList } from "@/entities/project";
import { useProjectStore } from "@/entities/project";

function MyPage() {
  const { toggleProjectLike } = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <ProjectList
      projects={projects}
      isLoading={isLoading}
      error={error}
      onUpvote={toggleProjectLike}
    />
  );
}
```

### 순위 표시

```tsx
<ProjectList
  projects={projects}
  showRank={true} // 1. 2. 3. ... 순위 표시
  onUpvote={toggleProjectLike}
/>
```

### 더 보기 버튼 포함

```tsx
const [hasMore, setHasMore] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);

const handleLoadMore = async () => {
  setIsLoadingMore(true);
  // 더 많은 프로젝트 로드
  setIsLoadingMore(false);
};

<ProjectList
  projects={projects}
  hasMore={hasMore}
  isLoadingMore={isLoadingMore}
  onLoadMore={handleLoadMore}
  onUpvote={toggleProjectLike}
/>
```

## Props

| Prop | Type | 기본값 | 필수 | 설명 |
|------|------|--------|------|------|
| projects | `Project[]` | - | ✅ | 표시할 프로젝트 목록 |
| isLoading | `boolean` | `false` | - | 로딩 중인지 여부 |
| error | `string \| null` | `null` | - | 에러 메시지 |
| emptyState | `ReactNode` | - | - | 빈 상태일 때 표시할 컴포넌트 |
| onUpvote | `(projectId: string) => void` | - | - | 프로젝트 좋아요 토글 핸들러 |
| showRank | `boolean` | `false` | - | 순위 표시 여부 |
| hasMore | `boolean` | `false` | - | 더 보기 버튼 표시 여부 |
| onLoadMore | `() => void` | - | - | 더 보기 버튼 클릭 핸들러 |
| isLoadingMore | `boolean` | `false` | - | 더 보기 버튼 로딩 중인지 여부 |
| dividerClassName | `string` | `"divide-y divide-surface-100 dark:divide-surface-800/60"` | - | 목록 구분선 스타일 |

## 사용 위치

- `/explore` - 프로젝트 탐색 페이지
- `/bookmark/project` - 저장한 프로젝트 페이지
- 기타 프로젝트 목록이 필요한 모든 페이지

## 내부 동작

1. **내 프로젝트 감지**: `useUserStore`에서 현재 사용자 정보를 가져와 각 프로젝트의 작성자와 비교합니다.

2. **상태별 렌더링**:
   - `isLoading && projects.length === 0`: 스켈레톤 UI 표시
   - `error`: 에러 메시지 표시
   - `projects.length === 0`: 빈 상태 표시
   - 그 외: 프로젝트 목록 표시

3. **프로젝트 렌더링**: 각 프로젝트에 대해 `isMyProject` 속성을 추가하여 `ProjectListItem`에 전달합니다.

## 주의사항

- `onUpvote` 핸들러는 선택사항이지만, 좋아요 기능을 사용하려면 필수입니다.
- `hasMore`가 `true`일 때는 반드시 `onLoadMore` 핸들러를 제공해야 합니다.
- 내 프로젝트 감지는 `useUserStore`의 `user` 정보에 의존하므로, 사용자가 로그인하지 않은 경우 작동하지 않습니다.

## 관련 컴포넌트

- `ProjectListItem`: 개별 프로젝트 아이템 컴포넌트
- `ProjectsLoading`: 프로젝트 목록 로딩 스켈레톤 UI
- `useUserStore`: 현재 사용자 정보를 제공하는 스토어

