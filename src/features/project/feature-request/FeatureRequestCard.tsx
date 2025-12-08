import { ChevronUp, MessageCircle, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Card, Badge, Button } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { UserAvatar } from "@/entities/user";
import type { FeatureRequest, FeatureRequestStatus } from "@/entities/project";

const STATUS_CONFIG: Record<FeatureRequestStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "대기중", color: "bg-slate-100 text-slate-700", icon: Clock },
  reviewing: { label: "검토중", color: "bg-yellow-100 text-yellow-700", icon: Eye },
  accepted: { label: "수락됨", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "거절됨", color: "bg-red-100 text-red-700", icon: XCircle },
  completed: { label: "완료됨", color: "bg-primary-100 text-primary-700", icon: CheckCircle2 },
};

interface FeatureRequestCardProps {
  request: FeatureRequest;
  onVote?: (requestId: string) => void;
}

export function FeatureRequestCard({ request, onVote }: FeatureRequestCardProps) {
  const statusConfig = STATUS_CONFIG[request.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Vote Button */}
        <div className="flex flex-col items-center">
          <Button
            variant={request.isVoted ? "primary" : "outline"}
            size="sm"
            className={cn(
              "flex flex-col gap-0.5 h-auto px-3 py-2",
              request.isVoted && "bg-primary-500"
            )}
            onClick={() => onVote?.(request.id)}
          >
            <ChevronUp className="h-4 w-4" />
            <span className="text-sm font-bold">{request.votesCount}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {request.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <UserAvatar user={request.author} size="xs" showName />
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatRelativeTime(request.createdAt)}
                </span>
              </div>
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {request.description}
          </p>

          {/* Developer Response */}
          {request.developerResponse && (
            <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
              <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">
                개발자 응답
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                {request.developerResponse}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
            <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
              <MessageCircle className="h-4 w-4" />
              댓글
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

