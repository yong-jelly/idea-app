/**
 * @file mcp-access-token.constants.ts
 * @description 프로젝트 설정(LLM/API) 액세스 토큰 UI용 스코프·만료 프리셋 상수. widgets/pages에서 공통 사용.
 */

/** MCP 유사 scope 목록 (TODO-MCP와 정합) */
export const MCP_SCOPE_OPTIONS: Array<{ id: string; label: string; group: string }> = [
  { id: "project.read", label: "프로젝트 읽기", group: "프로젝트" },
  { id: "project.write", label: "프로젝트 쓰기", group: "프로젝트" },
  { id: "announcement.read", label: "공지/업데이트 읽기", group: "커뮤니티" },
  { id: "announcement.write", label: "공지/업데이트 쓰기", group: "커뮤니티" },
  { id: "milestone.read", label: "마일스톤 읽기", group: "마일스톤" },
  { id: "milestone.write", label: "마일스톤 쓰기", group: "마일스톤" },
  { id: "changelog.read", label: "변경사항 읽기", group: "변경사항" },
  { id: "changelog.write", label: "변경사항 쓰기", group: "변경사항" },
  { id: "manual.read", label: "메뉴얼 읽기", group: "문서" },
  { id: "echo.invoke", label: "에코 테스트 호출", group: "개발자" },
];

export type ExpirationPreset = "7d" | "30d" | "90d" | "none";

export const EXPIRATION_OPTIONS: Array<{ value: ExpirationPreset; label: string }> = [
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "90d", label: "90일" },
  { value: "none", label: "만료 없음" },
];

/**
 * 만료 프리셋을 UTC ISO 만료 시각으로 변환. "none"이면 null.
 */
export function expirationPresetToExpiresAt(preset: ExpirationPreset): string | null {
  if (preset === "none") return null;
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
