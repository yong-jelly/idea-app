import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ProfileEditModal } from "./ProfileEditModal";
import { Button } from "@/shared/ui";

const meta: Meta<typeof ProfileEditModal> = {
  title: "Pages/Profile/ProfileEditModal",
  component: ProfileEditModal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
프로필 수정 모달 컴포넌트입니다.

## 특징

### 1. 반응형 레이아웃
- **모바일**: 전체 화면 (풀스크린)
- **데스크톱**: 중앙 정렬 모달 (max-w-xl, rounded-xl)

### 2. 헤더 구조
- 좌측: 뒤로가기 버튼 (ArrowLeft) + 제목
- 우측: 저장 버튼 (rounded-full)
- 높이: h-14, 하단 border

### 3. 콘텐츠 구조
- 스크롤 가능한 영역 (flex-1 overflow-y-auto)
- 패딩: p-4 (모바일) / p-6 (데스크톱)
- 섹션 간격: space-y-6

### 4. 폼 필드 패턴
- 라벨: text-sm font-medium
- 필수 표시: <span className="text-red-500">*</span>
- 글자 수 카운터: text-xs text-surface-500 text-right
- 아이콘 입력 필드: pl-10 + 좌측 아이콘

### 5. 인터랙션
- ESC 키로 닫기
- 배경 클릭으로 닫기 (데스크톱만)
- 저장 시 로딩 상태

## 사용 예시

\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>
  프로필 수정
</Button>

<ProfileEditModal
  open={isOpen}
  onOpenChange={setIsOpen}
/>
\`\`\`

## CSS 클래스 패턴

### 모달 컨테이너
\`\`\`
fixed inset-0 z-50
md:flex md:items-center md:justify-center md:p-4
\`\`\`

### 모달 박스
\`\`\`
h-full w-full 
md:h-auto md:max-h-[90vh] md:w-full md:max-w-xl md:rounded-xl
bg-white dark:bg-surface-900
md:border md:border-surface-200 md:dark:border-surface-800
md:shadow-xl
flex flex-col overflow-hidden
\`\`\`

### 헤더
\`\`\`
shrink-0 h-14
flex items-center justify-between px-4
border-b border-surface-100 dark:border-surface-800
bg-white dark:bg-surface-900
\`\`\`

### 콘텐츠
\`\`\`
flex-1 overflow-y-auto
p-4 md:p-6 space-y-6
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "모달 열림/닫힘 상태",
    },
    onOpenChange: {
      action: "onOpenChange",
      description: "모달 상태 변경 콜백",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileEditModal>;

// 인터랙티브 데모를 위한 래퍼
function ProfileEditModalDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>
        프로필 수정 열기
      </Button>
      <ProfileEditModal open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}

/** 기본 상태 - 버튼 클릭으로 열기 */
export const Default: Story = {
  render: () => <ProfileEditModalDemo />,
};

/** 열린 상태 */
export const Open: Story = {
  args: {
    open: true,
  },
};

/** 모바일 뷰 */
export const Mobile: Story = {
  render: () => <ProfileEditModalDemo />,
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

/** 태블릿 뷰 */
export const Tablet: Story = {
  render: () => <ProfileEditModalDemo />,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

