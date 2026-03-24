/// <reference types="vite/client" />

declare module "*.md?raw" {
  const content: string;
  export default content;
}

/* lucide-react 엔트리 전용 아이콘 경로 — 번들 최적화용 직접 import 시 타입 보강 */
declare module "lucide-react/dist/esm/icons/chevron-left" {
  import type { LucideIcon } from "lucide-react";
  const Icon: LucideIcon;
  export default Icon;
}
declare module "lucide-react/dist/esm/icons/share-2" {
  import type { LucideIcon } from "lucide-react";
  const Icon: LucideIcon;
  export default Icon;
}
