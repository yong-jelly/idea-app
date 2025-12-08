import { LeftSidebar, FeedTimeline } from "@/widgets";

export function FeedPage() {
  return (
    <div className="mx-auto flex max-w-5xl">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Feed Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="h-[53px] flex items-center px-4">
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">홈</h1>
          </div>
        </div>

        {/* Feed Content */}
        <FeedTimeline />
      </main>
    </div>
  );
}
