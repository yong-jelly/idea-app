import { useCallback } from "react";
import { useLocation } from "react-router";
import { useScrollRestoreStore } from "@/shared/lib/scroll-restore.store";

export function useSaveScroll() {
  const location = useLocation();
  const saveScroll = useScrollRestoreStore((s) => s.saveScroll);

  return useCallback(() => {
    saveScroll(location.pathname, window.scrollY);
  }, [location.pathname, saveScroll]);
}
