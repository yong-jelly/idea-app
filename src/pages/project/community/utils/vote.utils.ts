import type { VoteOption } from "../types";

/**
 * 투표 옵션 업데이트 함수
 * 투표/투표 취소/투표 변경 시 옵션의 투표 수를 업데이트합니다.
 */
export function updateVoteOptions(
  options: VoteOption[],
  selectedOptionId: string,
  previousOptionId?: string
): { options: VoteOption[]; totalVotes: number } {
  const isUnvote = selectedOptionId === previousOptionId;
  
  if (isUnvote) {
    // 투표 취소
    return {
      options: options.map((opt) =>
        opt.id === selectedOptionId ? { ...opt, votesCount: opt.votesCount - 1 } : opt
      ),
      totalVotes: -1,
    };
  } else {
    // 새 투표 또는 변경
    const updatedOptions = options.map((opt) => {
      if (opt.id === selectedOptionId) {
        return { ...opt, votesCount: opt.votesCount + 1 };
      }
      if (opt.id === previousOptionId) {
        return { ...opt, votesCount: opt.votesCount - 1 };
      }
      return opt;
    });
    
    return {
      options: updatedOptions,
      totalVotes: previousOptionId ? 0 : 1, // 변경이면 0, 새 투표면 1
    };
  }
}

