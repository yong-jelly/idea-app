import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, X, Search, Crown, Users, Star, FlaskConical, HandHeart,
  MoreHorizontal, Trash2, AlertCircle, Check
} from "lucide-react";
import { Button, Card, CardContent, Badge, Input, Avatar } from "@/shared/ui";
import { cn, formatRelativeTime } from "@/shared/lib/utils";
import { type ProjectRole, type UserProjectRole, PROJECT_ROLE_INFO } from "@/entities/user";

interface ProjectMember {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: ProjectRole;
  assignedAt: string;
  points?: number;
  feedbackCount?: number;
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  points: number;
}

interface UserRoleManagerProps {
  members: ProjectMember[];
  projectId: string;
  onAddMember: (userId: string, role: ProjectRole) => Promise<void>;
  onUpdateRole: (userId: string, role: ProjectRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
}

const ROLE_OPTIONS: { value: ProjectRole; label: string; icon: typeof Crown; color: string; description: string }[] = [
  { value: "team_member", label: "팀원", icon: Users, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/30", description: "프로젝트 팀 멤버" },
  { value: "official_supporter", label: "공식 서포터", icon: Star, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30", description: "선정된 공식 서포터" },
  { value: "beta_tester", label: "베타 테스터", icon: FlaskConical, color: "text-violet-500 bg-violet-50 dark:bg-violet-900/30", description: "베타 테스트 참여자" },
  { value: "contributor", label: "기여자", icon: HandHeart, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30", description: "프로젝트 기여자" },
];

export function UserRoleManager({ members, projectId, onAddMember, onUpdateRole, onRemoveMember, searchUsers }: UserRoleManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("official_supporter");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProjectRole | "all">("all");

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      // 이미 멤버인 사람 제외
      const existingIds = new Set(members.map(m => m.userId));
      setSearchResults(results.filter(r => !existingIds.has(r.id)));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await onAddMember(selectedUser.id, selectedRole);
      setIsModalOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await onRemoveMember(userId);
      setRemoveConfirm(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    try {
      await onUpdateRole(userId, newRole);
      setActiveMenu(null);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  // 역할별 필터링
  const filteredMembers = filter === "all" 
    ? members 
    : members.filter(m => m.role === filter);

  // 역할별 그룹화
  const groupedMembers: Record<ProjectRole, ProjectMember[]> = {
    owner: members.filter(m => m.role === "owner"),
    team_member: members.filter(m => m.role === "team_member"),
    official_supporter: members.filter(m => m.role === "official_supporter"),
    beta_tester: members.filter(m => m.role === "beta_tester"),
    contributor: members.filter(m => m.role === "contributor"),
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            멤버 및 역할 관리
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            총 {members.length}명의 멤버
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          멤버 추가
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
            filter === "all"
              ? "bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400"
          )}
        >
          전체 ({members.length})
        </button>
        {ROLE_OPTIONS.map((option) => {
          const count = groupedMembers[option.value]?.length || 0;
          return (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                filter === option.value
                  ? "bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400"
              )}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {/* 멤버 목록 */}
      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
              <p className="text-surface-500 dark:text-surface-400">
                {filter === "all" ? "아직 등록된 멤버가 없습니다" : "해당 역할의 멤버가 없습니다"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => {
            const roleInfo = PROJECT_ROLE_INFO[member.role];
            const isOwner = member.role === "owner";

            return (
              <Card key={member.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* 아바타 */}
                    <Avatar
                      src={member.avatar}
                      fallback={member.displayName}
                      size="md"
                    />

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-surface-50">
                          {member.displayName}
                        </span>
                        <span className="text-sm text-surface-500">
                          @{member.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px]", roleInfo?.color)}>
                          <span className="mr-1">{roleInfo?.icon}</span>
                          {roleInfo?.label}
                        </Badge>
                        <span className="text-xs text-surface-400">
                          {formatRelativeTime(member.assignedAt)}에 추가됨
                        </span>
                      </div>
                      {(member.points !== undefined || member.feedbackCount !== undefined) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                          {member.points !== undefined && <span>{member.points} P</span>}
                          {member.feedbackCount !== undefined && <span>피드백 {member.feedbackCount}개</span>}
                        </div>
                      )}
                    </div>

                    {/* 액션 */}
                    {!isOwner && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setActiveMenu(activeMenu === member.userId ? null : member.userId)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {activeMenu === member.userId && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white dark:bg-surface-800 shadow-lg border border-surface-200 dark:border-surface-700 py-1 z-20">
                              <div className="px-3 py-1.5 text-xs text-surface-500 border-b border-surface-100 dark:border-surface-700">
                                역할 변경
                              </div>
                              {ROLE_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = member.role === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => handleUpdateRole(member.userId, option.value)}
                                    className={cn(
                                      "flex items-center gap-2 w-full px-3 py-2 text-sm",
                                      isSelected 
                                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300" 
                                        : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                    {option.label}
                                    {isSelected && <Check className="h-4 w-4 ml-auto" />}
                                  </button>
                                );
                              })}
                              <div className="border-t border-surface-100 dark:border-surface-700 mt-1 pt-1">
                                <button
                                  onClick={() => {
                                    setRemoveConfirm(member.userId);
                                    setActiveMenu(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  멤버 제거
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 멤버 추가 모달 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  멤버 추가
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  사용자를 검색하여 역할을 부여합니다
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <X className="h-5 w-5 text-surface-400" />
              </button>
            </div>

            {/* 사용자 검색 */}
            {!selectedUser ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="사용자 이름 또는 아이디 검색"
                    className="pl-9"
                  />
                </div>

                {/* 검색 결과 */}
                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1 border border-surface-200 dark:border-surface-700 rounded-lg">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Avatar
                          src={user.avatar}
                          fallback={user.displayName}
                          size="sm"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-surface-900 dark:text-surface-50">
                            {user.displayName}
                          </p>
                          <p className="text-sm text-surface-500">
                            @{user.username} · {user.points} P
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <p className="text-center text-sm text-surface-500 py-4">
                    검색 결과가 없습니다
                  </p>
                )}

                {isSearching && (
                  <p className="text-center text-sm text-surface-500 py-4">
                    검색 중...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 선택된 사용자 */}
                <Card className="bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={selectedUser.avatar}
                        fallback={selectedUser.displayName}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-surface-900 dark:text-surface-50">
                          {selectedUser.displayName}
                        </p>
                        <p className="text-sm text-surface-500">
                          @{selectedUser.username}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                      >
                        변경
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 역할 선택 */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    부여할 역할
                  </label>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedRole(option.value)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left",
                            selectedRole === option.value
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                              : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                          )}
                        >
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            option.color
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium",
                              selectedRole === option.value
                                ? "text-primary-700 dark:text-primary-300"
                                : "text-surface-700 dark:text-surface-300"
                            )}>
                              {option.label}
                            </p>
                            <p className="text-xs text-surface-500">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button 
                className="flex-1" 
                disabled={!selectedUser || isSubmitting}
                onClick={handleAddMember}
              >
                {isSubmitting ? "추가 중..." : "멤버 추가"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 제거 확인 모달 */}
      {removeConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setRemoveConfirm(null)}
          />
          <div className="relative z-50 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  멤버 제거
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              이 멤버를 프로젝트에서 제거하시겠습니까? 역할 및 관련 권한이 모두 삭제됩니다.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveConfirm(null)}>
                취소
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => handleRemoveMember(removeConfirm)}
              >
                제거
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}






