import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { MilestoneRow } from "./MilestoneRow";
import { TaskRow } from "./TaskRow";
import type { Milestone, MilestoneTask } from "../model/project.types";

// ========== 데모 데이터 ==========

const mockMilestoneOpen: Milestone = {
  id: "m1",
  projectId: "1",
  title: "v1.5 - 베타 테스트",
  description: "1000명의 베타 테스터와 함께 제품 검증. 피드백 시스템 구축 및 버그 수정.",
  dueDate: "2024-12-15",
  status: "open",
  openIssuesCount: 3,
  closedIssuesCount: 4,
  tasks: [
    { id: "t1", milestoneId: "m1", title: "베타 테스터 모집", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-10-15T00:00:00Z" },
    { id: "t2", milestoneId: "m1", title: "피드백 시스템 구축", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-10-20T00:00:00Z" },
    { id: "t3", milestoneId: "m1", title: "버그 수정", status: "todo", dueDate: "2024-12-01", createdAt: "2024-10-01T00:00:00Z" },
  ],
  createdAt: "2024-09-01T00:00:00Z",
  updatedAt: "2024-11-01T00:00:00Z",
};

const mockMilestoneClosed: Milestone = {
  id: "m2",
  projectId: "1",
  title: "v1.0 - MVP 출시",
  description: "핵심 기능을 포함한 최소 기능 제품 출시. 사용자 인증, 기본 CRUD, UI 디자인 완성.",
  dueDate: "2024-10-01",
  status: "closed",
  openIssuesCount: 0,
  closedIssuesCount: 5,
  tasks: [],
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-09-28T00:00:00Z",
  closedAt: "2024-09-28T00:00:00Z",
};

const mockMilestoneOverdue: Milestone = {
  id: "m3",
  projectId: "1",
  title: "v2.0 - 정식 출시",
  description: "AI 기능 추가, 성능 최적화, 다국어 지원",
  dueDate: "2024-11-01", // 과거 날짜
  status: "open",
  openIssuesCount: 5,
  closedIssuesCount: 1,
  tasks: [],
  createdAt: "2024-10-01T00:00:00Z",
  updatedAt: "2024-11-15T00:00:00Z",
};

const mockMilestoneNoDate: Milestone = {
  id: "m4",
  projectId: "1",
  title: "백로그 - 추가 기능",
  description: "우선순위가 낮은 기능들 모음",
  status: "open",
  openIssuesCount: 8,
  closedIssuesCount: 2,
  tasks: [],
  createdAt: "2024-10-01T00:00:00Z",
  updatedAt: "2024-11-15T00:00:00Z",
};

const mockTaskTodo: MilestoneTask = {
  id: "t1",
  milestoneId: "m1",
  title: "API 엔드포인트 구현",
  description: "사용자 인증 및 프로필 관련 REST API 엔드포인트를 구현합니다.",
  dueDate: "2024-12-15",
  status: "todo",
  createdAt: "2024-11-01T00:00:00Z",
};

const mockTaskTodoOverdue: MilestoneTask = {
  id: "t2",
  milestoneId: "m1",
  title: "버그 수정 - 로그인 오류",
  description: "특정 브라우저에서 로그인이 실패하는 문제 해결",
  dueDate: "2024-11-01", // 과거 날짜
  status: "todo",
  createdAt: "2024-10-15T00:00:00Z",
};

const mockTaskTodoNoDate: MilestoneTask = {
  id: "t3",
  milestoneId: "m1",
  title: "문서화 작업",
  description: "API 문서 및 사용자 가이드 작성",
  status: "todo",
  createdAt: "2024-11-01T00:00:00Z",
};

const mockTaskDone: MilestoneTask = {
  id: "t4",
  milestoneId: "m1",
  title: "데이터베이스 스키마 설계",
  description: "PostgreSQL 기반 데이터 모델 설계 완료",
  dueDate: "2024-10-15",
  status: "done",
  createdAt: "2024-10-01T00:00:00Z",
  completedAt: "2024-10-14T00:00:00Z",
};

const mockTaskSimple: MilestoneTask = {
  id: "t5",
  milestoneId: "m1",
  title: "UI 컴포넌트 제작",
  status: "todo",
  createdAt: "2024-11-01T00:00:00Z",
};

// ========== Decorator ==========

const withRouter = (Story: React.ComponentType) => (
  <BrowserRouter>
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Story />
    </div>
  </BrowserRouter>
);

// ========== Meta ==========

/**
 * # 마일스톤 & 태스크 Row 컴포넌트
 * 
 * 프로젝트 마일스톤과 태스크를 표시하는 Row 컴포넌트입니다.
 * 
 * ## 컴포넌트 종류
 * 
 * ### MilestoneRow
 * 마일스톤 목록에서 각 마일스톤을 표시합니다.
 * - 진행률 표시 (완료 태스크 / 전체 태스크)
 * - 기한 및 D-day 표시
 * - 완료/진행 중 상태 구분
 * - 컴팩트 모드 지원
 * 
 * ### TaskRow
 * 마일스톤 상세 페이지에서 태스크를 표시합니다.
 * - 완료 토글 기능
 * - 제목, 설명, 기한 표시
 * - 수정/삭제 액션 버튼
 * - 컴팩트 모드 지원
 * 
 * ## 사용 위치
 * - `/project/:id/community/milestones` - 마일스톤 목록
 * - `/project/:id/community/milestones/:milestoneId` - 마일스톤 상세
 */
const meta = {
  title: "Entities/Project/MilestoneRows",
  component: MilestoneRow,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
프로젝트의 마일스톤과 태스크를 표시하는 Row 컴포넌트 모음입니다.

## 사용법

\`\`\`tsx
import { MilestoneRow, TaskRow } from "@/entities/project";

// 마일스톤 Row
<MilestoneRow
  milestone={milestone}
  onClick={() => navigate(\`/project/\${id}/community/milestones/\${milestone.id}\`)}
  onToggleStatus={() => toggleMilestone(milestone.id)}
/>

// 태스크 Row
<TaskRow
  task={task}
  onToggle={() => toggleTask(task.id)}
  onEdit={() => openEditModal(task)}
  onDelete={() => deleteTask(task.id)}
/>
\`\`\`

## 주요 기능

### MilestoneRow
- **진행률 표시**: 완료된 태스크 비율을 시각적으로 표시
- **기한 관리**: D-day 표시, 기한 초과 시 빨간색 강조
- **상태 토글**: 클릭으로 완료/진행 중 상태 전환
- **컴팩트 모드**: 사이드바나 목록에 적합한 작은 사이즈

### TaskRow
- **완료 토글**: 체크박스로 완료 상태 전환
- **상세 정보**: 제목, 설명, 기한 표시
- **액션 버튼**: hover 시 수정/삭제 버튼 표시
- **컴팩트 모드**: 간단한 체크리스트 형태
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MilestoneRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// ========== MilestoneRow Stories ==========

export const MilestoneOpen: Story = {
  name: "1-1. MilestoneRow - 진행 중",
  render: () => (
    <MilestoneRow
      milestone={mockMilestoneOpen}
      onClick={() => console.log("Navigate to milestone")}
      onToggleStatus={() => console.log("Toggle status")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
진행 중인 마일스톤입니다.

- 진행률이 퍼센트로 표시됩니다
- 기한과 D-day가 표시됩니다
- 클릭하면 상세 페이지로 이동합니다
        `,
      },
    },
  },
};

export const MilestoneClosed: Story = {
  name: "1-2. MilestoneRow - 완료됨",
  render: () => (
    <MilestoneRow
      milestone={mockMilestoneClosed}
      onClick={() => console.log("Navigate to milestone")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
완료된 마일스톤입니다.

- 체크 아이콘과 "완료됨" 뱃지가 표시됩니다
- 제목에 취소선이 적용됩니다
- 진행률 바가 초록색으로 표시됩니다
        `,
      },
    },
  },
};

export const MilestoneOverdue: Story = {
  name: "1-3. MilestoneRow - 기한 초과",
  render: () => (
    <MilestoneRow
      milestone={mockMilestoneOverdue}
      onClick={() => console.log("Navigate to milestone")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
기한이 초과된 마일스톤입니다.

- 기한과 경과 일수가 빨간색으로 표시됩니다
- 긴급하게 처리해야 할 항목임을 시각적으로 강조합니다
        `,
      },
    },
  },
};

export const MilestoneNoDate: Story = {
  name: "1-4. MilestoneRow - 기한 없음",
  render: () => (
    <MilestoneRow
      milestone={mockMilestoneNoDate}
      onClick={() => console.log("Navigate to milestone")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
기한이 설정되지 않은 마일스톤입니다.

- 기한 관련 정보가 표시되지 않습니다
- 백로그나 우선순위가 낮은 항목에 적합합니다
        `,
      },
    },
  },
};

export const MilestoneCompact: Story = {
  name: "1-5. MilestoneRow - 컴팩트",
  render: () => (
    <div className="space-y-2 max-w-sm">
      <MilestoneRow
        milestone={mockMilestoneOpen}
        compact
        onClick={() => console.log("Click")}
      />
      <MilestoneRow
        milestone={mockMilestoneClosed}
        compact
        onClick={() => console.log("Click")}
      />
      <MilestoneRow
        milestone={mockMilestoneOverdue}
        compact
        onClick={() => console.log("Click")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
컴팩트 모드의 마일스톤 Row입니다.

- 사이드바나 위젯에 적합한 작은 사이즈
- 핵심 정보만 표시 (제목, 진행률, D-day)
- 설명과 상세 통계는 생략됩니다
        `,
      },
    },
  },
};

export const MilestoneList: Story = {
  name: "1-6. MilestoneRow - 목록 예시",
  render: () => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
        🎯 마일스톤
      </h2>
      <MilestoneRow milestone={mockMilestoneOverdue} onClick={() => {}} />
      <MilestoneRow milestone={mockMilestoneOpen} onClick={() => {}} />
      <MilestoneRow milestone={mockMilestoneNoDate} onClick={() => {}} />
      <MilestoneRow milestone={mockMilestoneClosed} onClick={() => {}} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
마일스톤 목록 페이지에서 보이는 형태입니다.

보통 다음 순서로 정렬됩니다:
1. 기한 초과된 항목 (긴급)
2. 진행 중인 항목
3. 기한 없는 항목
4. 완료된 항목
        `,
      },
    },
  },
};

// ========== TaskRow Stories ==========

export const TaskTodo: Story = {
  name: "2-1. TaskRow - 할 일",
  render: () => (
    <TaskRow
      task={mockTaskTodo}
      onToggle={() => console.log("Toggle")}
      onEdit={() => console.log("Edit")}
      onDelete={() => console.log("Delete")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
완료되지 않은 태스크입니다.

- 빈 원형 체크박스 표시
- 제목, 설명, 기한이 모두 표시됨
- hover 시 수정/삭제 버튼 표시
        `,
      },
    },
  },
};

export const TaskTodoOverdue: Story = {
  name: "2-2. TaskRow - 기한 초과",
  render: () => (
    <TaskRow
      task={mockTaskTodoOverdue}
      onToggle={() => console.log("Toggle")}
      onEdit={() => console.log("Edit")}
      onDelete={() => console.log("Delete")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
기한이 초과된 태스크입니다.

- 기한과 경과 일수가 빨간색으로 강조됩니다
- 긴급하게 처리해야 함을 시각적으로 알립니다
        `,
      },
    },
  },
};

export const TaskDone: Story = {
  name: "2-3. TaskRow - 완료됨",
  render: () => (
    <TaskRow
      task={mockTaskDone}
      onToggle={() => console.log("Toggle")}
      onEdit={() => console.log("Edit")}
      onDelete={() => console.log("Delete")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
완료된 태스크입니다.

- 녹색 체크 아이콘 표시
- 제목과 설명에 취소선 적용
- 완료 시간 표시
- 전체적으로 투명도가 낮아짐
        `,
      },
    },
  },
};

export const TaskSimple: Story = {
  name: "2-4. TaskRow - 간단한 태스크",
  render: () => (
    <TaskRow
      task={mockTaskSimple}
      onToggle={() => console.log("Toggle")}
      onEdit={() => console.log("Edit")}
      onDelete={() => console.log("Delete")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
설명과 기한이 없는 간단한 태스크입니다.

- 제목만 표시됩니다
- 빠르게 추가하는 태스크에 적합합니다
        `,
      },
    },
  },
};

export const TaskCompact: Story = {
  name: "2-5. TaskRow - 컴팩트",
  render: () => (
    <div className="space-y-1 max-w-md border border-surface-200 dark:border-surface-700 rounded-lg p-2">
      <TaskRow task={mockTaskSimple} compact onToggle={() => {}} />
      <TaskRow task={mockTaskTodo} compact onToggle={() => {}} />
      <TaskRow task={mockTaskTodoOverdue} compact onToggle={() => {}} />
      <TaskRow task={mockTaskDone} compact onToggle={() => {}} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
컴팩트 모드의 태스크 Row입니다.

- 체크리스트 형태의 간단한 UI
- 제목과 D-day만 표시
- 설명, 완료 시간, 액션 버튼 생략
- 빠른 확인에 적합
        `,
      },
    },
  },
};

export const TaskNoActions: Story = {
  name: "2-6. TaskRow - 액션 버튼 없음",
  render: () => (
    <TaskRow
      task={mockTaskTodo}
      showActions={false}
      onClick={() => console.log("Click")}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
수정/삭제 버튼이 없는 태스크입니다.

- 읽기 전용 모드에 적합
- 클릭 핸들러만 제공 가능
        `,
      },
    },
  },
};

export const TaskList: Story = {
  name: "2-7. TaskRow - 목록 예시",
  render: () => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
        📝 태스크 (4)
      </h2>
      
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
          할 일 (3)
        </h3>
        <TaskRow task={mockTaskTodoOverdue} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
        <TaskRow task={mockTaskTodo} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
        <TaskRow task={mockTaskSimple} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
      </div>

      <div className="space-y-3 mt-6">
        <h3 className="text-sm font-medium text-surface-500 dark:text-surface-400">
          완료됨 (1)
        </h3>
        <TaskRow task={mockTaskDone} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
마일스톤 상세 페이지에서 보이는 태스크 목록입니다.

- 할 일과 완료됨으로 구분
- 기한 초과 항목이 상단에 표시
- 각 태스크에 수정/삭제 액션 제공
        `,
      },
    },
  },
};

// ========== 통합 예시 ==========

export const MilestoneDetailExample: Story = {
  name: "3. 마일스톤 상세 페이지 예시",
  render: () => (
    <div className="space-y-6">
      {/* Milestone Header */}
      <div className="flex items-start gap-4 p-4 border border-surface-200 dark:border-surface-700 rounded-xl">
        <div className="flex flex-col items-center justify-center min-w-[60px] py-3 rounded-xl bg-surface-100 text-surface-500 dark:bg-surface-800">
          <span className="text-lg font-bold">57%</span>
          <span className="text-[10px]">진행률</span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-1">
            {mockMilestoneOpen.title}
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-2">
            {mockMilestoneOpen.description}
          </p>
          <div className="text-sm text-surface-500">
            4개 완료 • 3개 남음 • 2024년 12월 15일 (D-7)
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
            태스크 (7)
          </h2>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-surface-500">할 일 (3)</h3>
          <TaskRow task={mockTaskTodoOverdue} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
          <TaskRow task={mockTaskTodo} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
          <TaskRow task={mockTaskTodoNoDate} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
        </div>

        <div className="space-y-3 mt-4">
          <h3 className="text-sm font-medium text-surface-500">완료됨 (4)</h3>
          <TaskRow task={mockTaskDone} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
          <TaskRow task={{ ...mockTaskDone, id: "t6", title: "프로젝트 초기 설정" }} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
마일스톤 상세 페이지의 전체적인 구성 예시입니다.

**구성 요소:**
1. 마일스톤 헤더 - 진행률, 제목, 설명, 기한 정보
2. 태스크 목록 - 할 일/완료됨으로 구분된 태스크 리스트

**사용자 플로우:**
1. 마일스톤 목록에서 Row 클릭 → 상세 페이지 이동
2. 태스크 추가 버튼으로 새 태스크 생성
3. 체크박스로 태스크 완료 처리
4. hover 시 수정/삭제 가능
        `,
      },
    },
  },
};

