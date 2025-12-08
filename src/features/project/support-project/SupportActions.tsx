import { useState } from "react";
import { Heart, MessageCircle, Share2, ExternalLink, Star, CheckCircle, Coins } from "lucide-react";
import { Card, CardContent, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Textarea, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { ProjectIncentives } from "@/entities/project";

interface SupportAction {
  id: string;
  type: "vote" | "comment" | "share" | "external" | "review";
  title: string;
  description: string;
  points: number;
  icon: typeof Heart;
  completed: boolean;
  verificationRequired: boolean;
}

interface SupportActionsProps {
  projectId: string;
  incentives: ProjectIncentives;
  onComplete?: (actionId: string, points: number) => void;
}

export function SupportActions({ projectId, incentives, onComplete }: SupportActionsProps) {
  const [actions, setActions] = useState<SupportAction[]>([
    {
      id: "vote",
      type: "vote",
      title: "프로젝트 좋아요",
      description: "이 프로젝트가 마음에 든다면 좋아요를 눌러주세요",
      points: incentives.vote,
      icon: Heart,
      completed: false,
      verificationRequired: false,
    },
    {
      id: "comment",
      type: "comment",
      title: "의미있는 댓글 작성",
      description: "프로젝트에 대한 피드백이나 응원 메시지를 남겨주세요",
      points: incentives.comment,
      icon: MessageCircle,
      completed: false,
      verificationRequired: false,
    },
    {
      id: "share",
      type: "share",
      title: "소셜 미디어 공유",
      description: "SNS에 프로젝트를 공유하고 스크린샷으로 증빙해주세요",
      points: incentives.share,
      icon: Share2,
      completed: false,
      verificationRequired: true,
    },
    {
      id: "external",
      type: "external",
      title: "외부 플랫폼 홍보",
      description: "유튜브, 블로그 등에서 프로젝트를 소개하고 링크를 제출해주세요",
      points: incentives.externalPromo,
      icon: ExternalLink,
      completed: false,
      verificationRequired: true,
    },
    {
      id: "review",
      type: "review",
      title: "상세 리뷰 작성",
      description: "프로젝트에 대한 상세한 리뷰를 작성해주세요",
      points: incentives.review,
      icon: Star,
      completed: false,
      verificationRequired: false,
    },
  ]);

  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [externalLink, setExternalLink] = useState("");

  const completeAction = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (!action || action.completed) return;

    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, completed: true } : a))
    );
    onComplete?.(actionId, action.points);
    setActiveDialog(null);
  };

  const getDialogContent = (action: SupportAction) => {
    switch (action.type) {
      case "vote":
        return (
          <div className="text-center py-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              onClick={() => completeAction(action.id)}
            >
              <Heart className="mr-2 h-5 w-5" />
              좋아요
            </Button>
          </div>
        );

      case "comment":
        return (
          <div className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="프로젝트에 대한 의견을 남겨주세요..."
              className="min-h-24"
            />
            <Button
              onClick={() => completeAction(action.id)}
              disabled={commentText.trim().length < 10}
              className="w-full"
            >
              댓글 작성
            </Button>
          </div>
        );

      case "share":
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              아래 버튼을 클릭하여 SNS에 공유하세요
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex-col gap-1 h-auto py-3">
                <span className="text-blue-400">𝕏</span>
                <span className="text-xs">Twitter</span>
              </Button>
              <Button variant="outline" className="flex-col gap-1 h-auto py-3">
                <span className="text-blue-600">f</span>
                <span className="text-xs">Facebook</span>
              </Button>
              <Button variant="outline" className="flex-col gap-1 h-auto py-3">
                <span>🔗</span>
                <span className="text-xs">링크 복사</span>
              </Button>
            </div>
            <Button onClick={() => completeAction(action.id)} className="w-full">
              공유 완료
            </Button>
          </div>
        );

      case "external":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">홍보 링크</label>
              <Input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <Button
              onClick={() => completeAction(action.id)}
              disabled={!externalLink.trim()}
              className="w-full"
            >
              홍보 완료
            </Button>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="프로젝트에 대한 상세한 리뷰를 작성해주세요..."
              className="min-h-32"
            />
            <div className="text-sm text-slate-500">
              최소 100자 이상 ({reviewText.length}/100)
            </div>
            <Button
              onClick={() => completeAction(action.id)}
              disabled={reviewText.trim().length < 100}
              className="w-full"
            >
              리뷰 작성
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Card
            key={action.id}
            className={cn(
              "transition-all",
              action.completed && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      action.completed
                        ? "bg-green-100 dark:bg-green-800"
                        : "bg-primary-50 dark:bg-primary-900/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        action.completed
                          ? "text-green-600 dark:text-green-400"
                          : "text-primary-600 dark:text-primary-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      {action.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {action.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={action.completed ? "success" : "secondary"}>
                        <Coins className="mr-1 h-3 w-3" />
                        {action.points}P
                      </Badge>
                      {action.completed && (
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          완료
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {!action.completed && (
                  <Button
                    size="sm"
                    onClick={() => setActiveDialog(action.id)}
                  >
                    참여하기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Dialogs */}
      {actions.map((action) => (
        <Dialog
          key={action.id}
          open={activeDialog === action.id}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        >
          <DialogContent>
            <DialogHeader onClose={() => setActiveDialog(null)}>
              <DialogTitle>{action.title}</DialogTitle>
              <DialogDescription>{action.description}</DialogDescription>
            </DialogHeader>
            {getDialogContent(action)}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}

