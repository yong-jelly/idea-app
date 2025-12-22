import { cn } from "@/shared/lib/utils";
import type { BotRole } from "@/entities/user";

export interface BotBadgeProps {
  role?: BotRole;
  className?: string;
  size?: "sm" | "md";
}

// Bot 역할별 아이콘
const BotIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a3 3 0 00-3 3v1H3a1 1 0 00-1 1v6a1 1 0 001 1h1v1a1 1 0 001 1h6a1 1 0 001-1v-1h1a1 1 0 001-1V6a1 1 0 00-1-1h-2V4a3 3 0 00-3-3zM6 4v1h4V4a2 2 0 00-4 0zm-2 3h8v4H4V7zm2 2a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2z"/>
  </svg>
);

const NotificationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a5 5 0 015 5v2.586l1.293 1.293A1 1 0 0114 11H2a1 1 0 01-.707-1.707L2.586 8V6a5 5 0 015-5zM8 13a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
  </svg>
);

const AssistantIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM4.5 8a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/>
  </svg>
);

const ModeratorIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm0 8a1 1 0 100-2 1 1 0 000 2z"/>
  </svg>
);

// Bot 역할별 스타일 정보
const BOT_ROLE_INFO: Record<BotRole, { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }> = {
  system_notification: {
    label: "시스템 알림",
    icon: NotificationIcon,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
  },
  project_assistant: {
    label: "프로젝트 어시스턴트",
    icon: AssistantIcon,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  community_moderator: {
    label: "커뮤니티 모더레이터",
    icon: ModeratorIcon,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-900/30",
  },
};

/**
 * Bot 배지 컴포넌트
 * 
 * Bot 작성자를 표시하는 배지입니다. 역할별로 다른 색상과 아이콘이 표시됩니다.
 */
export function BotBadge({ role = "system_notification", className, size = "sm" }: BotBadgeProps) {
  const roleInfo = BOT_ROLE_INFO[role];
  const Icon = roleInfo.icon;
  
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };
  
  const iconSizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        roleInfo.bgClass,
        roleInfo.colorClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>{roleInfo.label}</span>
    </span>
  );
}

/**
 * 간단한 Bot 배지 (아이콘만)
 */
export function BotBadgeIcon({ role = "system_notification", className }: { role?: BotRole; className?: string }) {
  const roleInfo = BOT_ROLE_INFO[role];
  const Icon = roleInfo.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        roleInfo.bgClass,
        roleInfo.colorClass,
        "h-5 w-5",
        className
      )}
      title={roleInfo.label}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}





