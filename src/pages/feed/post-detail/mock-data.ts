/**
 * PostDetailPage 데모용 목 데이터
 * TODO: API 연동 시 제거 예정
 */
import type { RawComment } from "./types";

/**
 * 데모용 댓글 데이터 (대댓글 포함)
 */
export const initialComments: RawComment[] = [
  {
    id: "c1",
    depth: 0,
    author: {
      id: "10",
      username: "dev_mentor",
      displayName: "개발멘토",
      avatar: undefined,
    },
    content: "축하합니다! 정말 대단한 성과네요. 🎉",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likesCount: 12,
    isLiked: false,
  },
  {
    id: "c1-1",
    parentId: "c1",
    depth: 1,
    replyTo: { username: "dev_mentor", displayName: "개발멘토" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "감사합니다! 앞으로도 열심히 하겠습니다 💪",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    likesCount: 5,
    isLiked: true,
  },
  {
    id: "c1-2",
    parentId: "c1-1",
    depth: 2,
    replyTo: { username: "indie_dev", displayName: "김인디" },
    author: {
      id: "10",
      username: "dev_mentor",
      displayName: "개발멘토",
      avatar: undefined,
    },
    content: "화이팅입니다! 다음 업데이트도 기대할게요 😊",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    likesCount: 3,
    isLiked: false,
  },
  {
    id: "c1-3",
    parentId: "c1-2",
    depth: 2,
    replyTo: { username: "dev_mentor", displayName: "개발멘토" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "네, 열심히 준비하고 있어요! 곧 새로운 기능을 공개할 예정입니다 🚀",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likesCount: 7,
    isLiked: false,
  },
  {
    id: "c2",
    depth: 0,
    author: {
      id: "11",
      username: "react_master",
      displayName: "리액트마스터",
      avatar: undefined,
    },
    content: "저도 비슷한 프로젝트를 진행 중인데, 어떤 기술 스택을 사용하셨나요? 공유해주시면 감사하겠습니다!",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likesCount: 8,
    isLiked: true,
  },
  {
    id: "c2-1",
    parentId: "c2",
    depth: 1,
    replyTo: { username: "react_master", displayName: "리액트마스터" },
    author: {
      id: "1",
      username: "indie_dev",
      displayName: "김인디",
      avatar: undefined,
    },
    content: "React + TypeScript + Tailwind CSS를 메인으로 사용했고, 백엔드는 Bun으로 구성했어요!",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    likesCount: 15,
    isLiked: false,
  },
  {
    id: "c3",
    depth: 0,
    author: {
      id: "12",
      username: "newbie_coder",
      displayName: "코딩뉴비",
      avatar: undefined,
    },
    content: "인디 개발자로서 정말 영감이 됩니다. 화이팅입니다! 💪",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    likesCount: 5,
    isLiked: false,
  },
];

