import { Link } from "react-router";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { User } from "../model/user.types";

export interface UserAvatarProps {
  user: Pick<User, "id" | "username" | "displayName" | "avatar">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  showUsername?: boolean;
  linkToProfile?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  size = "md",
  showName = false,
  showUsername = false,
  linkToProfile = true,
  className,
}: UserAvatarProps) {
  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        src={user.avatar}
        alt={user.displayName}
        fallback={user.displayName}
        size={size}
      />
      {(showName || showUsername) && (
        <div className="flex flex-col min-w-0">
          {showName && (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user.displayName}
            </span>
          )}
          {showUsername && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{user.username}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link 
        to={`/profile/${user.username}`}
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}

