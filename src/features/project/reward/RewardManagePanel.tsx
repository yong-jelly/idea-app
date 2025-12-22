import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, Edit, Trash2, X, Gift, Ticket, Zap, Download, 
  Smartphone, Monitor, Globe, AlertCircle, Check, MoreHorizontal,
  Archive, Eye, EyeOff
} from "lucide-react";
import { Button, Card, CardContent, Badge, Input, Textarea, Progress } from "@/shared/ui";
import { cn, formatNumber } from "@/shared/lib/utils";
import type { Reward, RewardType, RewardPlatform } from "@/entities/project";

// 리워드 타입 정보
const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; icon: typeof Gift; description: string }[] = [
  { value: "redeem_code", label: "리딤코드", icon: Ticket, description: "할인 쿠폰, 프로모션 코드 등" },
  { value: "beta_access", label: "베타 액세스", icon: Zap, description: "TestFlight, 내부 테스트 참여" },
  { value: "digital", label: "디지털 상품", icon: Download, description: "다운로드, 디지털 콘텐츠" },
  { value: "physical", label: "실물 상품", icon: Gift, description: "굿즈, 실물 배송 상품" },
];

const PLATFORM_OPTIONS: { value: RewardPlatform; label: string; icon: typeof Smartphone }[] = [
  { value: "ios", label: "iOS", icon: Smartphone },
  { value: "android", label: "Android", icon: Smartphone },
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "web", label: "Web", icon: Globe },
];

const REWARD_TYPE_INFO: Record<RewardType, { label: string; icon: typeof Gift; color: string }> = {
  redeem_code: { label: "리딤코드", icon: Ticket, color: "text-emerald-500" },
  beta_access: { label: "베타 액세스", icon: Zap, color: "text-violet-500" },
  digital: { label: "디지털", icon: Download, color: "text-blue-500" },
  physical: { label: "실물", icon: Gift, color: "text-amber-500" },
};

interface RewardManagePanelProps {
  rewards: Reward[];
  projectId: string;
  onAdd: (reward: Omit<Reward, "id" | "claimedCount" | "createdAt">) => Promise<void>;
  onEdit: (id: string, reward: Partial<Reward>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

interface RewardFormData {
  title: string;
  description: string;
  type: RewardType;
  pointsRequired: number;
  quantity: number;
  expiresAt: string;
  codePrefix: string;
  platform: RewardPlatform | "";
  accessUrl: string;
  isActive: boolean;
}

const defaultFormData: RewardFormData = {
  title: "",
  description: "",
  type: "redeem_code",
  pointsRequired: 100,
  quantity: 100,
  expiresAt: "",
  codePrefix: "",
  platform: "",
  accessUrl: "",
  isActive: true,
};

export function RewardManagePanel({ rewards, projectId, onAdd, onEdit, onDelete, onToggleActive }: RewardManagePanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<RewardFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleOpenModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description,
        type: reward.type,
        pointsRequired: reward.pointsRequired,
        quantity: reward.quantity,
        expiresAt: reward.expiresAt || "",
        codePrefix: reward.codePrefix || "",
        platform: reward.platform || "",
        accessUrl: reward.accessUrl || "",
        isActive: reward.isActive,
      });
    } else {
      setEditingReward(null);
      setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReward(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);
    try {
      const rewardData = {
        projectId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        pointsRequired: formData.pointsRequired,
        quantity: formData.quantity === -1 ? -1 : formData.quantity,
        expiresAt: formData.expiresAt || undefined,
        codePrefix: formData.type === "redeem_code" ? formData.codePrefix || undefined : undefined,
        platform: formData.type === "beta_access" && formData.platform ? formData.platform as RewardPlatform : undefined,
        accessUrl: formData.type === "beta_access" ? formData.accessUrl || undefined : undefined,
        isActive: formData.isActive,
      };

      if (editingReward) {
        await onEdit(editingReward.id, rewardData);
      } else {
        await onAdd(rewardData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save reward:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete reward:", error);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await onToggleActive(id, !currentActive);
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            리워드 관리
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            총 {rewards.length}개의 리워드
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          리워드 추가
        </Button>
      </div>

      {/* 리워드 목록 */}
      <div className="space-y-3">
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Gift className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400 mb-4">
                아직 등록된 리워드가 없습니다
              </p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-1" />
                첫 리워드 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          rewards.map((reward) => {
            const typeInfo = REWARD_TYPE_INFO[reward.type];
            const TypeIcon = typeInfo?.icon || Gift;
            const isUnlimited = reward.quantity === -1;
            const remaining = isUnlimited ? Infinity : reward.quantity - reward.claimedCount;
            const progress = isUnlimited ? 0 : (reward.claimedCount / reward.quantity) * 100;

            return (
              <Card 
                key={reward.id}
                className={cn(!reward.isActive && "opacity-60")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* 아이콘 */}
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                      typeInfo?.color,
                      "bg-current/10"
                    )}>
                      <TypeIcon className="h-6 w-6" />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-surface-900 dark:text-surface-50">
                              {reward.title}
                            </h4>
                            {!reward.isActive && (
                              <Badge variant="secondary" className="text-[10px]">
                                비활성
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1">
                            {reward.description}
                          </p>
                        </div>

                        {/* 액션 메뉴 */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setActiveMenu(activeMenu === reward.id ? null : reward.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          
                          {activeMenu === reward.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-white dark:bg-surface-800 shadow-lg border border-surface-200 dark:border-surface-700 py-1 z-20">
                                <button
                                  onClick={() => {
                                    handleOpenModal(reward);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                >
                                  <Edit className="h-4 w-4" />
                                  수정
                                </button>
                                <button
                                  onClick={() => {
                                    handleToggleActive(reward.id, reward.isActive);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                >
                                  {reward.isActive ? (
                                    <>
                                      <EyeOff className="h-4 w-4" />
                                      비활성화
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4" />
                                      활성화
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteConfirm(reward.id);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 상세 정보 */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                        <Badge variant="secondary">
                          {typeInfo?.label}
                        </Badge>
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {formatNumber(reward.pointsRequired)} P
                        </span>
                        {isUnlimited ? (
                          <span className="text-emerald-600 dark:text-emerald-400">무제한</span>
                        ) : (
                          <span className="text-surface-500">
                            {reward.claimedCount}/{reward.quantity}개 교환됨
                          </span>
                        )}
                        {reward.expiresAt && (
                          <span className="text-amber-600 dark:text-amber-400">
                            ~{new Date(reward.expiresAt).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>

                      {/* 진행률 바 */}
                      {!isUnlimited && (
                        <div className="mt-2">
                          <Progress value={progress} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 추가/수정 모달 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={handleCloseModal}
          />
          <div className="relative z-50 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {editingReward ? "리워드 수정" : "새 리워드 추가"}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  서포터에게 제공할 리워드를 설정합니다
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 리워드 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  리워드 유형 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REWARD_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: option.value }))}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                          formData.type === option.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          formData.type === option.value ? "text-primary-500" : "text-surface-400"
                        )} />
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            formData.type === option.value
                              ? "text-primary-700 dark:text-primary-300"
                              : "text-surface-700 dark:text-surface-300"
                          )}>
                            {option.label}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 기본 정보 */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  리워드 이름 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 프리미엄 1개월 이용권"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  설명 *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="리워드에 대한 상세 설명"
                  className="min-h-[80px]"
                />
              </div>

              {/* 포인트 및 수량 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    필요 포인트 *
                  </label>
                  <Input
                    type="number"
                    value={formData.pointsRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, pointsRequired: parseInt(e.target.value) || 0 }))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    수량 (-1: 무제한)
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    min={-1}
                  />
                </div>
              </div>

              {/* 만료일 */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  만료일 (선택)
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>

              {/* 리딤코드 전용 */}
              {formData.type === "redeem_code" && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    코드 프리픽스 (선택)
                  </label>
                  <Input
                    value={formData.codePrefix}
                    onChange={(e) => setFormData(prev => ({ ...prev, codePrefix: e.target.value.toUpperCase() }))}
                    placeholder="예: EARLY2024"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    발급되는 코드 형식: {formData.codePrefix || "CODE"}-XXXXXX
                  </p>
                </div>
              )}

              {/* 베타 액세스 전용 */}
              {formData.type === "beta_access" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      플랫폼 *
                    </label>
                    <div className="flex gap-2">
                      {PLATFORM_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, platform: option.value }))}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all",
                              formData.platform === option.value
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300"
                                : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                      테스트 참여 URL
                    </label>
                    <Input
                      value={formData.accessUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessUrl: e.target.value }))}
                      placeholder="https://testflight.apple.com/join/..."
                    />
                  </div>
                </>
              )}

              {/* 활성화 상태 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  리워드 활성화 (비활성화 시 사용자에게 표시되지 않음)
                </span>
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={handleCloseModal}>
                취소
              </Button>
              <Button 
                className="flex-1" 
                disabled={!formData.title || !formData.description || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "저장 중..." : editingReward ? "수정하기" : "추가하기"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative z-50 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  리워드 삭제
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              정말로 이 리워드를 삭제하시겠습니까? 이미 교환된 리워드는 유지됩니다.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                취소
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => handleDelete(deleteConfirm)}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}







