/**
 * @file AccessTokenTable.tsx
 * @description GitHub PAT 목록과 유사한 액세스 토큰 테이블. 이름 2줄·스코프 +n 펼치기.
 */

import { Fragment, useCallback, useState } from "react";
import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import { MCP_SCOPE_OPTIONS } from "@/features/project-settings";
import type { ProjectAccessToken } from "@/entities/project";

/** 접힌 상태에서 보이는 스코프 뱃지 개수 (+n으로 나머지) */
const COLLAPSED_SCOPE_BADGE_COUNT = 3;

function scopeLabel(id: string): string {
  return MCP_SCOPE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function formatDate(iso: string | null): string {
  if (!iso) return "만료 없음";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

type ScopeBadgesProps = {
  scopes: string[];
  expanded: boolean;
  hiddenCount: number;
  onToggleExpand: () => void;
};

function ScopeBadges({ scopes, expanded, hiddenCount, onToggleExpand }: ScopeBadgesProps) {
  const visibleScopes = expanded ? scopes : scopes.slice(0, COLLAPSED_SCOPE_BADGE_COUNT);

  return (
    <div className="flex flex-wrap gap-1 items-start">
      {visibleScopes.map((s) => (
        <Badge key={s} variant="secondary" className="text-[10px] font-normal max-w-[min(100%,12rem)] truncate shrink">
          {scopeLabel(s)}
        </Badge>
      ))}
      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center rounded-md border border-surface-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-primary-700 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-900 dark:text-primary-300 dark:hover:bg-surface-800 shrink-0"
        >
          +{hiddenCount}
        </button>
      ) : null}
      {expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center text-[10px] text-primary-600 hover:underline dark:text-primary-400 shrink-0 ml-0.5"
        >
          접기
        </button>
      ) : null}
    </div>
  );
}

type AccessTokenTableProps = {
  tokens: ProjectAccessToken[];
  onRevoke: (id: string) => void | Promise<void>;
};

export function AccessTokenTable({ tokens, onRevoke }: AccessTokenTableProps) {
  const rows = tokens.filter((t) => !t.isRevoked);
  /** 행별 스코프 전체 펼침 여부 */
  const [expandedScopeRows, setExpandedScopeRows] = useState<Set<string>>(() => new Set());

  const toggleScopesExpanded = useCallback((rowId: string) => {
    setExpandedScopeRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-surface-500 dark:text-surface-400 py-6 text-center border border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
        아직 발급된 토큰이 없습니다. &quot;새 토큰 생성&quot;으로 추가하세요.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="min-w-0 sm:w-[24%]" />
          <col className="min-w-0 hidden sm:table-column sm:w-[36%]" />
          <col className="w-[28%] sm:w-[14%]" />
          <col className="hidden md:table-column md:w-[16%]" />
          <col className="w-[18%] sm:w-[10%]" />
        </colgroup>
        <thead className="bg-surface-50 dark:bg-surface-900/80 border-b border-surface-200 dark:border-surface-800">
          <tr>
            <th className="px-3 sm:px-4 py-3 font-medium text-surface-700 dark:text-surface-300 align-top">
              이름
            </th>
            <th className="px-3 sm:px-4 py-3 font-medium text-surface-700 dark:text-surface-300 align-top hidden sm:table-cell">
              스코프
            </th>
            <th className="px-3 sm:px-4 py-3 font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap align-top">
              만료
            </th>
            <th className="px-3 sm:px-4 py-3 font-medium text-surface-700 dark:text-surface-300 hidden md:table-cell align-top">
              마지막 사용
            </th>
            <th className="px-3 sm:px-4 py-3 align-top" />
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
          {rows.map((t) => {
            const expanded = expandedScopeRows.has(t.id);
            const scopes = t.scopes;
            const hiddenCount =
              scopes.length > COLLAPSED_SCOPE_BADGE_COUNT ? scopes.length - COLLAPSED_SCOPE_BADGE_COUNT : 0;

            return (
              <Fragment key={t.id}>
                <tr className="bg-white dark:bg-surface-950/40 align-top">
                  <td className="px-3 sm:px-4 py-3 min-w-0">
                    <span
                      className="font-medium text-surface-900 dark:text-surface-50 line-clamp-2 break-words"
                      title={t.name}
                    >
                      {t.name}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 min-w-0 hidden sm:table-cell">
                    <ScopeBadges
                      scopes={scopes}
                      expanded={expanded}
                      hiddenCount={hiddenCount}
                      onToggleExpand={() => toggleScopesExpanded(t.id)}
                    />
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap align-top">
                    {formatDate(t.expiresAt)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-surface-500 dark:text-surface-500 hidden md:table-cell text-xs align-top">
                    {t.lastUsedAt ? formatDate(t.lastUsedAt) : "—"}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => {
                        if (window.confirm(`토큰 "${t.name}"을(를) 폐기할까요? 이 작업은 되돌릴 수 없습니다.`)) {
                          void onRevoke(t.id);
                        }
                      }}
                    >
                      폐기
                    </Button>
                  </td>
                </tr>
                {/* sm 미만: 스코프를 보조 행으로 표시 */}
                <tr className="sm:hidden bg-surface-50/80 dark:bg-surface-900/50">
                  <td colSpan={5} className="px-3 py-2.5 border-t border-surface-100 dark:border-surface-800">
                    <p className="text-[10px] font-medium text-surface-500 dark:text-surface-400 mb-1.5">스코프</p>
                    <ScopeBadges
                      scopes={scopes}
                      expanded={expanded}
                      hiddenCount={hiddenCount}
                      onToggleExpand={() => toggleScopesExpanded(t.id)}
                    />
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
