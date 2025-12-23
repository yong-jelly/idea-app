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
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Bookmark,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Card, CardContent, Textarea, Input } from "@/shared/ui";
import { cn, ensureMinDelay } from "@/shared/lib/utils";
import { useUserStore } from "@/entities/user";
import { fetchProjectDetail, type Project } from "@/entities/project";
import { supabase } from "@/shared/lib/supabase";
import { getProfileImageUrl, getImageUrl, uploadPostImages, extractStoragePath } from "@/shared/lib/storage";
import { DevPostCard } from "../components/DevPostCard";
import { DevPostCardSkeleton } from "../components/DevPostCardSkeleton";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [formData, setFormData] = useState({
    type: "announcement" as "announcement" | "update" | "vote",
    title: "",
    content: "",
    isPinned: false,
    images: [] as Array<{ file: File | null; preview: string }>, // 기존 이미지는 file이 null, preview는 URL
    voteOptions: ["", ""] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
      // 기존 이미지를 preview로 설정 (file은 null)
      const existingImages = (post.images || []).map((url) => ({
        file: null as File | null,
        preview: url,
      }));
      setFormData({
        type: post.type as "announcement" | "update" | "vote",
        title: post.title,
        content: post.content,
        isPinned: post.isPinned || false,
        images: existingImages,
        voteOptions: post.voteOptions?.map(opt => opt.text) || ["", ""],
      });
    } else {
      setEditingPost(null);
      setFormData({ 
        type: "announcement", 
        title: "", 
        content: "", 
        isPinned: false, 
        images: [], 
        voteOptions: ["", ""] 
      });
    }
    setIsModalOpen(true);
  };

  /**
   * 이미지 업로드 핸들러
   * 최대 5개까지 업로드 가능
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const MAX_IMAGES = 5;
    const remainingSlots = MAX_IMAGES - formData.images.length;
    
    if (remainingSlots <= 0) {
      alert(`최대 ${MAX_IMAGES}개까지 추가할 수 있습니다.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    // 새 파일들을 preview와 함께 추가
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, { file, preview: reader.result as string }].slice(0, MAX_IMAGES),
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * 이미지 제거 핸들러
   */
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /**
   * 포스트 저장 핸들러
   * 새 포스트 추가 또는 기존 포스트 수정
   */
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    if (!isProjectAuthor || !projectId || !user) return;
    
    // 투표 타입일 때 최소 2개의 유효한 옵션 필요
    if (formData.type === "vote") {
      const validOptions = formData.voteOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert("투표 옵션은 최소 2개 이상 필요합니다.");
        return;
      }
    }

    setIsSubmitting(true);
    setIsUploadingImages(formData.images.length > 0);

    try {
      // Supabase Auth에서 현재 사용자의 auth_id 가져오기
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        alert("로그인이 필요합니다.");
        setIsSubmitting(false);
        setIsUploadingImages(false);
        return;
      }

      if (editingPost) {
        // 포스트 수정
        // 기존 이미지: file이 null이고 preview가 있는 경우 (Storage URL에서 경로 추출)
        const existingImagePaths = formData.images
          .filter((img) => img.file === null && img.preview)
          .map((img) => {
            // preview가 Storage URL이면 경로 추출, 이미 경로면 그대로 사용
            // 외부 URL인 경우는 그대로 유지 (extractStoragePath가 외부 URL이면 그대로 반환)
            return extractStoragePath(img.preview);
          });
        
        // 새로 업로드할 이미지 파일만 필터링
        const newImageFiles = formData.images
          .filter((img) => img.file !== null)
          .map((img) => img.file as File);
        
        let allImagePaths: string[] = [...existingImagePaths];
        
        // 새 이미지가 있으면 업로드
        if (newImageFiles.length > 0) {
          setIsUploadingImages(true);
          const { paths, error: uploadError } = await uploadPostImages(
            newImageFiles,
            authUser.id,
            editingPost.id
          );

          if (uploadError) {
            alert(`이미지 업로드 실패: ${uploadError.message}`);
            setIsSubmitting(false);
            setIsUploadingImages(false);
            return;
          }

          // 기존 이미지 경로와 새로 업로드한 경로를 합침
          allImagePaths = [...existingImagePaths, ...paths];
        }

        // 이미지가 모두 제거된 경우 빈 배열 또는 null 전달 (둘 다 "모든 이미지 제거" 의미)
        // SQL 함수에서 NULL과 빈 배열 둘 다 빈 배열로 처리하므로, 빈 배열로 통일
        const finalImages = allImagePaths.length > 0 ? allImagePaths : [];

        const { error } = await supabase
          .schema("odd")
          .rpc("v1_update_community_post", {
            p_post_id: editingPost.id,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: finalImages,
            p_is_pinned: formData.isPinned,
            p_vote_options: formData.type === "vote" ? formData.voteOptions.filter(opt => opt.trim()) : null,
          });

        if (error) {
          console.error("포스트 수정 실패:", error);
          alert(`포스트 수정 실패: ${error.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      } else {
        // 새 포스트 생성: 먼저 포스트를 생성하고, 실제 포스트 ID로 이미지를 업로드
        const { data: postId, error: createError } = await supabase
          .schema("odd")
          .rpc("v1_create_community_post", {
            p_project_id: projectId,
            p_post_type: formData.type,
            p_title: formData.title.trim(),
            p_content: formData.content.trim(),
            p_images: [], // 먼저 빈 배열로 생성
            p_is_pinned: formData.isPinned,
            p_vote_options: formData.type === "vote" ? formData.voteOptions.filter(opt => opt.trim()) : null,
          });

        if (createError) {
          console.error("포스트 생성 실패:", createError);
          alert(`포스트 생성 실패: ${createError.message}`);
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }

        // 포스트 생성 후 실제 포스트 ID로 이미지 업로드
        // 새 포스트 생성 시에는 모든 이미지가 File 객체
        const newImageFiles = formData.images
          .filter((img) => img.file !== null)
          .map((img) => img.file as File);
        
        if (newImageFiles.length > 0 && postId) {
          setIsUploadingImages(true);
          const { paths, error: uploadError } = await uploadPostImages(
            newImageFiles,
            authUser.id,
            postId
          );

          if (uploadError) {
            console.error("이미지 업로드 실패:", uploadError);
            alert(`이미지 업로드 실패: ${uploadError.message}`);
            // 포스트는 이미 생성되었으므로 계속 진행
          } else if (paths.length > 0) {
            // 이미지 경로를 포스트에 업데이트
            const { error: updateError } = await supabase
              .schema("odd")
              .from("tbl_posts")
              .update({ images: paths })
              .eq("id", postId);

            if (updateError) {
              console.error("이미지 경로 업데이트 실패:", updateError);
              // 이미지는 업로드되었지만 경로 업데이트 실패 - 경고만 표시
            }
          }
        }
      }

      // 포스트 목록 새로고침
      setIsModalOpen(false);
      setPostOffset(0);
      await loadPosts(0, false);
    } catch (err) {
      console.error("포스트 저장 에러:", err);
      alert("포스트 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

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
          <Button size="sm" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-1" />
            공지 작성
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
                    {editingPost ? "공지 수정" : "공지 작성"}
                  </h1>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={
                    isSubmitting ||
                    isUploadingImages ||
                    !formData.title.trim() || 
                    !formData.content.trim() ||
                    (formData.type === "vote" && formData.voteOptions.filter(opt => opt.trim()).length < 2)
                  }
                  className="rounded-full"
                >
                  {isUploadingImages ? "이미지 업로드 중..." : isSubmitting ? "저장 중..." : editingPost ? "저장" : "작성"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 고정하기 옵션 */}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isPinned: !prev.isPinned }))}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className={cn(
                      "relative w-9 h-5 rounded-full transition-colors",
                      formData.isPinned
                        ? "bg-primary-500"
                        : "bg-surface-200 dark:bg-surface-700"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        formData.isPinned ? "translate-x-4" : "translate-x-0.5"
                      )} />
                    </div>
                    <Bookmark className={cn("h-4 w-4", formData.isPinned ? "text-primary-500" : "text-surface-400")} />
                    <span className={cn("font-medium", formData.isPinned ? "text-surface-900 dark:text-surface-50" : "text-surface-500")}>
                      상단에 고정
                    </span>
                  </button>

                  {/* 타입 선택 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      타입 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["announcement", "update", "vote"] as const).map((type) => {
                        const info = POST_TYPE_INFO[type];
                        const Icon = info.icon;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type }))}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                              formData.type === type
                                ? cn(info.color, info.borderColor)
                                : "border-transparent bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {info.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 제목 입력 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="공지 제목을 입력하세요"
                      maxLength={100}
                      disabled={isSubmitting || isUploadingImages}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>

                  {/* 내용 입력 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      내용 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder={formData.type === "vote" ? "투표에 대한 설명을 작성해주세요" : "공지 내용을 작성해주세요"}
                      maxLength={3000}
                      rows={formData.type === "vote" ? 4 : 8}
                      disabled={isSubmitting || isUploadingImages}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.content.length}/3000
                    </p>
                  </div>

                  {/* 투표 옵션 (투표 타입일 때만) */}
                  {formData.type === "vote" && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        투표 항목 <span className="text-red-500">*</span>
                        <span className="text-surface-400 font-normal ml-1">(최소 2개, 최대 5개)</span>
                      </label>
                      <div className="space-y-2">
                        {formData.voteOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-medium text-surface-500">
                              {index + 1}
                            </span>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...formData.voteOptions];
                                newOptions[index] = e.target.value;
                                setFormData((prev) => ({ ...prev, voteOptions: newOptions }));
                              }}
                              placeholder={`옵션 ${index + 1}`}
                              maxLength={50}
                              className="flex-1"
                              disabled={isSubmitting || isUploadingImages}
                            />
                            {/* 최소 2개는 유지해야 하므로 2개 이상일 때만 삭제 가능 */}
                            {formData.voteOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = formData.voteOptions.filter((_, i) => i !== index);
                                  setFormData((prev) => ({ ...prev, voteOptions: newOptions }));
                                }}
                                className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                disabled={isSubmitting || isUploadingImages}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* 최대 5개까지 추가 가능 */}
                      {formData.voteOptions.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              voteOptions: [...prev.voteOptions, ""],
                            }));
                          }}
                          className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                          disabled={isSubmitting || isUploadingImages}
                        >
                          <Plus className="h-4 w-4" />
                          옵션 추가
                        </button>
                      )}
                    </div>
                  )}

                  {/* 이미지 업로드 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      이미지 (최대 5개)
                    </label>
                    
                    {/* 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.images.map((image, index) => {
                          // preview는 이미 DataURL 또는 URL로 생성되어 있음
                          // URL.createObjectURL을 사용하지 않아도 됨
                          return (
                            <div key={index} className="relative">
                              <img
                                src={image.preview}
                                alt={`첨부 이미지 ${index + 1}`}
                                className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                                disabled={isSubmitting || isUploadingImages}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* 이미지 업로드 버튼 */}
                    {formData.images.length < 5 && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isSubmitting || isUploadingImages}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg text-surface-500 hover:border-primary-300 hover:text-primary-500 dark:hover:border-primary-700 transition-colors"
                          disabled={isSubmitting || isUploadingImages}
                        >
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm">이미지 추가 ({formData.images.length}/5)</span>
                        </button>
                      </>
                    )}
                    <p className="text-xs text-surface-400">
                      스크린샷이나 관련 이미지를 첨부할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 푸터 - 삭제 버튼 (수정 모드에서만) */}
              {editingPost && (
                <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDelete(editingPost.id);
                      setIsModalOpen(false);
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    disabled={isSubmitting || isUploadingImages}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    공지 삭제
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
