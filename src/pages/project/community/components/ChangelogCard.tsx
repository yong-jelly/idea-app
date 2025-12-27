import { useState } from "react";
import { Edit, Trash2, Github, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Badge, Card, CardContent } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { ChangelogEntry } from "../types";
import { CHANGE_TYPE_INFO, MAX_VISIBLE_CHANGES, extractDomain } from "../constants";

interface ChangelogCardProps {
  entry: ChangelogEntry;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChangelogCard({ entry, onEdit, onDelete }: ChangelogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreChanges = entry.changes.length > MAX_VISIBLE_CHANGES;
  const visibleChanges = isExpanded ? entry.changes : entry.changes.slice(0, MAX_VISIBLE_CHANGES);
  const hiddenCount = entry.changes.length - MAX_VISIBLE_CHANGES;

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {entry.version}
              </Badge>
              <span className="text-sm text-surface-500">{entry.releasedAt}</span>
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {entry.title}
            </h3>
            {/* 링크 표시 - 타이틀 아래 */}
            {(entry.repositoryUrl || entry.downloadUrl) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {entry.repositoryUrl && (
                  <a
                    href={entry.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.repositoryUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
                {entry.downloadUrl && (
                  <a
                    href={entry.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.downloadUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            )}
          </div>
          {/* 관리 액션 */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  title="수정"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        {entry.description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
            {entry.description}
          </p>
        )}
        <div className="space-y-2">
          {visibleChanges.map((change) => (
            <div key={change.id} className="flex items-start gap-2">
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium shrink-0", CHANGE_TYPE_INFO[change.type].color)}>
                {CHANGE_TYPE_INFO[change.type].label}
              </span>
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {change.description}
              </span>
            </div>
          ))}
        </div>
        {/* 더 보기 버튼 */}
        {hasMoreChanges && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {hiddenCount}개 더 보기
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}






