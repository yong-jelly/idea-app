# 마일스톤 & 태스크 시스템

프로젝트의 목표 관리 및 진행 상황 추적을 위한 마일스톤/태스크 시스템입니다.

## 개요

마일스톤은 프로젝트의 주요 목표나 이정표를 나타내며, 각 마일스톤은 여러 개의 태스크로 구성됩니다.

### 주요 기능
- 마일스톤 CRUD (생성, 조회, 수정, 삭제)
- 태스크 CRUD
- 진행률 자동 계산
- 기한 관리 및 D-day 표시
- 상태 관리 (진행 중/완료)

---

## 데이터 구조

### Milestone

```typescript
interface Milestone {
  id: string;
  projectId: string;
  title: string;           // 마일스톤 제목
  description: string;     // 설명
  dueDate?: string;        // 목표 기한 (YYYY-MM-DD)
  status: "open" | "closed";
  openIssuesCount: number; // 미완료 태스크 수
  closedIssuesCount: number; // 완료된 태스크 수
  tasks?: MilestoneTask[]; // 태스크 목록
  createdAt: string;
  updatedAt: string;
  closedAt?: string;       // 완료 시간
}
```

### MilestoneTask

```typescript
interface MilestoneTask {
  id: string;
  milestoneId: string;
  title: string;           // 태스크 제목
  description?: string;    // 설명 (선택)
  dueDate?: string;        // 기한 (선택)
  status: "todo" | "done";
  createdAt: string;
  completedAt?: string;    // 완료 시간
}
```

---

## URL 구조

```
/project/:id/community/milestones             # 마일스톤 목록
/project/:id/community/milestones/:milestoneId # 마일스톤 상세
```

---

## UI 컴포넌트

### MilestoneRow

마일스톤 목록에서 각 마일스톤을 표시하는 Row 컴포넌트입니다.

```tsx
import { MilestoneRow } from "@/entities/project";

<MilestoneRow
  milestone={milestone}
  onClick={() => navigate(`/project/${id}/community/milestones/${milestone.id}`)}
  onToggleStatus={() => toggleMilestone(milestone.id)}
  compact={false}  // 컴팩트 모드
/>
```

**Props:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| milestone | Milestone | ✓ | 마일스톤 데이터 |
| onClick | () => void | | 클릭 핸들러 |
| onToggleStatus | () => void | | 상태 토글 핸들러 |
| onEdit | () => void | | 수정 핸들러 |
| onDelete | () => void | | 삭제 핸들러 |
| showActions | boolean | | 액션 버튼 표시 여부 (기본: false) |
| compact | boolean | | 컴팩트 모드 (기본: false) |

**표시 정보:**
- 진행률 (% 또는 완료 체크)
- 제목 및 설명
- 완료/남은 태스크 수
- 기한 및 D-day

---

### TaskRow

마일스톤 상세 페이지에서 태스크를 표시하는 Row 컴포넌트입니다.

```tsx
import { TaskRow } from "@/entities/project";

<TaskRow
  task={task}
  onToggle={() => toggleTask(task.id)}
  onEdit={() => openEditModal(task)}
  onDelete={() => deleteTask(task.id)}
  showActions={true}
  compact={false}
/>
```

**Props:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| task | MilestoneTask | ✓ | 태스크 데이터 |
| onToggle | () => void | | 완료 토글 핸들러 |
| onEdit | () => void | | 수정 핸들러 |
| onDelete | () => void | | 삭제 핸들러 |
| onClick | () => void | | 클릭 핸들러 |
| showActions | boolean | | 액션 버튼 표시 (기본: true) |
| compact | boolean | | 컴팩트 모드 (기본: false) |

**표시 정보:**
- 완료 체크박스
- 제목 및 설명
- 기한 또는 완료 시간

---

## 사용자 플로우

### 마일스톤 목록 페이지

1. 프로젝트 커뮤니티 > 마일스톤 탭 클릭
2. 진행 중/완료 필터로 마일스톤 필터링
3. "새 목표" 버튼으로 마일스톤 생성
4. 마일스톤 Row 클릭 → 상세 페이지 이동

### 마일스톤 상세 페이지

1. 마일스톤 헤더에서 전체 진행률 확인
2. "태스크 추가" 버튼으로 새 태스크 생성
3. 체크박스 클릭으로 태스크 완료 처리
4. hover 시 수정/삭제 버튼 표시
5. 모든 태스크 완료 시 마일스톤 완료 가능

---

## 진행률 계산

진행률은 `getMilestoneProgress` 유틸리티 함수를 사용하여 계산됩니다.

```typescript
import { getMilestoneProgress } from "@/pages/project/community/utils/milestone.utils";

const progress = getMilestoneProgress(milestone);
// 0-100 사이의 정수 값 반환
```

**구현:**
```typescript
const progress = totalTasks > 0 
  ? Math.round((closedIssuesCount / (openIssuesCount + closedIssuesCount)) * 100) 
  : 0;
```

---

## D-day 표시 규칙

D-day 레이블은 `getMilestoneDueLabel` 유틸리티 함수를 사용하여 생성됩니다.

```typescript
import { getMilestoneDueLabel } from "@/pages/project/community/utils/milestone.utils";

const dueLabel = getMilestoneDueLabel(milestone.dueDate, milestone.status);
// null (기한 없음 또는 완료됨) 또는 { label: string, isOverdue: boolean }
```

**표시 규칙:**

| 상황 | 표시 | 반환값 |
|------|------|--------|
| 기한 초과 | 빨간색, "N일 지남" | `{ label: "N일 지남", isOverdue: true }` |
| 오늘 마감 | "오늘" | `{ label: "오늘", isOverdue: false }` |
| 기한 남음 | "D-N" | `{ label: "D-N", isOverdue: false }` |
| 기한 없음 | 표시 안 함 | `null` |
| 완료된 항목 | 표시 안 함 | `null` |

---

## Storybook

스토리북에서 컴포넌트 미리보기:

```bash
bun run storybook
```

경로: `Entities/Project/MilestoneRows`

### 제공 스토리

**MilestoneRow:**
- 진행 중 / 완료됨 / 기한 초과 / 기한 없음
- 컴팩트 모드
- 목록 예시

**TaskRow:**
- 할 일 / 완료됨 / 기한 초과
- 간단한 태스크 (설명/기한 없음)
- 컴팩트 모드
- 액션 버튼 없음
- 목록 예시

---

## 파일 구조

```
src/
├── entities/project/
│   ├── model/
│   │   └── project.types.ts    # Milestone, MilestoneTask 타입
│   ├── ui/
│   │   ├── MilestoneRow.tsx    # 마일스톤 Row 컴포넌트
│   │   ├── TaskRow.tsx         # 태스크 Row 컴포넌트
│   │   └── MilestoneRows.stories.tsx  # 스토리북
│   └── api/
│       └── project.api.ts      # 마일스톤 API 함수들
├── pages/project/
│   ├── community/
│   │   ├── index.tsx                 # 커뮤니티 메인 페이지 (마일스톤 탭 포함)
│   │   ├── tabs/
│   │   │   └── MilestonesTab.tsx     # 마일스톤 탭 컴포넌트
│   │   ├── utils/
│   │   │   └── milestone.utils.ts     # 진행률 계산, 기한 레이블 유틸리티
│   │   └── types.ts                   # 타입 정의
│   ├── milestone/
│   │   └── components/                # 마일스톤 상세 페이지 컴포넌트들
│   └── MilestoneDetailPage.tsx        # 마일스톤 상세 페이지
└── app/router/
    └── index.tsx                      # 라우팅 설정
```

