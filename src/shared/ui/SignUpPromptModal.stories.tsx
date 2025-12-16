import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SignUpPromptModal } from "./SignUpPromptModal";
import { Button } from "./Button";

const meta: Meta<typeof SignUpPromptModal> = {
  title: "Shared/UI/SignUpPromptModal",
  component: SignUpPromptModal,
  parameters: {
    docs: {
      description: {
        component:
          "비회원 사용자에게 회원 가입을 유도하는 모달 컴포넌트입니다. 트위터(X) 스타일의 모던한 디자인으로 구글 OAuth 로그인과 이메일 가입을 제공합니다. 좋아요, 북마크, 리포스트 등 회원 전용 기능을 사용하려고 할 때 표시됩니다.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "모달 열림 상태",
    },
    onGoogleSignIn: {
      action: "googleSignIn",
      description: "구글 OAuth 로그인 핸들러",
    },
    onEmailSignIn: {
      action: "emailSignIn",
      description: "이메일 로그인 핸들러",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignUpPromptModal>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <SignUpPromptModal {...args} open={open} onOpenChange={setOpen} />
      </div>
    );
  },
  args: {
    onGoogleSignIn: () => {
      console.log("구글 로그인 클릭");
    },
    onEmailSignIn: (email) => {
      console.log("이메일 로그인:", email);
    },
  },
};

export const Opened: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onGoogleSignIn: () => {
      console.log("구글 로그인 클릭");
    },
    onEmailSignIn: (email) => {
      console.log("이메일 로그인:", email);
    },
  },
};

