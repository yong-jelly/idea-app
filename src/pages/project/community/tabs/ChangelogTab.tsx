/**
 * 변경사항(Changelog) 탭 컴포넌트
 * 
 * 프로젝트의 릴리즈 노트와 변경사항을 관리하는 탭입니다.
 * - 버전별 변경사항 작성 및 관리
 * - 새 기능, 개선, 수정, Breaking Changes 분류
 * - 저장소 및 다운로드 링크 추가
 * - ChangelogCard 컴포넌트를 사용하여 변경사항 표시
 */
import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Loader2,
} from "lucide-react";
import { Button, Card, CardContent } from "@/shared/ui";
import { ChangelogCard } from "../components/ChangelogCard";
import { ChangelogModal } from "@/widgets/modal/changelog.modal";
import type { ChangelogEntry } from "../types";
import {
  fetchChangelogs,
  deleteChangelog,
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

  // 초기 데이터 로드
  useEffect(() => {
    loadChangelogs();
  }, [projectId]);

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
    } else {
      setEditingChangelog(null);
    }
    setIsModalOpen(true);
  };

  /**
   * 모달 저장 후 콜백 - 변경사항 목록 새로고침
   */
  const handleModalSave = useCallback(async () => {
    await loadChangelogs();
  }, []);

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


  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">
          {isLoading ? "로딩 중..." : `총 ${changelogs.length}개의 릴리즈`}
        </p>
        {isOwner && (
          <Button size="sm" onClick={() => handleOpenModal()} disabled={isLoading} className="lg:px-3 px-2">
            <Plus className="h-4 w-4 lg:mr-1" />
            <span className="hidden lg:inline">변경사항 추가</span>
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
      <ChangelogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingChangelog={editingChangelog}
        projectId={projectId}
        isOwner={isOwner}
        onSave={handleModalSave}
        onDelete={handleDelete}
      />
    </div>
  );
}






