import { Link } from "react-router";
import { Users } from "lucide-react";
import { Avatar, Badge } from "@/shared/ui";
import { ProjectCommentsSection } from "./ProjectCommentsSection";
import type { Project } from "@/entities/project";
import type { CommentNode } from "@/shared/ui/comment";
import type { User } from "@/entities/user";

interface ProjectOverviewTabProps {
  project: Project;
  galleryImages: string[];
  comments: CommentNode[];
  totalComments: number;
  isLoadingComments: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  onRefreshComments: () => void;
  onLoadMoreComments: () => void;
  onSignUpPrompt: () => void;
  onCreateComment: (content: string, images: string[]) => Promise<void>;
  onReplyComment: (parentId: string, content: string, images: string[]) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onEditComment: (commentId: string, content: string, images: string[]) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function ProjectOverviewTab({
  project,
  galleryImages,
  comments,
  totalComments,
  isLoadingComments,
  isLoadingMore,
  hasMore,
  currentUser,
  isAuthenticated,
  onRefreshComments,
  onLoadMoreComments,
  onSignUpPrompt,
  onCreateComment,
  onReplyComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
}: ProjectOverviewTabProps) {
  return (
    <>
      {/* 팀 카드 */}
      <div className="mb-8 p-4 rounded-xl bg-surface-50/50 dark:bg-surface-900/50 ring-1 ring-surface-100 dark:ring-surface-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-surface-400" />
          <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">팀</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/profile/${project.author.username}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Avatar
              src={project.author.avatar}
              fallback={project.author.displayName}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                  {project.author.displayName}
                </p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Maker
                </Badge>
              </div>
              <p className="text-xs text-surface-500">@{project.author.username}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Comments Section */}
      <ProjectCommentsSection
        comments={comments}
        totalComments={totalComments}
        isLoadingComments={isLoadingComments}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        maxDepth={2}
        onRefresh={onRefreshComments}
        onLoadMore={onLoadMoreComments}
        onSignUpPrompt={onSignUpPrompt}
        onCreate={onCreateComment}
        onReply={onReplyComment}
        onLike={onLikeComment}
        onEdit={onEditComment}
        onDelete={onDeleteComment}
      />
    </>
  );
}





