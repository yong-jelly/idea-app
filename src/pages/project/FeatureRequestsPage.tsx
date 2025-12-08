import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Plus, Filter } from "lucide-react";
import { Button, Card, Select, Dialog, DialogContent } from "@/shared/ui";
import { useProjectStore, type FeatureRequestStatus } from "@/entities/project";
import { FeatureRequestForm, FeatureRequestCard } from "@/features/project";

const statusFilters: Array<{ value: FeatureRequestStatus | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기중" },
  { value: "reviewing", label: "검토중" },
  { value: "accepted", label: "수락됨" },
  { value: "rejected", label: "거절됨" },
  { value: "completed", label: "완료됨" },
];

export function FeatureRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const { getProject, getProjectFeatureRequests, toggleFeatureVote } = useProjectStore();
  
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeatureRequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"votes" | "newest">("votes");

  const project = getProject(id || "");
  const featureRequests = getProjectFeatureRequests(id || "");

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          프로젝트를 찾을 수 없습니다
        </h1>
        <Link to="/explore">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            탐색으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const filteredRequests = featureRequests
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "votes") return b.votesCount - a.votesCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/project/${project.id}`}
          className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {project.title}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              기능 제안
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              원하는 기능을 제안하고 투표하세요
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            기능 제안하기
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeatureRequestStatus | "all")}
            className="w-32"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </Select>
        </div>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "votes" | "newest")}
          className="w-32"
        >
          <option value="votes">인기순</option>
          <option value="newest">최신순</option>
        </Select>
      </div>

      {/* Feature Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <FeatureRequestCard
              key={request.id}
              request={request}
              onVote={toggleFeatureVote}
            />
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              {statusFilter === "all"
                ? "아직 기능 제안이 없습니다"
                : `${statusFilters.find((f) => f.value === statusFilter)?.label} 상태의 제안이 없습니다`}
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              첫 번째 기능 제안하기
            </Button>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <FeatureRequestForm
            projectId={project.id}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

