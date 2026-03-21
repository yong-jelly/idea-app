/**
 * @file project-key.ts
 * @description 프로젝트 UUID로부터 LLM/API 연동용 공개 프로젝트 키 문자열을 생성한다. DB 저장 없이 결정적 파생값.
 */

/**
 * 프로젝트 ID(uuid)에서 `prj_` 접두 프로젝트 키를 만든다.
 * @param projectId 프로젝트 UUID
 */
export function deriveProjectKeyFromProjectId(projectId: string): string {
  const compact = projectId.replace(/-/g, "");
  return `prj_${compact.slice(0, 8)}_${compact.slice(8, 16)}`;
}
