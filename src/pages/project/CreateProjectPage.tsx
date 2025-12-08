import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Upload, Plus, X, Gift, Target, Check } from "lucide-react";
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle, Badge, Select, Progress, Separator } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { CATEGORY_INFO, type ProjectCategory } from "@/entities/project";

const STEPS = [
  { id: 1, title: "기본 정보", description: "프로젝트의 기본 정보를 입력하세요" },
  { id: 2, title: "상세 설명", description: "프로젝트에 대한 자세한 설명을 작성하세요" },
  { id: 3, title: "마일스톤", description: "개발 단계별 목표를 설정하세요" },
  { id: 4, title: "펀딩 설정", description: "펀딩 목표와 리워드를 설정하세요" },
  { id: 5, title: "미리보기", description: "프로젝트 페이지를 미리 확인하세요" },
];

const TECH_STACKS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular",
  "Python", "Django", "Flask", "FastAPI", "Node.js", "Express",
  "Java", "Spring", "Kotlin", "Swift", "Flutter", "React Native",
  "Unity", "Unreal Engine", "C#", "C++", "Go", "Rust",
  "TensorFlow", "PyTorch", "OpenAI", "Docker", "Kubernetes",
];

interface ProjectFormData {
  title: string;
  shortDescription: string;
  category: ProjectCategory | "";
  techStack: string[];
  repositoryUrl: string;
  demoUrl: string;
  fullDescription: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  uniqueFeatures: string[];
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    deliverables: string[];
  }>;
  fundingGoal: number;
  fundingDuration: number;
  rewards: Array<{
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    quantity: number;
    type: "coupon" | "access" | "digital" | "physical";
  }>;
  incentives: {
    vote: number;
    comment: number;
    share: number;
    externalPromo: number;
    review: number;
  };
}

export function CreateProjectPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    shortDescription: "",
    category: "",
    techStack: [],
    repositoryUrl: "",
    demoUrl: "",
    fullDescription: "",
    problemStatement: "",
    solution: "",
    targetAudience: "",
    uniqueFeatures: [],
    milestones: [],
    fundingGoal: 100000,
    fundingDuration: 30,
    rewards: [],
    incentives: {
      vote: 5,
      comment: 10,
      share: 15,
      externalPromo: 20,
      review: 25,
    },
  });

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now().toString(),
      title: "",
      description: "",
      targetDate: "",
      deliverables: [],
    };
    updateField("milestones", [...formData.milestones, newMilestone]);
  };

  const addReward = () => {
    const newReward = {
      id: Date.now().toString(),
      title: "",
      description: "",
      pointsRequired: 100,
      quantity: 10,
      type: "digital" as const,
    };
    updateField("rewards", [...formData.rewards, newReward]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">프로젝트 제목 *</label>
              <Input
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="예: AI 기반 코드 리뷰 도구"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">간단한 설명 *</label>
              <Textarea
                value={formData.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
                placeholder="프로젝트를 한 줄로 설명해주세요 (최대 100자)"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-slate-500">
                {formData.shortDescription.length}/100
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">카테고리 *</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {Object.entries(CATEGORY_INFO).map(([id, info]) => (
                  <Card
                    key={id}
                    variant={formData.category === id ? "bordered" : "default"}
                    className={cn(
                      "cursor-pointer p-4 text-center transition-all",
                      formData.category === id && "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    )}
                    onClick={() => updateField("category", id as ProjectCategory)}
                  >
                    <div className="text-2xl">{info.icon}</div>
                    <div className="mt-1 text-sm font-medium">{info.name}</div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">기술 스택 *</label>
              <Select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !formData.techStack.includes(value)) {
                    updateField("techStack", [...formData.techStack, value]);
                  }
                }}
              >
                <option value="">기술 스택 선택</option>
                {TECH_STACKS.filter((t) => !formData.techStack.includes(t)).map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </Select>
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <button
                      onClick={() =>
                        updateField(
                          "techStack",
                          formData.techStack.filter((t) => t !== tech)
                        )
                      }
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">저장소 URL</label>
                <Input
                  value={formData.repositoryUrl}
                  onChange={(e) => updateField("repositoryUrl", e.target.value)}
                  placeholder="https://github.com/username/repo"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">데모 URL</label>
                <Input
                  value={formData.demoUrl}
                  onChange={(e) => updateField("demoUrl", e.target.value)}
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">프로젝트 상세 설명 *</label>
              <Textarea
                value={formData.fullDescription}
                onChange={(e) => updateField("fullDescription", e.target.value)}
                placeholder="프로젝트에 대한 자세한 설명을 작성하세요..."
                className="min-h-32"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">해결하고자 하는 문제 *</label>
              <Textarea
                value={formData.problemStatement}
                onChange={(e) => updateField("problemStatement", e.target.value)}
                placeholder="어떤 문제를 해결하려고 하나요?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">솔루션 *</label>
              <Textarea
                value={formData.solution}
                onChange={(e) => updateField("solution", e.target.value)}
                placeholder="어떻게 문제를 해결할 계획인가요?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">타겟 사용자 *</label>
              <Textarea
                value={formData.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                placeholder="누가 이 프로젝트를 사용할까요?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">스크린샷 및 미디어</label>
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
                <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <p className="text-slate-500">이미지를 드래그하거나 클릭하여 업로드</p>
                <Button variant="outline" className="mt-4">
                  파일 선택
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">개발 마일스톤</h3>
                <p className="text-sm text-slate-500">프로젝트의 단계별 목표를 설정하세요</p>
              </div>
              <Button onClick={addMilestone}>
                <Plus className="mr-1 h-4 w-4" />
                마일스톤 추가
              </Button>
            </div>

            <div className="space-y-4">
              {formData.milestones.length > 0 ? (
                formData.milestones.map((milestone, index) => (
                  <Card key={milestone.id}>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="text-base">마일스톤 {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateField(
                            "milestones",
                            formData.milestones.filter((m) => m.id !== milestone.id)
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="마일스톤 제목" />
                      <Textarea placeholder="이 마일스톤에서 달성할 목표를 설명하세요" />
                      <Input type="date" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed p-8 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-slate-500">아직 마일스톤이 없습니다</p>
                  <Button onClick={addMilestone} variant="outline" className="mt-4">
                    첫 번째 마일스톤 추가
                  </Button>
                </Card>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">펀딩 목표 설정</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">목표 금액 (원) *</label>
                  <Input
                    type="number"
                    value={formData.fundingGoal}
                    onChange={(e) => updateField("fundingGoal", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">펀딩 기간 (일) *</label>
                  <Input
                    type="number"
                    value={formData.fundingDuration}
                    onChange={(e) => updateField("fundingDuration", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold">참여 인센티브 설정</h3>
              <p className="text-sm text-slate-500">사용자들의 다양한 참여 활동에 대한 포인트를 설정하세요</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {Object.entries(formData.incentives).map(([key, value]) => (
                  <div key={key}>
                    <label className="mb-2 block text-sm font-medium capitalize">
                      {key === "vote" ? "투표 참여" :
                       key === "comment" ? "댓글 작성" :
                       key === "share" ? "소셜 공유" :
                       key === "externalPromo" ? "외부 홍보" :
                       "리뷰 작성"}
                    </label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateField("incentives", {
                          ...formData.incentives,
                          [key]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">리워드 설정</h3>
                  <p className="text-sm text-slate-500">포인트로 교환할 수 있는 리워드를 설정하세요</p>
                </div>
                <Button onClick={addReward}>
                  <Gift className="mr-1 h-4 w-4" />
                  리워드 추가
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {formData.rewards.length > 0 ? (
                  formData.rewards.map((reward) => (
                    <Card key={reward.id}>
                      <CardContent className="space-y-4 p-4">
                        <div className="flex justify-between">
                          <span className="font-medium">리워드 설정</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateField(
                                "rewards",
                                formData.rewards.filter((r) => r.id !== reward.id)
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Input placeholder="리워드 제목" />
                          <Select>
                            <option value="coupon">할인 쿠폰</option>
                            <option value="access">서비스 접근권</option>
                            <option value="digital">디지털 굿즈</option>
                            <option value="physical">실물 굿즈</option>
                          </Select>
                          <Input type="number" placeholder="필요 포인트" />
                          <Input type="number" placeholder="수량" />
                        </div>
                        <Textarea placeholder="리워드 설명" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed p-8 text-center">
                    <Gift className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                    <p className="text-slate-500">아직 리워드가 없습니다</p>
                    <Button onClick={addReward} variant="outline" className="mt-4">
                      첫 번째 리워드 추가
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold">프로젝트 미리보기</h3>
              <p className="mt-1 text-slate-500">프로젝트 페이지가 어떻게 보일지 확인하고 최종 제출하세요</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{formData.title || "프로젝트 제목"}</h2>
                    <p className="mt-1 text-slate-500">{formData.shortDescription || "프로젝트 설명"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.category && (
                        <Badge>
                          {CATEGORY_INFO[formData.category]?.icon} {CATEGORY_INFO[formData.category]?.name}
                        </Badge>
                      )}
                      {formData.techStack.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">₩{formData.fundingGoal.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">목표 금액</div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-semibold">마일스톤 ({formData.milestones.length}개)</h4>
                  <p className="text-sm text-slate-500">리워드 ({formData.rewards.length}개)</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="terms" className="rounded" />
              <label htmlFor="terms" className="text-sm">
                이용약관 및 개인정보처리방침에 동의합니다
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          홈으로
        </Link>
        <h1 className="text-3xl font-bold">프로젝트 등록</h1>
        <p className="mt-1 text-slate-500">단계별 가이드를 따라 프로젝트를 등록하세요</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  currentStep >= step.id
                    ? "bg-primary-500 text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700"
                )}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 md:w-24",
                    currentStep > step.id ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / STEPS.length) * 100} />
        <div className="mt-2">
          <h2 className="font-semibold">{STEPS[currentStep - 1].title}</h2>
          <p className="text-sm text-slate-500">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Content */}
      <Card className="mb-8">
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          이전
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}>
            다음
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-gradient-to-r from-green-500 to-primary-500">
            프로젝트 등록
            <Check className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

