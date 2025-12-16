import { useState, useEffect } from "react";
import { LeftSidebar, FeedTimeline } from "@/widgets";
import { cn } from "@/shared/lib/utils";
import { SignUpModal } from "@/pages/auth";
import { useUserStore } from "@/entities/user";

type FeedTab = "home" | "projects" | "community";

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("home");
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const { isAuthenticated } = useUserStore();

  // ESC 키로 모달 닫기 (ProjectCommunityPage 패턴 참고)
  useEffect(() => {
    if (!showSignUpModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSignUpModal(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showSignUpModal]);

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "home", label: "홈" },
    { id: "projects", label: "프로젝트" },
    { id: "community", label: "커뮤니티" },
  ];

  // 비회원이 프로젝트나 커뮤니티 탭을 클릭할 때 모달 표시
  const handleTabClick = (tabId: FeedTab) => {
    if (!isAuthenticated && (tabId === "projects" || tabId === "community")) {
      setShowSignUpModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="mx-auto flex max-w-5xl items-start">
      {/* Left Sidebar - Desktop Only */}
      <div className="hidden lg:block w-[275px] shrink-0 px-3 self-stretch">
        <LeftSidebar />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-3.5rem)] bg-white dark:bg-surface-950 border-x border-surface-200 dark:border-surface-800">
        {/* Feed Header with Tabs */}
        <div className="sticky top-14 z-10 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-100 dark:border-surface-800">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex-1 h-[53px] text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-surface-900 dark:text-surface-50"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900"
                )}
              >
                {tab.label}
                <div
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full transition-colors",
                    activeTab === tab.id ? "bg-primary-500" : "bg-transparent"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feed Content */}
        <div className={activeTab === "home" ? "block" : "hidden"}>
          <FeedTimeline onSignUpPrompt={() => setShowSignUpModal(true)} />
        </div>

        <div className={activeTab === "projects" ? "block" : "hidden"}>
          <ProjectsFeed />
        </div>

        <div className={activeTab === "community" ? "block" : "hidden"}>
          <CommunityFeed />
        </div>
      </main>

      {/* 회원 가입 모달 */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  );
}

// 프로젝트 피드 (임시)
function ProjectsFeed() {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
        <span className="text-2xl">🚀</span>
      </div>
      <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
        프로젝트 피드
      </h3>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        구독 중인 프로젝트의 업데이트가 여기에 표시됩니다
      </p>
    </div>
  );
}

// 커뮤니티 피드 (임시)
function CommunityFeed() {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
        <span className="text-2xl">💬</span>
      </div>
      <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50">
        커뮤니티 피드
      </h3>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        참여 중인 커뮤니티의 글이 여기에 표시됩니다
      </p>
    </div>
  );
}
