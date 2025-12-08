import { Card, CardContent, Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { ChangelogEntry } from "../../model/feed.types";
import { CHANGE_TYPE_INFO } from "../../model/feed.types";

// 미니멀 아이콘들
const FileIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3H3v10h10v-3M9 3h4v4M14 2L7 9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface ChangelogRowProps {
  entry: ChangelogEntry;
  onClick?: () => void;
  onViewMore?: () => void;
  className?: string;
}

/**
 * 변경사항 Row
 * 
 * 프로젝트 릴리즈/변경사항 히스토리를 표시합니다.
 * 버전, 변경 내역 목록 등을 보여줍니다.
 */
export function ChangelogRow({
  entry,
  onClick,
  onViewMore,
  className,
}: ChangelogRowProps) {
  return (
    <Card 
      className={cn(
        "hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                {entry.version}
              </Badge>
              <span className="text-sm text-surface-500">{entry.releasedAt}</span>
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {entry.title}
            </h3>
          </div>
          {onViewMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMore();
              }}
              className="text-surface-400 hover:text-primary-500 transition-colors p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <ExternalLinkIcon />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
          {entry.description}
        </p>

        {/* Changes List */}
        <div className="space-y-2">
          {entry.changes.map((change, i) => {
            const changeInfo = CHANGE_TYPE_INFO[change.type];
            
            return (
              <div key={i} className="flex items-start gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                  changeInfo.colorClass
                )}>
                  {changeInfo.label}
                </span>
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {change.description}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== 컴팩트 버전 ==========

export interface ChangelogRowCompactProps {
  entry: ChangelogEntry;
  onClick?: () => void;
  className?: string;
}

export function ChangelogRowCompact({
  entry,
  onClick,
  className,
}: ChangelogRowCompactProps) {
  const totalChanges = entry.changes.length;
  const featureCount = entry.changes.filter(c => c.type === "feature").length;
  const fixCount = entry.changes.filter(c => c.type === "fix").length;

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500">
        <FileIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
            {entry.version}
          </h4>
          <span className="text-xs text-surface-500">{entry.releasedAt}</span>
        </div>
        <p className="text-xs text-surface-500 tabular-nums">
          {featureCount > 0 && `새 기능 ${featureCount}개`}
          {featureCount > 0 && fixCount > 0 && " · "}
          {fixCount > 0 && `버그 수정 ${fixCount}개`}
          {featureCount === 0 && fixCount === 0 && `${totalChanges}개 변경사항`}
        </p>
      </div>
    </div>
  );
}
