import { useState } from "react";
import { ChevronDown, Link2 } from "lucide-react";
import { Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface UrlSectionProps {
  repositoryUrl: string;
  demoUrl: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  macStoreUrl: string;
  onRepositoryUrlChange: (value: string) => void;
  onDemoUrlChange: (value: string) => void;
  onAndroidStoreUrlChange: (value: string) => void;
  onIosStoreUrlChange: (value: string) => void;
  onMacStoreUrlChange: (value: string) => void;
  defaultOpen?: boolean; // 기본적으로 열려있을지 여부
}

export function UrlSection({
  repositoryUrl,
  demoUrl,
  androidStoreUrl,
  iosStoreUrl,
  macStoreUrl,
  onRepositoryUrlChange,
  onDemoUrlChange,
  onAndroidStoreUrlChange,
  onIosStoreUrlChange,
  onMacStoreUrlChange,
  defaultOpen = false,
}: UrlSectionProps) {
  const [showUrls, setShowUrls] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <button
        type="button"
        onClick={() => setShowUrls(!showUrls)}
        className="flex w-full items-center justify-between rounded-lg bg-surface-50 px-4 py-3 text-left transition-colors hover:bg-surface-100 dark:bg-surface-800/70 dark:hover:bg-surface-800"
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-surface-500" />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
            링크 추가
          </span>
          <span className="text-xs text-surface-400">(선택)</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-surface-400 transition-transform",
            showUrls && "rotate-180"
          )}
        />
      </button>

      {showUrls && (
        <div className="mt-4 space-y-4 rounded-xl border border-surface-200 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-800/40">
          {/* 저장소 URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
              저장소 URL
            </label>
            <Input
              value={repositoryUrl}
              onChange={(e) => onRepositoryUrlChange(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="h-10 text-sm"
            />
          </div>

          {/* 데모 URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
              데모 URL
            </label>
            <Input
              value={demoUrl}
              onChange={(e) => onDemoUrlChange(e.target.value)}
              placeholder="https://demo.example.com"
              className="h-10 text-sm"
            />
          </div>

          {/* 앱스토어 링크들 */}
          <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
            <p className="mb-3 text-xs font-medium text-surface-500">앱스토어 링크</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <span className="text-sm">🤖</span>
                </div>
                <Input
                  value={androidStoreUrl}
                  onChange={(e) => onAndroidStoreUrlChange(e.target.value)}
                  placeholder="Google Play Store URL"
                  className="h-10 flex-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <span className="text-sm">🍎</span>
                </div>
                <Input
                  value={iosStoreUrl}
                  onChange={(e) => onIosStoreUrlChange(e.target.value)}
                  placeholder="App Store (iOS) URL"
                  className="h-10 flex-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-500/10 text-surface-600 dark:text-surface-400">
                  <span className="text-sm">💻</span>
                </div>
                <Input
                  value={macStoreUrl}
                  onChange={(e) => onMacStoreUrlChange(e.target.value)}
                  placeholder="Mac App Store URL"
                  className="h-10 flex-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

