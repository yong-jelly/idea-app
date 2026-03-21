/**
 * @file LinkText.tsx
 * @description 평문 문자열에 포함된 http(s)·www. 형태 URL을 감지해 클릭 가능한 앵커로 렌더링합니다.
 * 댓글·피드 본문·프로젝트 설명 등 마크다운 미지원 영역에서 사용합니다.
 */

import { Fragment, useMemo, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/** http(s) 또는 www. 도메인으로 시작하는 URL 조각 (전역 플래그 없이 매번 새 RegExp 사용) */
const URL_PATTERN =
  /(https?:\/\/[^\s<]+)|(www\.[a-zA-Z0-9][^\s<]*\.[a-zA-Z]{2,}[^\s<]*)/g;

/**
 * URL 끝에 붙는 문장 부호 등을 제거해 href로 사용합니다.
 * (예: "https://a.com)." → "https://a.com")
 */
function trimUrlForHref(raw: string): string {
  let u = raw.trim();
  while (u.length > 0) {
    const last = u[u.length - 1];
    if (last === "." || last === "," || last === ";" || last === ":" || last === "!" || last === "?") {
      u = u.slice(0, -1);
      continue;
    }
    if (last === ")" && !u.includes("(")) {
      u = u.slice(0, -1);
      continue;
    }
    break;
  }
  return u;
}

/**
 * 표시·href용으로 정규화합니다. www. 만 있는 경우 https:// 를 붙입니다.
 */
function toHref(trimmed: string): string {
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export type LinkifyOptions = {
  /** 앵커에 적용할 Tailwind 클래스 */
  linkClassName?: string;
  /** 부모 Row·카드의 onClick 과 충돌하지 않도록 링크 클릭 시 전파 중단 */
  stopPropagationOnLinkClick?: boolean;
};

/**
 * 평문 문자열을 URL 구간만 `<a>` 로 나눈 React 노드 배열로 변환합니다.
 * @param text 입력 평문
 * @param options 링크 스타일·이벤트 옵션
 */
export function linkifyPlainTextToNodes(text: string, options: LinkifyOptions = {}): ReactNode[] {
  const { linkClassName, stopPropagationOnLinkClick = true } = options;
  const nodes: ReactNode[] = [];
  if (!text) {
    return nodes;
  }

  const re = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex, m.index)}</Fragment>);
    }
    const raw = m[0];
    const trimmed = trimUrlForHref(raw);
    const href = toHref(trimmed);
    const handleClick = stopPropagationOnLinkClick ? (e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation() : undefined;

    nodes.push(
      <a
        key={`u-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "text-primary-600 underline decoration-primary-600/40 underline-offset-2 break-all hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300",
          linkClassName,
        )}
      >
        {raw}
      </a>,
    );
    lastIndex = m.index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export type LinkTextProps = {
  /** 링크를 적용할 평문 */
  children: string;
  /** 래퍼 span 클래스 (기본 없음) */
  className?: string;
  /** 앵커 클래스 */
  linkClassName?: string;
  /** 링크 클릭 시 이벤트 전파 중단 (기본 true) */
  stopPropagationOnLinkClick?: boolean;
};

/**
 * 평문 한 덩어리를 URL 자동 링크와 함께 표시합니다.
 */
export function LinkText({
  children,
  className,
  linkClassName,
  stopPropagationOnLinkClick = true,
}: LinkTextProps) {
  const nodes = useMemo(
    () => linkifyPlainTextToNodes(children, { linkClassName, stopPropagationOnLinkClick }),
    [children, linkClassName, stopPropagationOnLinkClick],
  );

  if (children == null || children === "") {
    return null;
  }

  return <span className={className}>{nodes}</span>;
}
