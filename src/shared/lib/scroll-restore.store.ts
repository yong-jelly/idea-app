import { create } from "zustand";

interface ScrollRestoreStore {
  scrollMap: Record<string, number>;
  saveScroll: (pathname: string, scrollY: number) => void;
  getScroll: (pathname: string) => number;
  clearScroll: (pathname: string) => void;
}

export const useScrollRestoreStore = create<ScrollRestoreStore>((set, get) => ({
  scrollMap: {},

  saveScroll: (pathname, scrollY) =>
    set((state) => ({
      scrollMap: { ...state.scrollMap, [pathname]: scrollY },
    })),

  getScroll: (pathname) => get().scrollMap[pathname] ?? 0,

  clearScroll: (pathname) =>
    set((state) => {
      const { [pathname]: _, ...rest } = state.scrollMap;
      return { scrollMap: rest };
    }),
}));
