# Storybook 설정 및 사용 가이드

이 문서는 Storybook 설정 및 컴포넌트 스토리 작성 가이드를 제공합니다.

## 📋 목차

1. [Storybook 설치](#1-storybook-설치)
2. [설정 파일](#2-설정-파일)
3. [스토리 작성](#3-스토리-작성)
4. [애드온 사용](#4-애드온-사용)
5. [모범 사례](#5-모범-사례)

## 1. Storybook 설치

### 1.1 패키지 설치

```bash
bun add -d storybook@^8.4.7 @storybook/react@^8.4.7 @storybook/react-vite@^8.4.7
bun add -d @storybook/addon-essentials@^8.4.7 @storybook/addon-interactions@^8.4.7
bun add -d @storybook/addon-links@^8.4.7 @storybook/blocks@^8.4.7 @storybook/test@^8.4.7
bun add -d @chromatic-com/storybook@^3.2.3
```

### 1.2 초기화

```bash
bunx storybook@latest init
```

또는 수동으로 설정 파일을 생성할 수 있습니다.

## 2. 설정 파일

### 2.1 .storybook/main.ts

```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
```

### 2.2 .storybook/preview.ts

```typescript
import type { Preview } from "@storybook/react";
import "../src/index.css"; // Tailwind CSS 스타일 임포트

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#0a0a0a",
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

### 2.3 package.json 스크립트

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 3. 스토리 작성

### 3.1 기본 스토리 구조

```typescript
// src/shared/ui/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Shared/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    children: "버튼",
  },
};

// Primary 변형
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary 버튼",
  },
};

// Secondary 변형
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary 버튼",
  },
};

// 크기 변형
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small 버튼",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large 버튼",
  },
};

// 비활성화 상태
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled 버튼",
  },
};
```

### 3.2 복잡한 컴포넌트 스토리

```typescript
// src/entities/user/ui/UserAvatar.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { UserAvatar } from "./UserAvatar";

const meta = {
  title: "Entities/User/UserAvatar",
  component: UserAvatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
  },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    username: "johndoe",
    displayName: "John Doe",
    avatar: "https://via.placeholder.com/150",
    size: "md",
  },
};

export const WithoutAvatar: Story = {
  args: {
    username: "johndoe",
    displayName: "John Doe",
    size: "md",
  },
};

export const Small: Story = {
  args: {
    username: "johndoe",
    displayName: "John Doe",
    avatar: "https://via.placeholder.com/150",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    username: "johndoe",
    displayName: "John Doe",
    avatar: "https://via.placeholder.com/150",
    size: "lg",
  },
};
```

### 3.3 인터랙션 테스트

```typescript
// src/shared/ui/Button.stories.tsx
import { expect, userEvent, within } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Shared/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInteraction: Story = {
  args: {
    children: "클릭하세요",
    onClick: () => alert("클릭됨!"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    
    await userEvent.click(button);
    
    // 여기서 추가적인 검증을 수행할 수 있습니다
    await expect(button).toBeInTheDocument();
  },
};
```

### 3.4 데코레이터 사용

```typescript
// src/widgets/header/Header.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";
import { Providers } from "@/app/providers";

const meta = {
  title: "Widgets/Header",
  component: Header,
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

## 4. 애드온 사용

### 4.1 Controls 애드온

Controls 애드온은 자동으로 props를 컨트롤로 변환합니다:

```typescript
const meta = {
  title: "Shared/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
      description: "버튼 스타일 변형",
    },
    disabled: {
      control: "boolean",
      description: "비활성화 상태",
    },
  },
} satisfies Meta<typeof Button>;
```

### 4.2 Actions 애드온

이벤트 핸들러를 자동으로 로깅합니다:

```typescript
export const WithActions: Story = {
  args: {
    onClick: () => console.log("클릭됨"),
    onMouseEnter: () => console.log("마우스 진입"),
  },
};
```

### 4.3 Viewport 애드온

다양한 화면 크기에서 테스트:

```typescript
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
```

## 5. 모범 사례

### 5.1 스토리 파일 위치

스토리 파일은 컴포넌트와 같은 디렉토리에 위치하거나 `*.stories.tsx` 확장자를 사용합니다:

```
src/
├── shared/
│   └── ui/
│       ├── Button.tsx
│       └── Button.stories.tsx
└── entities/
    └── user/
        └── ui/
            ├── UserAvatar.tsx
            └── UserAvatar.stories.tsx
```

### 5.2 스토리 명명 규칙

- **Default**: 기본 상태
- **With[Feature]**: 특정 기능이 있는 상태
- **[Variant]**: 변형 상태
- **[State]**: 특정 상태 (예: Loading, Error)

```typescript
export const Default: Story = { /* ... */ };
export const WithIcon: Story = { /* ... */ };
export const Primary: Story = { /* ... */ };
export const Loading: Story = { /* ... */ };
```

### 5.3 문서화

```typescript
const meta = {
  title: "Shared/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "재사용 가능한 버튼 컴포넌트입니다. 다양한 변형과 크기를 지원합니다.",
      },
    },
  },
  argTypes: {
    variant: {
      description: "버튼의 스타일 변형",
      table: {
        type: { summary: "primary | secondary | danger" },
        defaultValue: { summary: "primary" },
      },
    },
  },
} satisfies Meta<typeof Button>;
```

### 5.4 Mock 데이터

```typescript
// src/shared/ui/Button.stories.tsx
import { mockUser } from "@/shared/lib/mocks";

export const WithUser: Story = {
  args: {
    user: mockUser,
  },
};
```

### 5.5 상태 관리 스토리

Zustand 스토어를 사용하는 컴포넌트의 경우:

```typescript
import { useUserStore } from "@/entities/user";

export const WithStore: Story = {
  decorators: [
    (Story) => {
      // 스토어 초기화
      useUserStore.setState({ user: mockUser });
      return <Story />;
    },
  ],
};
```

## 6. 실행 및 빌드

### 6.1 개발 서버 실행

```bash
bun run storybook
```

`http://localhost:6006`에서 Storybook을 확인할 수 있습니다.

### 6.2 정적 빌드

```bash
bun run build-storybook
```

빌드된 파일은 `storybook-static` 디렉토리에 생성됩니다.

## 📚 참고 자료

- [Storybook 공식 문서](https://storybook.js.org/docs)
- [Storybook React 가이드](https://storybook.js.org/docs/react/get-started/introduction)
- [컴포넌트 예시](../shared/ui/)

