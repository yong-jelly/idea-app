/**
 * @file generate-access-token.modal.tsx
 * @description 프로젝트 LLM/API 액세스 토큰 생성 모달. announce.modal과 동일한 포털·헤더·본문 스크롤 구조.
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, Copy } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  EXPIRATION_OPTIONS,
  MCP_SCOPE_OPTIONS,
  PROJECT_ACCESS_TOKEN_NAME_MAX_LEN,
  type ExpirationPreset,
} from "@/features/project-settings";

export interface GenerateAccessTokenModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 */
  onClose: () => void;
  /** 토큰 생성 (평문 반환). RPC 실패 시 reject */
  onCreate: (name: string, scopes: string[], preset: ExpirationPreset) => Promise<string>;
}

const FORM_ID = "generate-access-token-form";

export function GenerateAccessTokenModal({ isOpen, onClose, onCreate }: GenerateAccessTokenModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<ExpirationPreset>("30d");
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () => new Set(["project.read", "announcement.read"])
  );
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** RPC 발급 중 중복 제출 방지 */
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof MCP_SCOPE_OPTIONS>();
    for (const opt of MCP_SCOPE_OPTIONS) {
      const arr = m.get(opt.group) ?? [];
      arr.push(opt);
      m.set(opt.group, arr);
    }
    return Array.from(m.entries());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep("form");
      setPlainToken(null);
      setCopied(false);
      setIsSubmitting(false);
      setName("");
      setPreset("30d");
      setSelectedScopes(new Set(["project.read", "announcement.read"]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scopes = Array.from(selectedScopes);
    if (scopes.length === 0) {
      window.alert("최소 한 개 이상의 스코프를 선택하세요.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const plain = await onCreate(name.trim() || "새 토큰", scopes, preset);
      setPlainToken(plain);
      setStep("success");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "토큰을 발급할 수 없습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!plainToken) return;
    try {
      await navigator.clipboard.writeText(plainToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div
          className={cn(
            "h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-xl",
            "bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl",
            "flex flex-col overflow-hidden"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-access-token-title"
        >
          {/* 헤더: announce.modal과 동일 — 고정, 스크롤과 분리 */}
          <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
                aria-label="닫기"
              >
                <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </button>
              <h1
                id="generate-access-token-title"
                className="text-lg font-bold text-surface-900 dark:text-surface-50 truncate"
              >
                {step === "form" ? "새 액세스 토큰" : "토큰 생성 완료"}
              </h1>
            </div>
            {step === "form" ? (
              <Button
                type="submit"
                form={FORM_ID}
                size="sm"
                className="rounded-full shrink-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? "생성 중…" : "생성"}
              </Button>
            ) : (
              <Button type="button" size="sm" className="rounded-full shrink-0" onClick={onClose}>
                닫기
              </Button>
            )}
          </header>

          {step === "form" ? (
            <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              {/* 본문만 스크롤 — 긴 스코프 목록이 헤더를 밀지 않음 */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 md:p-6 space-y-5">
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    LLM·스크립트가 이 프로젝트에 접근할 때 사용합니다. 비밀 값이므로 안전하게 보관하세요.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="token-name"
                        className="text-sm font-medium text-surface-700 dark:text-surface-300"
                      >
                        이름
                      </label>
                      <span className="text-xs text-surface-500 dark:text-surface-400 tabular-nums">
                        {name.length}/{PROJECT_ACCESS_TOKEN_NAME_MAX_LEN}
                      </span>
                    </div>
                    <Input
                      id="token-name"
                      value={name}
                      maxLength={PROJECT_ACCESS_TOKEN_NAME_MAX_LEN}
                      onChange={(e) =>
                        setName(e.target.value.slice(0, PROJECT_ACCESS_TOKEN_NAME_MAX_LEN))
                      }
                      placeholder="예: CI용"
                      autoComplete="off"
                    />
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      최대 {PROJECT_ACCESS_TOKEN_NAME_MAX_LEN}자 (공백 포함)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="token-exp" className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      만료
                    </label>
                    <select
                      id="token-exp"
                      value={preset}
                      onChange={(e) => setPreset(e.target.value as ExpirationPreset)}
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-50"
                    >
                      {EXPIRATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset className="min-h-0">
                    <legend className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      스코프
                    </legend>
                    {/* 스코프 영역만 높이 제한 + 내부 스크롤 — 모달 전체가 길어지지 않음 */}
                    <div className="max-h-[min(42vh,280px)] overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/40 p-3 space-y-3">
                      {grouped.map(([groupName, opts]) => (
                        <div key={groupName}>
                          <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2 sticky top-0 bg-surface-50/95 dark:bg-surface-950/95 py-0.5 z-[1]">
                            {groupName}
                          </p>
                          <ul className="space-y-2">
                            {opts.map((opt) => (
                              <li key={opt.id} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  id={`gat-scope-${opt.id}`}
                                  checked={selectedScopes.has(opt.id)}
                                  onChange={() => toggleScope(opt.id)}
                                  className="mt-1 rounded border-surface-300"
                                />
                                <label
                                  htmlFor={`gat-scope-${opt.id}`}
                                  className="text-sm text-surface-800 dark:text-surface-200 leading-snug"
                                >
                                  <span className="font-mono text-[11px] text-surface-500 dark:text-surface-500">
                                    {opt.id}
                                  </span>
                                  <span className="block">{opt.label}</span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>

              <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/80 md:hidden">
                <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
                  취소
                </Button>
              </footer>
            </form>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4">
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  이 값은 다시 표시할 수 없습니다. 지금 복사해 두세요.
                </p>
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  비밀번호처럼 취급하세요. 유출 시 즉시 폐기하고 새로 발급하세요.
                </div>
                <div className="flex flex-col gap-2">
                  <code className="w-full break-all rounded-lg bg-surface-100 px-3 py-2 font-mono text-xs text-surface-900 dark:bg-surface-800 dark:text-surface-100">
                    {plainToken}
                  </code>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto gap-1.5 self-start"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "복사됨" : "클립보드에 복사"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
