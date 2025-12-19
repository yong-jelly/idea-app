import { useState, useEffect } from "react";
import { LeftSidebar, FeedTimeline } from "@/widgets";
import { cn } from "@/shared/lib/utils";
import { SignUpModal } from "@/pages/auth";
import { ProfileEditModal } from "@/pages/profile";
import { useUserStore } from "@/entities/user";

type FeedTab = "home" | "projects" | "community";

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("home");
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      <div className="hidden lg:block w-[260px] shrink-0 self-stretch">
        <LeftSidebar onProfileEditClick={() => {
          if (!isAuthenticated) {
            setShowSignUpModal(true);
            return;
          }
          setIsEditModalOpen(true);
        }} />
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-950 border-x border-surface-100/80 dark:border-surface-800/50">
        {/* Feed Header with Tabs - 세련된 탭 디자인 */}
        <div className="sticky top-16 z-10 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800/50">
          <div className="flex items-center px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex-1 h-14 text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "text-surface-900 dark:text-white"
                    : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
                )}
              >
                <span className="relative z-10">{tab.label}</span>
                
                {/* 활성 탭 배경 효과 */}
                {activeTab === tab.id && (
                  <span className="absolute inset-x-2 inset-y-2 rounded-xl bg-surface-100/70 dark:bg-surface-800/50 -z-0 transition-all" />
                )}
                
                {/* 하단 인디케이터 */}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary-500 transition-all duration-300",
                    activeTab === tab.id ? "w-8 opacity-100" : "w-0 opacity-0"
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

      {/* 프로필 편집 모달 */}
      {isAuthenticated && (
        <ProfileEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}

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
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/30 border border-primary-100 dark:border-primary-800/50">
        <span className="text-3xl">🚀</span>
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
        프로젝트 피드
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs leading-relaxed">
        구독 중인 프로젝트의 업데이트가 여기에 표시됩니다
      </p>
    </div>
  );
}

// 커뮤니티 피드 (임시)
function CommunityFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/50 dark:to-orange-900/30 border border-amber-100 dark:border-amber-800/50">
        <span className="text-3xl">💬</span>
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
        커뮤니티 피드
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs leading-relaxed">
        참여 중인 커뮤니티의 글이 여기에 표시됩니다
      </p>
    </div>
  );
}
