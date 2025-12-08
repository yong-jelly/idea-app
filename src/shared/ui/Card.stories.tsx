import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "Shared/UI/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: "컨텐츠를 그룹화하는 카드 컴포넌트입니다.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "interactive", "bordered"],
      description: "카드의 시각적 스타일",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>프로젝트 제목</CardTitle>
        <CardDescription>프로젝트에 대한 간단한 설명입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">카드 본문 내용이 여기에 들어갑니다.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">자세히 보기</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <Card {...args} variant="interactive" className="w-80">
      <CardHeader>
        <CardTitle>클릭 가능한 카드</CardTitle>
        <CardDescription>마우스를 올리면 그림자가 커집니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">인터랙티브 카드는 클릭 가능한 영역에 사용됩니다.</p>
      </CardContent>
    </Card>
  ),
};

export const Bordered: Story = {
  render: (args) => (
    <Card {...args} variant="bordered" className="w-80">
      <CardHeader>
        <CardTitle>테두리 카드</CardTitle>
        <CardDescription>그림자 대신 테두리를 사용합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">플랫한 디자인에 적합합니다.</p>
      </CardContent>
    </Card>
  ),
};

