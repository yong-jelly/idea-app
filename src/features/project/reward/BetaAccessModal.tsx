import { useState } from "react";
import { X, Smartphone, Monitor, Globe, Zap, ExternalLink, Check, AlertCircle, Apple, Play } from "lucide-react";
import { createPortal } from "react-dom";
import { Button, Badge, Card, CardContent, Input, Textarea } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import type { Reward, RewardPlatform } from "@/entities/project";

// 플랫폼 정보
const PLATFORM_INFO: Record<RewardPlatform, { 
  label: string; 
  icon: typeof Smartphone; 
  color: string;
  description: string;
  instructions: string[];
}> = {
  ios: { 
    label: "iOS", 
    icon: Smartphone, 
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
    description: "TestFlight를 통해 iOS 앱을 테스트합니다",
    instructions: [
      "App Store에서 TestFlight 앱을 설치하세요",
      "아래 초대 링크를 클릭하세요",
      "TestFlight에서 앱을 설치하고 테스트하세요",
    ]
  },
  android: { 
    label: "Android", 
    icon: Smartphone, 
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
    description: "Play Store 내부 테스트를 통해 Android 앱을 테스트합니다",
    instructions: [
      "아래 초대 링크를 클릭하세요",
      "Google 계정으로 테스트 참여에 동의하세요",
      "Play Store에서 앱을 설치하세요",
    ]
  },
  desktop: { 
    label: "Desktop", 
    icon: Monitor, 
    color: "text-violet-500 bg-violet-50 dark:bg-violet-900/30",
    description: "데스크톱 베타 버전을 다운로드하여 테스트합니다",
    instructions: [
      "아래 링크에서 베타 버전을 다운로드하세요",
      "설치 후 제공된 코드로 활성화하세요",
      "테스트 후 피드백을 남겨주세요",
    ]
  },
  web: { 
    label: "Web", 
    icon: Globe, 
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
    description: "웹 베타 버전에 접근하여 테스트합니다",
    instructions: [
      "아래 링크를 클릭하여 베타 사이트에 접속하세요",
      "제공된 초대 코드로 로그인하세요",
      "새로운 기능을 테스트하고 피드백을 남겨주세요",
    ]
  },
};

interface BetaAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward;
  userPoints: number;
  onApply: (reward: Reward, email: string, deviceInfo?: string) => Promise<{ success: boolean; accessUrl?: string; inviteCode?: string }>;
}

export function BetaAccessModal({ open, onOpenChange, reward, userPoints, onApply }: BetaAccessModalProps) {
  const [step, setStep] = useState<"info" | "form" | "success">("info");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [result, setResult] = useState<{ accessUrl?: string; inviteCode?: string } | null>(null);
  const [agreed, setAgreed] = useState(false);

  const platform = reward.platform || "web";
  const platformInfo = PLATFORM_INFO[platform];
  const PlatformIcon = platformInfo.icon;
  const canApply = userPoints >= reward.pointsRequired;

  const handleApply = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      const response = await onApply(reward, email, deviceInfo);
      if (response.success) {
        setResult(response);
        setStep("success");
      }
    } catch (error) {
      console.error("Failed to apply for beta:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("info");
    setEmail("");
    setDeviceInfo("");
    setResult(null);
    setAgreed(false);
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px] animate-fade-in"
        onClick={handleClose}
      />
      <div className="relative z-50 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              platformInfo.color
            )}>
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                베타 테스트 참여
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge className={platformInfo.color}>
                  <PlatformIcon className="h-3 w-3 mr-1" />
                  {platformInfo.label}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        {/* Step: Info */}
        {step === "info" && (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  {reward.title}
                </h4>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  {reward.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    참여 방법
                  </p>
                  <ol className="space-y-2">
                    {platformInfo.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium shrink-0">
                          {idx + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">베타 테스트 주의사항</p>
                  <ul className="text-amber-600 dark:text-amber-400 text-xs space-y-0.5">
                    <li>• 베타 버전은 불안정할 수 있습니다</li>
                    <li>• 발견한 버그는 피드백으로 제보해주세요</li>
                    <li>• 테스트 내용을 외부에 공유하지 마세요</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
              <span className="text-surface-600 dark:text-surface-400">필요 포인트</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {formatNumber(reward.pointsRequired)} P
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                취소
              </Button>
              <Button 
                className="flex-1" 
                disabled={!canApply}
                onClick={() => setStep("form")}
              >
                {canApply ? "신청하기" : "포인트 부족"}
              </Button>
            </div>
          </>
        )}

        {/* Step: Form */}
        {step === "form" && (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  이메일 주소 *
                </label>
                <Input
                  type="email"
                  placeholder={platform === "ios" ? "Apple ID 이메일" : "이메일 주소"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-surface-500 mt-1">
                  {platform === "ios" 
                    ? "TestFlight 초대를 받을 Apple ID 이메일을 입력하세요"
                    : "베타 테스트 초대 및 안내를 받을 이메일을 입력하세요"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  기기 정보 (선택)
                </label>
                <Textarea
                  placeholder={`예: ${platform === "ios" ? "iPhone 15 Pro, iOS 17.2" : platform === "android" ? "Galaxy S24, Android 14" : "Windows 11, Chrome 120"}`}
                  value={deviceInfo}
                  onChange={(e) => setDeviceInfo(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-surface-500 mt-1">
                  테스트에 사용할 기기 정보를 입력하면 더 나은 지원을 받을 수 있습니다
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  베타 테스트 약관에 동의합니다. 테스트 중 발견한 내용을 외부에 공개하지 않겠습니다.
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>
                이전
              </Button>
              <Button 
                className="flex-1" 
                disabled={!email || !agreed || isLoading}
                onClick={handleApply}
              >
                {isLoading ? "처리 중..." : "신청 완료"}
              </Button>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && result && (
          <>
            <div className="text-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-3">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
                신청 완료!
              </h4>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                베타 테스트 참여 신청이 완료되었습니다
              </p>
            </div>

            {result.accessUrl && (
              <Card className="mb-4 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">
                    테스트 참여 링크
                  </p>
                  <a
                    href={result.accessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    지금 참여하기
                  </a>
                </CardContent>
              </Card>
            )}

            {result.inviteCode && (
              <Card className="mb-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                    초대 코드
                  </p>
                  <code className="block text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-surface-800 px-4 py-2 rounded-lg text-center">
                    {result.inviteCode}
                  </code>
                </CardContent>
              </Card>
            )}

            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 mb-4">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                입력하신 이메일({email})로 상세 안내가 발송됩니다.
              </p>
            </div>

            <Button className="w-full" onClick={handleClose}>
              확인
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

