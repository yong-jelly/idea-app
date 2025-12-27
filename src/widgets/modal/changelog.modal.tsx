/**
 * 변경사항(Changelog) 작성/수정 모달 컴포넌트
 * 
 * 프로젝트의 릴리즈 노트와 변경사항을 작성하고 수정하는 모달입니다.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  X,
  Github,
  Download,
  Sparkles,
  ThumbsUp,
  Bug,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button, Input, Textarea } from "@/shared/ui";
import type { ChangelogEntry, ChangelogChange } from "@/pages/project/community/types";
import {
  createChangelog,
  updateChangelog,
  type CreateChangelogData,
  type UpdateChangelogData,
} from "@/entities/project/api/project.api";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChangelog: ChangelogEntry | null;
  projectId: string;
  isOwner: boolean;
  onSave: () => void; // 저장 후 변경사항 목록 새로고침을 위한 콜백
  onDelete?: (changelogId: string) => void; // 삭제 핸들러
}

export function ChangelogModal({
  isOpen,
  onClose,
  editingChangelog,
  projectId,
  isOwner,
  onSave,
  onDelete,
}: ChangelogModalProps) {
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    repositoryUrl: "",
    downloadUrl: "",
    features: [{ id: `f-${Date.now()}`, description: "" }] as { id: string; description: string }[],
    improvements: [{ id: `i-${Date.now()}`, description: "" }] as { id: string; description: string }[],
    fixes: [{ id: `x-${Date.now()}`, description: "" }] as { id: string; description: string }[],
    breakings: [] as { id: string; description: string }[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // 모달이 열릴 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (editingChangelog) {
        // 기존 changes를 타입별로 분류
        const features = editingChangelog.changes.filter(c => c.type === "feature").map(c => ({ id: c.id, description: c.description }));
        const improvements = editingChangelog.changes.filter(c => c.type === "improvement").map(c => ({ id: c.id, description: c.description }));
        const fixes = editingChangelog.changes.filter(c => c.type === "fix").map(c => ({ id: c.id, description: c.description }));
        const breakings = editingChangelog.changes.filter(c => c.type === "breaking").map(c => ({ id: c.id, description: c.description }));
        
        setFormData({
          version: editingChangelog.version,
          title: editingChangelog.title,
          description: editingChangelog.description,
          repositoryUrl: editingChangelog.repositoryUrl || "",
          downloadUrl: editingChangelog.downloadUrl || "",
          features: features.length > 0 ? features : [{ id: `f-${Date.now()}`, description: "" }],
          improvements: improvements.length > 0 ? improvements : [{ id: `i-${Date.now()}`, description: "" }],
          fixes: fixes.length > 0 ? fixes : [{ id: `x-${Date.now()}`, description: "" }],
          breakings,
        });
      } else {
        setFormData({
          version: "",
          title: "",
          description: "",
          repositoryUrl: "",
          downloadUrl: "",
          features: [{ id: `f-${Date.now()}`, description: "" }],
          improvements: [{ id: `i-${Date.now()}`, description: "" }],
          fixes: [{ id: `x-${Date.now()}`, description: "" }],
          breakings: [],
        });
      }
    }
  }, [isOpen, editingChangelog]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  /**
   * 변경사항 저장 핸들러
   * 모든 변경사항을 합쳐서 저장
   */
  const handleSave = async () => {
    if (!formData.version.trim() || !formData.title.trim()) return;
    if (!isOwner) return;

    setIsSaving(true);

    // 모든 변경사항 합치기
    const changes: ChangelogChange[] = [
      ...formData.features.filter(f => f.description.trim()).map(f => ({ id: f.id, type: "feature" as const, description: f.description })),
      ...formData.improvements.filter(i => i.description.trim()).map(i => ({ id: i.id, type: "improvement" as const, description: i.description })),
      ...formData.fixes.filter(x => x.description.trim()).map(x => ({ id: x.id, type: "fix" as const, description: x.description })),
      ...formData.breakings.filter(b => b.description.trim()).map(b => ({ id: b.id, type: "breaking" as const, description: b.description })),
    ];

    try {
      if (editingChangelog) {
        // 수정
        const updateData: UpdateChangelogData = {
          version: formData.version.trim(),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          changes,
          releasedAt: editingChangelog.releasedAt,
          repositoryUrl: formData.repositoryUrl.trim() || undefined,
          downloadUrl: formData.downloadUrl.trim() || undefined,
        };

        const { success, error: err } = await updateChangelog(editingChangelog.id, updateData);
        
        if (!success || err) {
          alert(err?.message || "변경사항 수정에 실패했습니다");
          setIsSaving(false);
          return;
        }
      } else {
        // 새 변경사항 추가
        const createData: CreateChangelogData = {
          version: formData.version.trim(),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          changes,
          releasedAt: new Date().toISOString().split("T")[0],
          repositoryUrl: formData.repositoryUrl.trim() || undefined,
          downloadUrl: formData.downloadUrl.trim() || undefined,
        };

        const { changelogId, error: err } = await createChangelog(projectId, createData);
        
        if (!changelogId || err) {
          alert(err?.message || "변경사항 생성에 실패했습니다");
          setIsSaving(false);
          return;
        }
      }

      // 변경사항 목록 새로고침을 위한 콜백 호출
      onClose();
      onSave();
    } catch (err) {
      console.error("변경사항 저장 에러:", err);
      alert("변경사항 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = () => {
    if (!editingChangelog || !onDelete) return;
    
    if (!confirm("정말 이 변경사항을 삭제하시겠습니까?")) {
      return;
    }
    
    onDelete(editingChangelog.id);
    onClose();
  };

  /**
   * 변경사항 항목 추가 핸들러
   */
  const addChangeItem = (type: "features" | "improvements" | "fixes" | "breakings") => {
    const prefix = type === "features" ? "f" : type === "improvements" ? "i" : type === "fixes" ? "x" : "b";
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { id: `${prefix}-${Date.now()}`, description: "" }],
    }));
  };

  /**
   * 변경사항 항목 업데이트 핸들러
   */
  const updateChangeItem = (type: "features" | "improvements" | "fixes" | "breakings", id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((item) => (item.id === id ? { ...item, description: value } : item)),
    }));
  };

  /**
   * 변경사항 항목 제거 핸들러
   */
  const removeChangeItem = (type: "features" | "improvements" | "fixes" | "breakings", id: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
          
          {/* 헤더 */}
          <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </button>
              <h1 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {editingChangelog ? "변경사항 수정" : "변경사항 추가"}
              </h1>
            </div>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={!formData.version.trim() || !formData.title.trim() || isSaving}
              className="rounded-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  저장 중...
                </>
              ) : (
                editingChangelog ? "저장" : "추가"
              )}
            </Button>
          </header>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6">
              {/* 버전 & 제목 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    버전 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                    placeholder="v1.0.0"
                    maxLength={20}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 새로운 기능 출시"
                    maxLength={50}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  설명
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="이번 릴리즈에 대한 간단한 설명"
                  maxLength={200}
                  rows={2}
                  disabled={isSaving}
                />
              </div>

              {/* 링크 (저장소, 다운로드) */}
              <div className="space-y-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">링크</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-surface-400 shrink-0" />
                    <Input
                      value={formData.repositoryUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))}
                      placeholder="저장소 URL (선택)"
                      className="text-sm"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-surface-400 shrink-0" />
                    <Input
                      value={formData.downloadUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, downloadUrl: e.target.value }))}
                      placeholder="다운로드 URL (선택)"
                      className="text-sm"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* 새 기능 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    새 기능
                  </label>
                  <button
                    type="button"
                    onClick={() => addChangeItem("features")}
                    className="text-xs text-primary-500 hover:text-primary-600"
                    disabled={isSaving}
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateChangeItem("features", item.id, e.target.value)}
                        placeholder={`새 기능 ${index + 1}`}
                        className="text-sm"
                        disabled={isSaving}
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChangeItem("features", item.id)}
                          className="p-1 text-surface-400 hover:text-rose-500"
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 개선 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    개선
                  </label>
                  <button
                    type="button"
                    onClick={() => addChangeItem("improvements")}
                    className="text-xs text-primary-500 hover:text-primary-600"
                    disabled={isSaving}
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.improvements.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateChangeItem("improvements", item.id, e.target.value)}
                        placeholder={`개선 사항 ${index + 1}`}
                        className="text-sm"
                        disabled={isSaving}
                      />
                      {formData.improvements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChangeItem("improvements", item.id)}
                          className="p-1 text-surface-400 hover:text-rose-500"
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 수정(버그 수정) 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Bug className="h-4 w-4" />
                    수정
                  </label>
                  <button
                    type="button"
                    onClick={() => addChangeItem("fixes")}
                    className="text-xs text-primary-500 hover:text-primary-600"
                    disabled={isSaving}
                  >
                    + 추가
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.fixes.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateChangeItem("fixes", item.id, e.target.value)}
                        placeholder={`버그 수정 ${index + 1}`}
                        className="text-sm"
                        disabled={isSaving}
                      />
                      {formData.fixes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChangeItem("fixes", item.id)}
                          className="p-1 text-surface-400 hover:text-rose-500"
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 주의 (Breaking Changes) 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    주의 (Breaking Changes)
                  </label>
                  <button
                    type="button"
                    onClick={() => addChangeItem("breakings")}
                    className="text-xs text-primary-500 hover:text-primary-600"
                    disabled={isSaving}
                  >
                    + 추가
                  </button>
                </div>
                {formData.breakings.length === 0 ? (
                  <p className="text-xs text-surface-400 py-2">
                    호환성을 깨는 변경사항이 있으면 추가하세요
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.breakings.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateChangeItem("breakings", item.id, e.target.value)}
                          placeholder={`주의 사항 ${index + 1}`}
                          className="text-sm"
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          onClick={() => removeChangeItem("breakings", item.id)}
                          className="p-1 text-surface-400 hover:text-rose-500"
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 푸터 - 삭제 버튼 (수정 모드에서만) */}
          {editingChangelog && (
            <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                변경사항 삭제
              </Button>
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

