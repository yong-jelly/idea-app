import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui";
import { CommentThread, type CommentNode } from "@/shared/ui/comment";
import { cn } from "@/shared/lib/utils";
import { getProfileImageUrl } from "@/shared/lib/storage";
import type { User } from "@/entities/user";

interface ProjectCommentsSectionProps {
  comments: CommentNode[];
  totalComments: number;
  isLoadingComments: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  maxDepth: number;
  onRefresh: () => void;
  onLoadMore: () => void;
  onSignUpPrompt: () => void;
  onCreate: (content: string, images: string[]) => Promise<void>;
  onReply: (parentId: string, content: string, images: string[]) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string, images: string[]) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function ProjectCommentsSection({
  comments,
  totalComments,
  isLoadingComments,
  isLoadingMore,
  hasMore,
  currentUser,
  isAuthenticated,
  maxDepth,
  onRefresh,
  onLoadMore,
  onSignUpPrompt,
  onCreate,
  onReply,
  onLike,
  onEdit,
  onDelete,
}: ProjectCommentsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          댓글 ({totalComments})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoadingComments}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoadingComments && "animate-spin")} />
          <span>새로고침</span>
        </Button>
      </div>

      {isLoadingComments ? (
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800 text-center text-surface-500">
          댓글을 불러오는 중...
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-white dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-800">
          <CommentThread
            comments={comments}
            currentUser={
              currentUser
                ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    displayName: currentUser.displayName,
                    avatarUrl: currentUser.avatar
                      ? getProfileImageUrl(currentUser.avatar, "sm")
                      : undefined,
                  }
                : { id: "guest", displayName: "게스트" }
            }
            currentUserId={currentUser?.id}
            maxDepth={maxDepth}
            enableAttachments={false}
            maxImages={0}
            isAuthenticated={isAuthenticated}
            onSignUpPrompt={onSignUpPrompt}
            onCreate={onCreate}
            onReply={onReply}
            onLike={onLike}
            onEdit={onEdit}
            onDelete={onDelete}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        </div>
      )}
    </div>
  );
}

