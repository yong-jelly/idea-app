import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  Megaphone,
  MessageSquareText,
  Gift,
  Target,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO } from "@/entities/project";
import { useUserStore } from "@/entities/user";
import type { TabType } from "./types";
import { MilestonesTab } from "./tabs/MilestonesTab";
import { DevFeedTab } from "./tabs/DevFeedTab";
import { FeedbackTab } from "./tabs/FeedbackTab";
// TODO: 나머지 탭들 분리 후 import
// import { RewardsTab } from "./tabs/RewardsTab";
// import { ChangelogTab } from "./tabs/ChangelogTab";

// 임시: 원본 파일에서 import (나중에 분리)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {
  RewardsTab,
  ChangelogTab,
  dummyMilestones,
  dummyRewards,
  dummyPointRules,
  dummyTopSupporters,
  dummyClaimedRewards,
  dummyChangelog,
} from "../ProjectCommunityPage";

export function ProjectCommunityPage() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { user } = useUserStore();
  
  const validTabs: TabType[] = ["devfeed", "feedback", "rewards", "milestones", "changelog"];
  const initialTab = tab && validTabs.includes(tab as TabType) ? (tab as TabType) : "devfeed";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // URL 변경 시 탭 동기화
  useEffect(() => {
    if (tab && validTabs.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
    } else if (!tab) {
      setActiveTab("devfeed");
    }
  }, [tab]);

  // 탭 변경 핸들러
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/project/${id}/community/${newTab}`, { replace: true });
  };

  const project = projects[0]; // 임시로 첫 번째 프로젝트 사용
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const tabs = [
    { id: "devfeed" as TabType, label: "공지", icon: Megaphone },
    { id: "feedback" as TabType, label: "피드백", icon: MessageSquareText },
    { id: "rewards" as TabType, label: "리워드", icon: Gift },
    { id: "milestones" as TabType, label: "마일스톤", icon: Target },
    { id: "changelog" as TabType, label: "변경사항", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/project/${id}`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            프로젝트로 돌아가기
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 text-3xl dark:bg-surface-800">
              {categoryInfo?.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {project.title} 커뮤니티
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                개발팀과 소통하고 프로젝트 진행 상황을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-surface-900 dark:text-surface-50"
                      : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {/* 개발사 피드 */}
          {activeTab === "devfeed" && (
            <DevFeedTab projectId={id || "1"} />
          )}

          {/* 피드백 */}
          {activeTab === "feedback" && (
            <FeedbackTab projectId={id || "1"} />
          )}

          {/* 리워드 */}
          {activeTab === "rewards" && (
            <RewardsTab 
              rewards={dummyRewards}
              pointRules={dummyPointRules}
              topSupporters={dummyTopSupporters}
              claimedRewards={dummyClaimedRewards}
              projectId={id || "1"}
              isOwner={project.author.id === user?.id}
            />
          )}

          {/* 마일스톤 */}
          {activeTab === "milestones" && (
            <MilestonesTab projectId={id || "1"} />
          )}

          {/* 변경사항 */}
          {activeTab === "changelog" && (
            <ChangelogTab changelogs={dummyChangelog} projectId={id || "1"} />
          )}
        </div>
      </div>
    </div>
  );
}

