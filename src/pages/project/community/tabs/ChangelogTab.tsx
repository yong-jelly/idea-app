/**
 * 변경사항(Changelog) 탭 컴포넌트
 * 
 * 프로젝트의 릴리즈 노트와 변경사항을 관리하는 탭입니다.
 * - 버전별 변경사항 작성 및 관리
 * - 새 기능, 개선, 수정, Breaking Changes 분류
 * - 저장소 및 다운로드 링크 추가
 * - ChangelogCard 컴포넌트를 사용하여 변경사항 표시
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Github,
  Download,
  Sparkles,
  ThumbsUp,
  Bug,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button, Card, CardContent, Input, Textarea } from "@/shared/ui";
import { ChangelogCard } from "../components/ChangelogCard";
import type { ChangelogEntry, ChangelogChange } from "../types";
import {
  fetchChangelogs,
  createChangelog,
  updateChangelog,
  deleteChangelog,
  type CreateChangelogData,
  type UpdateChangelogData,
} from "@/entities/project/api/project.api";

interface ChangelogTabProps {
  projectId: string;
  isOwner?: boolean;
}

export function ChangelogTab({ projectId, isOwner = false }: ChangelogTabProps) {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<ChangelogEntry | null>(null);
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

  // 초기 데이터 로드
  useEffect(() => {
    loadChangelogs();
  }, [projectId]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  /**
   * 변경사항 목록 로드
   */
  const loadChangelogs = async () => {
    setIsLoading(true);
    setError(null);
    
    const { changelogs: data, error: err } = await fetchChangelogs(projectId);
    
    if (err) {
      setError(err);
      setIsLoading(false);
      return;
    }
    
    setChangelogs(data);
    setIsLoading(false);
  };

  /**
   * 모달 열기 핸들러
   * @param changelog - 수정할 변경사항 (없으면 새로 작성)
   */
  const handleOpenModal = (changelog?: ChangelogEntry) => {
    if (changelog) {
      setEditingChangelog(changelog);
      // 기존 changes를 타입별로 분류
      const features = changelog.changes.filter(c => c.type === "feature").map(c => ({ id: c.id, description: c.description }));
      const improvements = changelog.changes.filter(c => c.type === "improvement").map(c => ({ id: c.id, description: c.description }));
      const fixes = changelog.changes.filter(c => c.type === "fix").map(c => ({ id: c.id, description: c.description }));
      const breakings = changelog.changes.filter(c => c.type === "breaking").map(c => ({ id: c.id, description: c.description }));
      
      setFormData({
        version: changelog.version,
        title: changelog.title,
        description: changelog.description,
        repositoryUrl: changelog.repositoryUrl || "",
        downloadUrl: changelog.downloadUrl || "",
        features: features.length > 0 ? features : [{ id: `f-${Date.now()}`, description: "" }],
        improvements: improvements.length > 0 ? improvements : [{ id: `i-${Date.now()}`, description: "" }],
        fixes: fixes.length > 0 ? fixes : [{ id: `x-${Date.now()}`, description: "" }],
        breakings,
      });
    } else {
      setEditingChangelog(null);
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
    setIsModalOpen(true);
  };

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

        // 목록 새로고침
        await loadChangelogs();
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

        // 목록 새로고침
        await loadChangelogs();
      }

      setIsModalOpen(false);
      setIsSaving(false);
    } catch (err) {
      console.error("변경사항 저장 에러:", err);
      alert("변경사항 저장 중 오류가 발생했습니다");
      setIsSaving(false);
    }
  };

  /**
   * 변경사항 삭제 핸들러
   */
  const handleDelete = async (changelogId: string) => {
    if (!isOwner) return;
    if (!confirm("정말 이 변경사항을 삭제하시겠습니까?")) return;

    const { success, error: err } = await deleteChangelog(changelogId);
    
    if (!success || err) {
      alert(err?.message || "변경사항 삭제에 실패했습니다");
      return;
    }

    // 목록 새로고침
    await loadChangelogs();
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

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">
          {isLoading ? "로딩 중..." : `총 ${changelogs.length}개의 릴리즈`}
        </p>
        {isOwner && (
          <Button size="sm" onClick={() => handleOpenModal()} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-1" />
            변경사항 추가
          </Button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Card className="mb-4 border-rose-200 dark:border-rose-800">
          <CardContent className="py-4">
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {error.message || "변경사항을 불러오는데 실패했습니다"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadChangelogs}
              className="mt-2"
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 로딩 상태 */}
      {isLoading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600 animate-spin" />
            <p className="text-surface-500 dark:text-surface-400">
              변경사항을 불러오는 중...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 변경사항 목록 */}
      {!isLoading && !error && (
        changelogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
              <p className="text-surface-500 dark:text-surface-400">
                아직 변경사항이 없습니다
              </p>
              {isOwner && (
                <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-1" />
                  첫 변경사항 추가
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {changelogs.map((entry) => (
              <ChangelogCard 
                key={entry.id} 
                entry={entry} 
                {...(isOwner && {
                  onEdit: () => handleOpenModal(entry),
                  onDelete: () => handleDelete(entry.id),
                })}
              />
            ))}
          </div>
        )
      )}

      {/* 변경사항 작성/수정 모달 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />

          {/* 모달 컨테이너 */}
          <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
            <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
              
              {/* 헤더 */}
              <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
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
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-surface-400 shrink-0" />
                        <Input
                          value={formData.downloadUrl}
                          onChange={(e) => setFormData((prev) => ({ ...prev, downloadUrl: e.target.value }))}
                          placeholder="다운로드 URL (선택)"
                          className="text-sm"
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
                          />
                          {formData.features.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChangeItem("features", item.id)}
                              className="p-1 text-surface-400 hover:text-rose-500"
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
                          />
                          {formData.improvements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChangeItem("improvements", item.id)}
                              className="p-1 text-surface-400 hover:text-rose-500"
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
                          />
                          {formData.fixes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChangeItem("fixes", item.id)}
                              className="p-1 text-surface-400 hover:text-rose-500"
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
                            />
                            <button
                              type="button"
                              onClick={() => removeChangeItem("breakings", item.id)}
                              className="p-1 text-surface-400 hover:text-rose-500"
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
                    onClick={() => {
                      handleDelete(editingChangelog.id);
                      setIsModalOpen(false);
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
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
      )}
    </div>
  );
}




