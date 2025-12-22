import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit, X, Coins, AlertCircle, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button, Card, CardContent, Badge, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { type PointRule, type PointActivityType, POINT_ACTIVITY_INFO } from "@/entities/project";

interface PointRuleManagePanelProps {
  rules: PointRule[];
  projectId: string;
  onUpdate: (id: string, updates: Partial<PointRule>) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function PointRuleManagePanel({ rules, projectId, onUpdate, onToggleActive }: PointRuleManagePanelProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ points: number; maxPerDay?: number }>({ points: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (rule: PointRule) => {
    setEditingRule(rule.id);
    setEditValues({ points: rule.points, maxPerDay: rule.maxPerDay });
  };

  const handleSave = async (ruleId: string) => {
    setIsSubmitting(true);
    try {
      await onUpdate(ruleId, editValues);
      setEditingRule(null);
    } catch (error) {
      console.error("Failed to update rule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingRule(null);
    setEditValues({ points: 0 });
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          포인트 규칙 설정
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          활동별로 적립되는 포인트를 설정합니다
        </p>
      </div>

      {/* 규칙 목록 */}
      <div className="space-y-2">
        {rules.map((rule) => {
          const activityInfo = POINT_ACTIVITY_INFO[rule.activityType];
          if (!activityInfo) return null;

          const isEditing = editingRule === rule.id;

          return (
            <Card 
              key={rule.id}
              className={cn(!rule.isActive && "opacity-60")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* 아이콘 */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-2xl shrink-0">
                    {activityInfo.icon}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-surface-900 dark:text-surface-50">
                        {activityInfo.label}
                      </h4>
                      {!rule.isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          비활성
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {activityInfo.description}
                    </p>
                  </div>

                  {/* 포인트 설정 */}
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="block text-xs text-surface-500 mb-0.5">포인트</label>
                          <Input
                            type="number"
                            value={editValues.points}
                            onChange={(e) => setEditValues(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                            className="w-20 h-8 text-sm"
                            min={0}
                          />
                        </div>
                        {rule.maxPerDay !== undefined && (
                          <div>
                            <label className="block text-xs text-surface-500 mb-0.5">일일 한도</label>
                            <Input
                              type="number"
                              value={editValues.maxPerDay || 0}
                              onChange={(e) => setEditValues(prev => ({ ...prev, maxPerDay: parseInt(e.target.value) || undefined }))}
                              className="w-20 h-8 text-sm"
                              min={0}
                            />
                          </div>
                        )}
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSave(rule.id)}
                            disabled={isSubmitting}
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4 text-surface-400" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">
                            +{rule.points} P
                          </p>
                          {rule.maxPerDay && (
                            <p className="text-xs text-surface-500">
                              일일 {rule.maxPerDay}회
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(rule)}
                          >
                            <Edit className="h-4 w-4 text-surface-400" />
                          </Button>
                          <button
                            onClick={() => onToggleActive(rule.id, !rule.isActive)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              rule.isActive 
                                ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
                                : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                            )}
                          >
                            {rule.isActive ? (
                              <ToggleRight className="h-6 w-6" />
                            ) : (
                              <ToggleLeft className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 안내 */}
      <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-surface-400 mt-0.5 shrink-0" />
          <div className="text-sm text-surface-500 dark:text-surface-400">
            <p>포인트 규칙을 변경하면 이후 활동부터 적용됩니다.</p>
            <p className="mt-1">비활성화된 규칙은 포인트가 적립되지 않습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}







