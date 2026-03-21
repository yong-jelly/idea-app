/**
 * @file build-llm-manual-markdown.ts
 * @description 공개 LLM 매뉴얼 MD 템플릿에 project_id·origin·파생 project_key 등을 치환한다.
 */

import manualTemplate from "./project-llm-manual.md?raw";
import { deriveProjectKeyFromProjectId } from "@/features/project-settings";

export type BuildLlmManualMarkdownParams = {
  /** 프로젝트 UUID */
  projectId: string;
  /** `window.location.origin` */
  origin: string;
};

/**
 * 공개 매뉴얼 마크다운 문자열 생성 (복사·렌더 공용).
 */
export function buildLlmManualMarkdown({ projectId, origin }: BuildLlmManualMarkdownParams): string {
  const projectKey = deriveProjectKeyFromProjectId(projectId);
  const manualAbs = `${origin}/project/${projectId}/llm-manual`;
  const settingsAbs = `${origin}/project/${projectId}/settings/access`;
  const echoAbs = `${origin}/project/${projectId}/settings/echo`;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xyqpggpilgcdsawuvpzn.supabase.co";
  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4rByGLkIJH0y9Qz7CKm1MA_ulfWQZtj";

  const map: Record<string, string> = {
    "{{PROJECT_ID}}": projectId,
    "{{PROJECT_KEY}}": projectKey,
    "{{MANUAL_ABS_URL}}": manualAbs,
    "{{SETTINGS_ACCESS_ABS_URL}}": settingsAbs,
    "{{ECHO_ABS_URL}}": echoAbs,
    "{{SUPABASE_URL}}": supabaseUrl,
    "{{SUPABASE_ANON_KEY}}": supabaseAnonKey,
    "{{ORIGIN}}": origin,
  };

  let s = manualTemplate;
  for (const [key, value] of Object.entries(map)) {
    s = s.split(key).join(value);
  }
  return s;
}
