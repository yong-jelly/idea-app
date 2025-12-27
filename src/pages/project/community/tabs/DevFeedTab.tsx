/**
 * 개발사 피드(공지사항) 탭 컴포넌트
 * 
 * 프로젝트 개발팀이 공지사항, 업데이트, 투표를 작성하고 관리하는 탭입니다.
 * - 공지사항, 업데이트, 투표 타입 지원
 * - 상단 고정 기능
 * - 투표 기능 (최소 2개, 최대 5개 옵션)
 * - 이미지 첨부 기능 (최대 5개)
 * - DevPostCard 컴포넌트를 사용하여 포스트 표시
 * - 댓글 시스템 (이미지 첨부 지원)
 * 
 * 권한: 프로젝트 생성자만 공지 작성/수정/삭제 가능
 */
import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
} from "lucide-react";
import { Button, Card, CardContent } from "@/shared/ui";
import { cn, ensureMinDelay } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { fetchProjectDetail, type Project } from "@/entities/project";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl } from "@/shared/lib/storage";
import { DevPostCard } from "../components/DevPostCard";
import { DevPostCardSkeleton } from "../components/DevPostCardSkeleton";
import { AnnounceModal } from "@/widgets/modal/announce.modal";
import type { DevPost, VoteOption } from "../types";
import { POST_TYPE_INFO } from "../constants";

interface DevFeedTabProps {
  projectId: string;
}

const POSTS_PER_PAGE = 30;

/**
 * DB 포스트를 DevPost로 변환
 */
function convertPostToDevPost(row: any, projectAuthorId: string): DevPost {
  const isProjectAuthor = String(row.author_id) === projectAuthorId;
  
  // 투표 옵션 파싱 (SQL에서 votesCount로 반환하지만, camelCase/snake_case 모두 지원)
  const voteOptions: VoteOption[] | undefined = row.vote_options 
    ? (row.vote_options as any[]).map((opt: any) => {
        // votesCount 또는 votes_count 모두 지원
        const votesCount = opt.votesCount ?? opt.votes_count;
        // Number()로 변환하되, 0도 유효한 값이므로 || 0을 사용하지 않음
        const parsedVotesCount = votesCount != null ? Number(votesCount) : 0;
        
        // 디버깅: 각 옵션 데이터 확인
        if (parsedVotesCount === 0 && votesCount != null && votesCount !== 0) {
          console.warn("투표 옵션 파싱 오류:", {
            opt,
            votesCount,
            parsedVotesCount,
          });
        }
        
        return {
          id: String(opt.id), // UUID를 문자열로 변환
          text: opt.text || opt.option_text || "",
          votesCount: parsedVotesCount,
        };
      })
    : undefined;
  
  // 이미지 URL 변환 (Storage 경로를 URL로)
  // jsonb 배열을 처리 (Supabase가 자동으로 파싱하지만, 빈 배열이나 null 체크 필요)
  let imageUrls: string[] | undefined = undefined;
  if (row.images) {
    // jsonb가 배열로 파싱된 경우
    if (Array.isArray(row.images) && row.images.length > 0) {
      const filteredUrls = row.images
        .map((path: string) => {
          // null이나 빈 문자열 체크
          if (!path || typeof path !== 'string') {
            return null;
          }
          // 이미 URL인 경우 그대로 반환
          if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
          }
          // Storage 경로인 경우 URL로 변환
          return getImageUrl(path);
        })
        .filter((url: string | null): url is string => url !== null);
      
      // 필터링 후 빈 배열이 아니면 설정
      if (filteredUrls.length > 0) {
        imageUrls = filteredUrls;
      }
    }
  }
  
  return {
    id: row.id,
    type: (row.post_type || "announcement") as "announcement" | "update" | "vote",
    title: row.title || "",
    content: row.content,
    images: imageUrls,
    author: {
      id: String(row.author_id),
      username: row.author_username || "",
      displayName: row.author_display_name || "",
      avatar: row.author_avatar_url ? getProfileImageUrl(row.author_avatar_url, "sm") : undefined,
      role: isProjectAuthor ? "Maker" : "",
    },
    isPinned: row.is_pinned || false,
    likesCount: row.likes_count || 0,
    isLiked: row.is_liked || false,
    commentsCount: row.comments_count || 0,
    createdAt: row.created_at,
    comments: [], // 댓글은 DevPostCard에서 별도로 로드
    voteOptions,
    // voted_option_id는 UUID이므로 문자열로 변환
    votedOptionId: row.voted_option_id ? String(row.voted_option_id) : undefined,
    // total_votes가 null이면 각 옵션의 합계로 계산
    totalVotes: row.total_votes != null 
      ? Number(row.total_votes) 
      : (voteOptions ? voteOptions.reduce((sum, opt) => sum + (opt.votesCount || 0), 0) : 0),
  };
}

export function DevFeedTab({ projectId }: DevFeedTabProps) {
  const { user } = useUserStore();
  
  // 프로젝트 정보 (권한 체크용)
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  
  // 포스트 목록
  const [posts, setPosts] = useState<DevPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postOffset, setPostOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  
  // 필터 및 모달 상태
  const [filter, setFilter] = useState<"all" | "announcement" | "update" | "vote">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DevPost | null>(null);

  // 프로젝트 생성자 여부 확인
  const isProjectAuthor = project && user && String(project.author.id) === user.id;

  // 프로젝트 정보 로드
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      setIsLoadingProject(true);
      const { overview, error } = await fetchProjectDetail(projectId);
      
      if (error) {
        console.error("프로젝트 조회 실패:", error);
        setIsLoadingProject(false);
        return;
      }
      
      setProject(overview.project);
      setIsLoadingProject(false);
    };
    
    loadProject();
  }, [projectId]);

  // 포스트 목록 로드 (페이징 지원)
  const loadPosts = useCallback(async (offset: number = 0, append: boolean = false, postFilter?: typeof filter) => {
    if (!projectId) return;

    const currentFilter = postFilter ?? filter;

    if (!append) {
      setIsLoadingPosts(true);
    }

    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_fetch_community_posts", {
          p_project_id: projectId,
          p_post_type: currentFilter === "all" ? null : currentFilter,
          p_limit: POSTS_PER_PAGE,
          p_offset: offset,
        });

      if (error) {
        console.error("포스트 조회 실패:", error);
        if (!append) {
          setIsLoadingPosts(false);
        }
        return;
      }

      // 프로젝트 정보가 필요하므로 먼저 로드되어야 함
      if (!project || !project.author.id) {
        if (!append) {
          setIsLoadingPosts(false);
        }
        return;
      }

      // 최소 로딩 지연 시간 보장 (0.3~0.7초) - 탭 이동 시에만 적용
      // 데이터가 없을 때도 지연을 적용하여 일관된 UX 제공
      if (!append) {
        await ensureMinDelay(startTime, { min: 300, max: 700 });
      }

      if (!data || data.length === 0) {
        if (append) {
          setHasMorePosts(false);
        } else {
          setPosts([]);
          setHasMorePosts(false);
        }
        if (!append) {
          setIsLoadingPosts(false);
        }
        return;
      }

      const projectAuthorId: string = project.author.id;
      const devPosts: DevPost[] = data.map((row: any) =>
        convertPostToDevPost(row, projectAuthorId)
      );

      if (append) {
        setPosts((prev) => [...prev, ...devPosts]);
      } else {
        setPosts(devPosts);
      }

      setPostOffset(offset + devPosts.length);
      setHasMorePosts(devPosts.length === POSTS_PER_PAGE);
    } catch (err) {
      console.error("포스트 조회 에러:", err);
    } finally {
      if (!append) {
        setIsLoadingPosts(false);
      }
    }
  }, [projectId, filter, project]);

  // 프로젝트 정보와 필터가 변경되면 포스트 로드
  useEffect(() => {
    if (!projectId || !project?.id) return;

    setPostOffset(0);
    loadPosts(0, false);
  }, [projectId, project?.id, filter, loadPosts]);

  // 필터링된 포스트 목록
  const filteredPosts = filter === "all" 
    ? posts 
    : posts.filter((p) => p.type === filter);

  // 고정된 게시물을 상단에 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  /**
   * 모달 열기 핸들러
   * @param post - 수정할 포스트 (없으면 새로 작성)
   */
  const handleOpenModal = (post?: DevPost) => {
    if (!isProjectAuthor) {
      alert("프로젝트 생성자만 공지를 작성할 수 있습니다.");
      return;
    }

    if (post) {
      setEditingPost(post);
    } else {
      setEditingPost(null);
    }
    setIsModalOpen(true);
  };

  /**
   * 모달 저장 후 콜백 - 포스트 목록 새로고침
   */
  const handleModalSave = useCallback(async () => {
    setPostOffset(0);
    await loadPosts(0, false);
  }, [loadPosts]);

  /**
   * 포스트 삭제 핸들러
   */
  const handleDelete = async (postId: string) => {
    if (!isProjectAuthor) {
      alert("프로젝트 생성자만 공지를 삭제할 수 있습니다.");
      return;
    }

    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // Soft delete using RPC function
      const { error } = await supabase
        .schema("odd")
        .rpc("v1_delete_community_post", {
          p_post_id: postId,
        });

      if (error) {
        console.error("포스트 삭제 실패:", error);
        alert(`포스트 삭제 실패: ${error.message}`);
        return;
      }

      // 포스트 목록에서 제거
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      
      if (editingPost && editingPost.id === postId) {
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("포스트 삭제 에러:", err);
      alert("포스트 삭제 중 오류가 발생했습니다.");
    }
  };

  /**
   * 포스트 고정/고정 해제 핸들러
   */
  const handleTogglePin = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!isProjectAuthor) {
      alert("프로젝트 생성자만 공지를 고정할 수 있습니다.");
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      const { error } = await supabase
        .schema("odd")
        .from("tbl_posts")
        .update({ is_pinned: !post.isPinned })
        .eq("id", postId);

      if (error) {
        console.error("포스트 고정 실패:", error);
        alert(`포스트 고정 실패: ${error.message}`);
        return;
      }

      // 포스트 목록 업데이트
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isPinned: !p.isPinned } : p
        )
      );
    } catch (err) {
      console.error("포스트 고정 에러:", err);
      alert("포스트 고정 중 오류가 발생했습니다.");
    }
  };

  /**
   * 투표 응답 핸들러
   */
  const handleVote = async (postId: string, voteOptionId: string) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 현재 포스트 찾기
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost || currentPost.type !== "vote") return;

    // 낙관적 업데이트: 즉시 UI 반영
    // 원본 값 저장 (롤백용)
    const previousVotedOptionId = currentPost.votedOptionId;
    const previousTotalVotes = currentPost.totalVotes || 0;
    
    // 모든 ID를 String으로 통일하여 비교 (타입 불일치 방지)
    const voteOptionIdStr = String(voteOptionId);
    const previousVotedOptionIdStr = previousVotedOptionId ? String(previousVotedOptionId) : null;
    
    // 디버깅: ID 비교 값 확인
    console.log("투표 ID 비교:", {
      voteOptionId,
      voteOptionIdStr,
      previousVotedOptionId: currentPost.votedOptionId,
      previousVotedOptionIdStr,
      optionIds: currentPost.voteOptions?.map(opt => ({ id: opt.id, type: typeof opt.id })),
    });
    
    // 투표 옵션 업데이트
    const updatedVoteOptions = (currentPost.voteOptions || []).map((opt) => {
      const optIdStr = String(opt.id);
      const isNewSelection = optIdStr === voteOptionIdStr;
      const isPreviousSelection = previousVotedOptionIdStr ? optIdStr === previousVotedOptionIdStr : false;
      
      // 디버깅: 각 옵션별 비교 결과
      console.log(`옵션 ${opt.text} 비교:`, {
        optId: opt.id,
        optIdStr,
        isNewSelection,
        isPreviousSelection,
        currentVotesCount: opt.votesCount,
      });
      
      if (isNewSelection && isPreviousSelection) {
        // 같은 옵션을 다시 클릭한 경우: 투표 취소
        const newCount = Math.max(0, opt.votesCount - 1);
        console.log(`  -> 같은 옵션 재클릭 (취소): ${opt.votesCount} -> ${newCount}`);
        return { ...opt, votesCount: newCount };
      } else if (isNewSelection && !isPreviousSelection) {
        // 새 옵션 선택: +1
        const newCount = opt.votesCount + 1;
        console.log(`  -> 새 옵션 선택: ${opt.votesCount} -> ${newCount}`);
        return { ...opt, votesCount: newCount };
      } else if (!isNewSelection && isPreviousSelection) {
        // 이전 선택 취소: -1
        const newCount = Math.max(0, opt.votesCount - 1);
        console.log(`  -> 이전 선택 취소: ${opt.votesCount} -> ${newCount}`);
        return { ...opt, votesCount: newCount };
      } else {
        // 변경 없음
        return opt;
      }
    });

    // totalVotes는 각 옵션의 votesCount 합계로 계산 (정확성 보장)
    // 같은 옵션을 다시 클릭하면 선택 해제, 다른 옵션이면 새 옵션으로 변경
    const newVotedOptionId = previousVotedOptionIdStr === voteOptionIdStr ? undefined : voteOptionIdStr;
    const newTotalVotes = updatedVoteOptions.reduce((sum, opt) => sum + (opt.votesCount || 0), 0);

    // 디버깅: 낙관적 업데이트 값 확인
    console.log("낙관적 업데이트 결과:", {
      postId,
      previousVotedOptionIdStr,
      newVotedOptionId,
      previousTotalVotes,
      newTotalVotes,
      updatedVoteOptions: updatedVoteOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        votesCount: opt.votesCount,
      })),
    });

    // 즉시 UI 업데이트 - 완전히 새로운 객체로 생성하여 React가 변경 감지하도록
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            voteOptions: [...updatedVoteOptions], // 새 배열로 생성
            votedOptionId: newVotedOptionId,
            totalVotes: newTotalVotes,
          };
        }
        return p;
      });
      return updated;
    });

    try {
      // API 호출 - 업데이트된 포스트 정보를 반환받음
      const { data, error } = await supabase
        .schema("odd")
        .rpc("v1_create_vote_response", {
          p_post_id: postId,
          p_vote_option_id: voteOptionId,
        });

      if (error) {
        console.error("투표 실패:", error);
        // 에러 발생 시 이전 상태로 롤백
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  voteOptions: currentPost.voteOptions,
                  votedOptionId: previousVotedOptionId,
                  totalVotes: previousTotalVotes,
                }
              : p
          )
        );
        alert(`투표 실패: ${error.message}`);
        return;
      }

      // API 응답으로 받은 포스트 정보로 업데이트
      if (data && project?.author.id) {
        // 디버깅: 원본 API 응답 확인
        console.log("투표 API 응답:", {
          rawData: data,
          vote_options: data.vote_options,
          total_votes: data.total_votes,
          voted_option_id: data.voted_option_id,
        });
        
        // vote_options의 각 옵션 데이터 확인
        if (data.vote_options && Array.isArray(data.vote_options)) {
          console.log("API 응답 vote_options 상세:", data.vote_options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votesCount: opt.votesCount,
            votes_count: opt.votes_count,
            raw: opt,
          })));
        }
        
        const projectAuthorId: string = project.author.id;
        const updatedPost = convertPostToDevPost(data, projectAuthorId);
        
        // 디버깅: 변환된 포스트 데이터 확인
        console.log("변환된 포스트:", {
          voteOptions: updatedPost.voteOptions,
          totalVotes: updatedPost.totalVotes,
          votedOptionId: updatedPost.votedOptionId,
        });
        
        // 디버깅: 투표 데이터 확인
        if (updatedPost.type === "vote" && updatedPost.voteOptions) {
          const calculatedTotal = updatedPost.voteOptions.reduce(
            (sum, opt) => sum + (opt.votesCount || 0), 
            0
          );
          console.log("투표 계산:", {
            calculatedTotal,
            totalVotes: updatedPost.totalVotes,
            voteOptions: updatedPost.voteOptions.map(opt => ({
              id: opt.id,
              text: opt.text,
              votesCount: opt.votesCount,
            })),
          });
          
          // 항상 각 옵션의 합계로 totalVotes 재계산 (서버 계산 오류 대비)
          updatedPost.totalVotes = calculatedTotal;
          
          if (calculatedTotal !== Number(data.total_votes)) {
            console.warn("서버와 클라이언트 투표 합계 불일치:", {
              calculatedTotal,
              serverTotalVotes: data.total_votes,
              voteOptions: updatedPost.voteOptions,
            });
          }
        }
        
        // 상태 업데이트 - 강제로 새 객체 생성하여 React가 변경 감지하도록
        setPosts((prev) => {
          const beforePost = prev.find(p => p.id === postId);
          const updated = prev.map((p) => {
            if (p.id === postId) {
              // 완전히 새로운 객체로 교체하여 React가 변경을 감지하도록
              const newPost = {
                ...updatedPost,
                voteOptions: updatedPost.voteOptions 
                  ? updatedPost.voteOptions.map(opt => ({ ...opt })) // 각 옵션도 새 객체로
                  : undefined,
              };
              console.log("상태 업데이트:", {
                postId,
                before: beforePost ? {
                  totalVotes: beforePost.totalVotes,
                  votedOptionId: beforePost.votedOptionId,
                  voteOptions: beforePost.voteOptions?.map(opt => ({
                    id: opt.id,
                    votesCount: opt.votesCount,
                  })),
                } : null,
                after: {
                  totalVotes: newPost.totalVotes,
                  votedOptionId: newPost.votedOptionId,
                  voteOptions: newPost.voteOptions?.map(opt => ({
                    id: opt.id,
                    votesCount: opt.votesCount,
                  })),
                },
              });
              return newPost;
            }
            return p;
          });
          
          // 업데이트 후 실제 상태 확인
          const afterPost = updated.find(p => p.id === postId);
          console.log("업데이트 후 실제 상태:", {
            postId,
            totalVotes: afterPost?.totalVotes,
            votedOptionId: afterPost?.votedOptionId,
            voteOptions: afterPost?.voteOptions?.map(opt => ({
              id: opt.id,
              votesCount: opt.votesCount,
            })),
          });
          
          return updated;
        });
      }
    } catch (err) {
      console.error("투표 에러:", err);
      // 에러 발생 시 이전 상태로 롤백
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                voteOptions: currentPost.voteOptions,
                votedOptionId: previousVotedOptionId,
                totalVotes: previousTotalVotes,
              }
            : p
        )
      );
      alert("투표 중 오류가 발생했습니다.");
    }
  };

  /**
   * 더 보기 핸들러
   */
  const handleLoadMore = async () => {
    if (!hasMorePosts || isLoadingPosts) return;
    await loadPosts(postOffset, true);
  };

  // 초기 프로젝트 로딩일 때만 전체 로딩 화면 표시
  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-surface-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 및 액션 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["all", "announcement", "update", "vote"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              )}
            >
              {f === "all" ? "전체" : POST_TYPE_INFO[f].label}
            </button>
          ))}
        </div>
        {isProjectAuthor && (
          <Button size="sm" onClick={() => handleOpenModal()} className="lg:px-3 px-2">
            <Plus className="h-4 w-4 lg:mr-1" />
            <span className="hidden lg:inline">공지 작성</span>
          </Button>
        )}
      </div>

      {/* 포스트 목록 */}
      {isLoadingPosts ? (
        // 탭 변경 시 로딩 중: 스켈레톤 UI 표시
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <DevPostCardSkeleton key={index} />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 공지사항이 없습니다" : `${POST_TYPE_INFO[filter].label} 게시물이 없습니다`}
            </p>
            {isProjectAuthor && (
              <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                첫 공지 작성
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <DevPostCard 
                key={post.id} 
                post={post}
                projectAuthorId={project?.author.id || ""}
                onEdit={isProjectAuthor ? () => handleOpenModal(post) : undefined}
                onDelete={isProjectAuthor ? () => handleDelete(post.id) : undefined}
                onTogglePin={isProjectAuthor ? (e) => handleTogglePin(post.id, e) : undefined}
                onVote={post.type === "vote" ? (optionId) => handleVote(post.id, optionId) : undefined}
              />
            ))}
          </div>
          
          {/* 더 보기 버튼 */}
          {hasMorePosts && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingPosts}
              >
                {isLoadingPosts ? "로딩 중..." : "더 보기"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 공지 작성/수정 모달 */}
      <AnnounceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPost={editingPost}
        projectId={projectId}
        onSave={handleModalSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
