import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router";
import {
  Megaphone,
  MessageSquareText,
  Gift,
  Target,
  FileText,
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  Bug,
  Lightbulb,
  ThumbsUp,
  Send,
  Trophy,
  Coins,
  Calendar,
  Tag,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Plus,
  ChevronDown,
  ChevronUp,
  Reply,
  X,
  Milestone as MilestoneIcon,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  AlertCircle,
  Image as ImageIcon,
  Github,
  Download,
  Link2,
} from "lucide-react";
import { Button, Avatar, Badge, Textarea, Progress, Card, CardContent, CardHeader, CardTitle, Input } from "@/shared/ui";
import { cn, formatNumber, formatRelativeTime } from "@/shared/lib/utils";
import { useProjectStore, CATEGORY_INFO, type Milestone, type MilestoneTask, type Reward } from "@/entities/project";
import { useUserStore } from "@/entities/user";

// 타입 정의
interface PostComment {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: PostComment[];
}

interface VoteOption {
  id: string;
  text: string;
  votesCount: number;
}

interface DevPost {
  id: string;
  type: "announcement" | "update" | "discussion" | "vote";
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    role: string;
  };
  isPinned?: boolean;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  createdAt: string;
  comments?: PostComment[];
  // 투표 관련 필드
  voteOptions?: VoteOption[];
  votedOptionId?: string; // 현재 사용자가 투표한 옵션 ID
  totalVotes?: number;
}

interface UserFeedback {
  id: string;
  type: "bug" | "feature" | "improvement" | "question";
  title: string;
  content: string;
  images?: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  status: "open" | "in_progress" | "resolved" | "closed";
  votesCount: number;
  isVoted: boolean;
  commentsCount: number;
  createdAt: string;
}

interface ChangelogChange {
  id: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  description: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: ChangelogChange[];
  releasedAt: string;
  // 링크 정보
  repositoryUrl?: string;
  downloadUrl?: string;
}

// 더미 데이터
const dummyDevPosts: DevPost[] = [
  {
    id: "dp1",
    type: "announcement",
    title: "🎉 v2.0 베타 테스트 시작!",
    content: "안녕하세요! 드디어 v2.0 베타 버전을 공개합니다. 새로운 AI 기능과 개선된 UI를 체험해보세요. 베타 테스터 피드백을 기다립니다!",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    isPinned: true,
    likesCount: 45,
    isLiked: false,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    comments: [
      {
        id: "c1",
        author: { id: "u3", username: "early_adopter", displayName: "얼리어답터" },
        content: "드디어! 베타 테스트 신청은 어디서 하나요? 🙋‍♂️",
        likesCount: 12,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        replies: [
          {
            id: "c1-r1",
            author: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
            content: "@얼리어답터 설정 > 베타 프로그램에서 신청하실 수 있습니다! 감사합니다 🙏",
            likesCount: 8,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
          },
          {
            id: "c1-r2",
            author: { id: "u3", username: "early_adopter", displayName: "얼리어답터" },
            content: "감사합니다! 바로 신청했어요 ✨",
            likesCount: 3,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 17).toISOString(),
          },
        ],
      },
      {
        id: "c2",
        author: { id: "u4", username: "tech_lover", displayName: "테크러버" },
        content: "새로운 AI 기능이 기대됩니다! 어떤 모델을 사용하셨나요?",
        likesCount: 7,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
        replies: [
          {
            id: "c2-r1",
            author: { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
            content: "GPT-4 기반의 커스텀 모델을 사용했습니다. 응답 속도와 정확도를 최적화했어요!",
            likesCount: 15,
            isLiked: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
          },
        ],
      },
      {
        id: "c3",
        author: { id: "u5", username: "beta_tester", displayName: "베타테스터" },
        content: "UI 개선 너무 좋아요! 특히 다크모드가 눈이 편해졌어요 👀",
        likesCount: 21,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
    ],
  },
  {
    id: "dp2",
    type: "update",
    title: "서버 점검 안내 (12/10)",
    content: "12월 10일 새벽 2시부터 4시까지 서버 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    likesCount: 12,
    isLiked: false,
    commentsCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    comments: [
      {
        id: "c4",
        author: { id: "u6", username: "night_owl", displayName: "야행성개발자" },
        content: "새벽 2시라니... 제 코딩 타임인데 😅 그래도 감사합니다!",
        likesCount: 34,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 45).toISOString(),
        replies: [
          {
            id: "c4-r1",
            author: { id: "u1", username: "indiemaker", displayName: "인디메이커", role: "Founder" },
            content: "죄송해요 😅 가능한 빨리 끝내겠습니다!",
            likesCount: 5,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: "dp3",
    type: "discussion",
    title: "다음 기능 투표: 어떤 기능을 먼저 개발할까요?",
    content: "다음 업데이트에 추가할 기능을 고민 중입니다. 1) 다크모드 지원 2) 모바일 앱 3) API 확장. 여러분의 의견을 들려주세요!",
    author: {
      id: "u2",
      username: "dev_kim",
      displayName: "김개발",
      role: "Developer",
    },
    likesCount: 67,
    isLiked: true,
    commentsCount: 89,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    comments: [
      {
        id: "c5",
        author: { id: "u7", username: "mobile_first", displayName: "모바일퍼스트" },
        content: "모바일 앱이요! 출퇴근길에 쓰고 싶어요 📱",
        likesCount: 45,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
        replies: [
          {
            id: "c5-r1",
            author: { id: "u8", username: "dark_theme", displayName: "다크모드매니아" },
            content: "저는 다크모드가 더 급해요! 눈이 아파요 😭",
            likesCount: 38,
            isLiked: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
          },
          {
            id: "c5-r2",
            author: { id: "u9", username: "api_developer", displayName: "API개발자" },
            content: "API 확장 부탁드려요! 자동화하고 싶은 게 많습니다",
            likesCount: 29,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 65).toISOString(),
          },
        ],
      },
      {
        id: "c6",
        author: { id: "u2", username: "dev_kim", displayName: "김개발", role: "Developer" },
        content: "투표 결과를 정리하면: 다크모드 45%, 모바일 앱 35%, API 확장 20% 입니다! 다크모드부터 진행할게요 🌙",
        likesCount: 89,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      },
    ],
  },
  {
    id: "dp4",
    type: "vote",
    title: "🗳️ 다음 업데이트에 어떤 기능을 추가할까요?",
    content: "여러분의 의견을 듣고 싶습니다! 가장 원하는 기능에 투표해주세요.",
    author: {
      id: "u1",
      username: "indiemaker",
      displayName: "인디메이커",
      role: "Founder",
    },
    likesCount: 34,
    isLiked: false,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    voteOptions: [
      { id: "vo1", text: "다크모드 지원", votesCount: 45 },
      { id: "vo2", text: "모바일 앱 출시", votesCount: 38 },
      { id: "vo3", text: "API 확장", votesCount: 22 },
      { id: "vo4", text: "알림 기능 개선", votesCount: 18 },
    ],
    votedOptionId: undefined,
    totalVotes: 123,
  },
];

const dummyFeedback: UserFeedback[] = [
  {
    id: "fb1",
    type: "feature",
    title: "다국어 지원 요청",
    content: "영어, 일본어 등 다국어 지원이 되면 좋겠습니다. 해외 사용자들도 많이 관심을 가지고 있어요!",
    author: {
      id: "u3",
      username: "global_user",
      displayName: "글로벌유저",
    },
    status: "in_progress",
    votesCount: 156,
    isVoted: true,
    commentsCount: 34,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "fb2",
    type: "bug",
    title: "Safari에서 이미지 로딩 오류",
    content: "Safari 브라우저에서 이미지가 간헐적으로 로딩되지 않는 문제가 있습니다. 아래 스크린샷을 참고해주세요.",
    images: [
      "https://placehold.co/400x300/f8d7da/721c24?text=Safari+Error",
      "https://placehold.co/400x300/d4edda/155724?text=Expected",
    ],
    author: {
      id: "u4",
      username: "mac_user",
      displayName: "맥유저",
    },
    status: "resolved",
    votesCount: 23,
    isVoted: false,
    commentsCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "fb3",
    type: "improvement",
    title: "검색 기능 개선 제안",
    content: "현재 검색이 제목만 검색하는데, 내용도 함께 검색되면 좋겠습니다. 필터 기능도 추가해주세요!",
    author: {
      id: "u5",
      username: "power_user",
      displayName: "파워유저",
    },
    status: "open",
    votesCount: 89,
    isVoted: false,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const dummyMilestones: Milestone[] = [
  {
    id: "m1",
    projectId: "1",
    title: "v1.0 - MVP 출시",
    description: "핵심 기능을 포함한 최소 기능 제품 출시. 사용자 인증, 기본 CRUD, UI 디자인 완성.",
    dueDate: "2024-10-01",
    status: "closed",
    openIssuesCount: 0,
    closedIssuesCount: 5,
    tasks: [
      { id: "t1-1", milestoneId: "m1", title: "사용자 인증 시스템 구현", status: "done", createdAt: "2024-08-01T00:00:00Z", completedAt: "2024-08-15T00:00:00Z" },
      { id: "t1-2", milestoneId: "m1", title: "기본 CRUD API 개발", status: "done", createdAt: "2024-08-01T00:00:00Z", completedAt: "2024-08-20T00:00:00Z" },
      { id: "t1-3", milestoneId: "m1", title: "메인 UI 디자인", status: "done", createdAt: "2024-08-05T00:00:00Z", completedAt: "2024-09-01T00:00:00Z" },
      { id: "t1-4", milestoneId: "m1", title: "반응형 레이아웃 적용", status: "done", createdAt: "2024-08-10T00:00:00Z", completedAt: "2024-09-10T00:00:00Z" },
      { id: "t1-5", milestoneId: "m1", title: "배포 환경 설정", status: "done", createdAt: "2024-09-15T00:00:00Z", completedAt: "2024-09-28T00:00:00Z" },
    ],
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-09-28T00:00:00Z",
    closedAt: "2024-09-28T00:00:00Z",
  },
  {
    id: "m2",
    projectId: "1",
    title: "v1.5 - 베타 테스트",
    description: "1000명의 베타 테스터와 함께 제품 검증. 피드백 시스템 구축 및 버그 수정.",
    dueDate: "2024-12-15",
    status: "open",
    openIssuesCount: 3,
    closedIssuesCount: 4,
    tasks: [
      { id: "t2-1", milestoneId: "m2", title: "베타 테스터 모집 페이지", status: "done", createdAt: "2024-09-01T00:00:00Z", completedAt: "2024-09-15T00:00:00Z" },
      { id: "t2-2", milestoneId: "m2", title: "피드백 수집 시스템 구축", status: "done", createdAt: "2024-09-10T00:00:00Z", completedAt: "2024-10-01T00:00:00Z" },
      { id: "t2-3", milestoneId: "m2", title: "버그 리포트 기능", status: "done", createdAt: "2024-09-20T00:00:00Z", completedAt: "2024-10-15T00:00:00Z" },
      { id: "t2-4", milestoneId: "m2", title: "성능 모니터링 대시보드", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-11-01T00:00:00Z" },
      { id: "t2-5", milestoneId: "m2", title: "주요 버그 수정 (5건)", status: "todo", createdAt: "2024-11-01T00:00:00Z" },
      { id: "t2-6", milestoneId: "m2", title: "사용자 피드백 반영", status: "todo", createdAt: "2024-11-15T00:00:00Z" },
      { id: "t2-7", milestoneId: "m2", title: "베타 종료 보고서 작성", status: "todo", createdAt: "2024-12-01T00:00:00Z" },
    ],
    createdAt: "2024-09-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "m3",
    projectId: "1",
    title: "v2.0 - 정식 출시",
    description: "모든 기능이 완성된 정식 버전 출시. AI 기능 추가, 성능 최적화, 다국어 지원.",
    dueDate: "2025-03-01",
    status: "open",
    openIssuesCount: 5,
    closedIssuesCount: 1,
    tasks: [
      { id: "t3-1", milestoneId: "m3", title: "AI 추천 시스템 설계", status: "done", createdAt: "2024-10-01T00:00:00Z", completedAt: "2024-11-01T00:00:00Z" },
      { id: "t3-2", milestoneId: "m3", title: "AI 모델 학습 및 배포", status: "todo", createdAt: "2024-11-01T00:00:00Z" },
      { id: "t3-3", milestoneId: "m3", title: "다국어 지원 (영어, 일본어)", status: "todo", createdAt: "2024-11-15T00:00:00Z" },
      { id: "t3-4", milestoneId: "m3", title: "성능 최적화 (로딩 50% 감소)", status: "todo", createdAt: "2024-12-01T00:00:00Z" },
      { id: "t3-5", milestoneId: "m3", title: "마케팅 랜딩 페이지", status: "todo", createdAt: "2024-12-15T00:00:00Z" },
      { id: "t3-6", milestoneId: "m3", title: "프로덕션 배포 및 모니터링", status: "todo", createdAt: "2025-01-01T00:00:00Z" },
    ],
    createdAt: "2024-10-01T00:00:00Z",
    updatedAt: "2024-11-15T00:00:00Z",
  },
  {
    id: "m4",
    projectId: "1",
    title: "v0.9 - 프로토타입",
    description: "초기 프로토타입 버전. 컨셉 검증 및 초기 사용자 피드백 수집.",
    dueDate: "2024-07-15",
    status: "closed",
    openIssuesCount: 0,
    closedIssuesCount: 3,
    tasks: [
      { id: "t4-1", milestoneId: "m4", title: "와이어프레임 제작", status: "done", createdAt: "2024-06-01T00:00:00Z", completedAt: "2024-06-15T00:00:00Z" },
      { id: "t4-2", milestoneId: "m4", title: "프로토타입 개발", status: "done", createdAt: "2024-06-15T00:00:00Z", completedAt: "2024-07-01T00:00:00Z" },
      { id: "t4-3", milestoneId: "m4", title: "초기 사용자 인터뷰 (10명)", status: "done", createdAt: "2024-07-01T00:00:00Z", completedAt: "2024-07-10T00:00:00Z" },
    ],
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-07-10T00:00:00Z",
    closedAt: "2024-07-10T00:00:00Z",
  },
];

const dummyRewards: Reward[] = [
  {
    id: "r1",
    projectId: "1",
    title: "얼리버드 서포터",
    description: "프로젝트 초기 지원자를 위한 특별 보상",
    pointsRequired: 100,
    quantity: 500,
    claimedCount: 342,
    type: "digital",
  },
  {
    id: "r2",
    projectId: "1",
    title: "프리미엄 1개월 이용권",
    description: "프리미엄 기능을 1개월간 무료로 이용",
    pointsRequired: 500,
    quantity: 100,
    claimedCount: 78,
    type: "access",
  },
  {
    id: "r3",
    projectId: "1",
    title: "한정판 굿즈 세트",
    description: "스티커, 티셔츠, 머그컵 등 굿즈 세트",
    pointsRequired: 2000,
    quantity: 50,
    claimedCount: 12,
    type: "physical",
  },
];

const dummyChangelog: ChangelogEntry[] = [
  {
    id: "cl1",
    version: "2.0.0-beta",
    title: "v2.0 베타 릴리즈",
    description: "대규모 업데이트! AI 기능과 새로운 UI를 만나보세요.",
    changes: [
      { id: "ch1-1", type: "feature", description: "AI 기반 자동 추천 시스템 추가" },
      { id: "ch1-2", type: "feature", description: "다크모드 지원" },
      { id: "ch1-3", type: "feature", description: "실시간 알림 시스템" },
      { id: "ch1-4", type: "improvement", description: "전체 UI/UX 개선" },
      { id: "ch1-5", type: "improvement", description: "페이지 로딩 속도 50% 향상" },
      { id: "ch1-6", type: "improvement", description: "모바일 반응형 레이아웃 최적화" },
      { id: "ch1-7", type: "fix", description: "Safari 브라우저 호환성 문제 해결" },
      { id: "ch1-8", type: "breaking", description: "API v1 지원 종료 예정" },
    ],
    releasedAt: "2024-12-01",
    repositoryUrl: "https://github.com/example/project/releases/tag/v2.0.0-beta",
    downloadUrl: "https://example.com/downloads/v2.0.0-beta",
  },
  {
    id: "cl2",
    version: "1.5.2",
    title: "버그 수정 및 안정화",
    description: "여러 버그를 수정하고 안정성을 개선했습니다.",
    changes: [
      { id: "ch2-1", type: "fix", description: "Safari 이미지 로딩 오류 수정" },
      { id: "ch2-2", type: "fix", description: "모바일에서 스크롤 문제 해결" },
      { id: "ch2-3", type: "improvement", description: "에러 메시지 개선" },
    ],
    releasedAt: "2024-11-15",
    repositoryUrl: "https://github.com/example/project/releases/tag/v1.5.2",
  },
  {
    id: "cl3",
    version: "1.5.0",
    title: "검색 기능 강화",
    description: "더 강력해진 검색 기능을 사용해보세요.",
    changes: [
      { id: "ch3-1", type: "feature", description: "전체 텍스트 검색 지원" },
      { id: "ch3-2", type: "feature", description: "검색 필터 추가" },
      { id: "ch3-3", type: "breaking", description: "검색 API 엔드포인트 변경" },
    ],
    releasedAt: "2024-11-01",
  },
];

// 탭 타입
type TabType = "devfeed" | "feedback" | "rewards" | "milestones" | "changelog";

// 피드백 타입 정보
const FEEDBACK_TYPE_INFO = {
  bug: { label: "버그", icon: Bug, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
  feature: { label: "기능 요청", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  improvement: { label: "개선 제안", icon: Sparkles, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20" },
  question: { label: "질문", icon: MessageSquareText, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
};

const FEEDBACK_STATUS_INFO = {
  open: { label: "접수됨", color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
  in_progress: { label: "진행 중", color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  resolved: { label: "해결됨", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "닫힘", color: "bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400" },
};

// 댓글 컴포넌트
interface CommentItemProps {
  comment: PostComment;
  depth?: number;
  onReply: (parentId: string, content: string) => void;
  onLike: (commentId: string) => void;
}

function CommentItem({ comment, depth = 0, onReply, onLike }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
      setShowReplyInput(false);
    }
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-10")}>
      {/* Thread line */}
      {depth > 0 && (
        <div className="absolute -left-5 top-0 bottom-0 w-px bg-surface-200 dark:bg-surface-700" />
      )}
      
      <div className="flex gap-3 py-3">
        <Avatar fallback={comment.author.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-surface-900 dark:text-surface-50 text-sm">
              {comment.author.displayName}
            </span>
            {comment.author.role && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {comment.author.role}
              </Badge>
            )}
            <span className="text-xs text-surface-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-surface-700 dark:text-surface-300 text-sm whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                comment.isLiked
                  ? "text-rose-500"
                  : "text-surface-400 hover:text-rose-500"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")} />
              {comment.likesCount > 0 && formatNumber(comment.likesCount)}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-surface-400 hover:text-primary-500 transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              답글
            </button>
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
              >
                {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {comment.replies!.length}개의 답글
              </button>
            )}
          </div>
          
          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="min-h-[60px] text-sm flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleSubmitReply} disabled={!replyText.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReplyInput(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && showReplies && (
        <div className="relative">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 피드 포스트 카드 컴포넌트
interface DevPostCardProps {
  post: DevPost;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: (e?: React.MouseEvent) => void;
}

function DevPostCard({ post, onEdit, onDelete, onTogglePin }: DevPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const { user } = useUserStore();

  // 투표 관련 상태
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>(post.voteOptions || []);
  const [votedOptionId, setVotedOptionId] = useState<string | undefined>(post.votedOptionId);
  const [totalVotes, setTotalVotes] = useState(post.totalVotes || 0);

  const handleVote = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (votedOptionId === optionId) {
      // 투표 취소
      setVoteOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId ? { ...opt, votesCount: opt.votesCount - 1 } : opt
        )
      );
      setTotalVotes((prev) => prev - 1);
      setVotedOptionId(undefined);
    } else {
      // 새 투표 또는 변경
      setVoteOptions((prev) =>
        prev.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votesCount: opt.votesCount + 1 };
          }
          if (opt.id === votedOptionId) {
            return { ...opt, votesCount: opt.votesCount - 1 };
          }
          return opt;
        })
      );
      if (!votedOptionId) {
        setTotalVotes((prev) => prev + 1);
      }
      setVotedOptionId(optionId);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleCommentLike = (commentId: string) => {
    const updateLike = (items: PostComment[]): PostComment[] => {
      return items.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        if (item.replies) {
          return { ...item, replies: updateLike(item.replies) };
        }
        return item;
      });
    };
    setComments(updateLike(comments));
  };

  const handleReply = (parentId: string, content: string) => {
    const newReply: PostComment = {
      id: `reply-${Date.now()}`,
      author: {
        id: user?.id || "current",
        username: user?.username || "guest",
        displayName: user?.displayName || "게스트",
      },
      content,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    const addReply = (items: PostComment[]): PostComment[] => {
      return items.map((item) => {
        if (item.id === parentId) {
          return { ...item, replies: [...(item.replies || []), newReply] };
        }
        if (item.replies) {
          return { ...item, replies: addReply(item.replies) };
        }
        return item;
      });
    };
    setComments(addReply(comments));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: PostComment = {
      id: `comment-${Date.now()}`,
      author: {
        id: user?.id || "current",
        username: user?.username || "guest",
        displayName: user?.displayName || "게스트",
      },
      content: newComment,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const totalComments = comments.reduce((acc, c) => {
    return acc + 1 + (c.replies?.length || 0);
  }, 0);

  return (
    <Card className={cn(post.isPinned && "ring-2 ring-primary-200 dark:ring-primary-800")}>
      <CardContent className="p-0">
        {/* Post Header */}
        <div
          className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {post.isPinned && (
            <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mb-2">
              <Bookmark className="h-3 w-3 fill-current" />
              고정됨
            </div>
          )}
          <div className="flex items-start gap-3">
            <Avatar fallback={post.author.displayName} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-surface-900 dark:text-surface-50">
                  {post.author.displayName}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {post.author.role}
                </Badge>
                <span className="text-sm text-surface-400">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {post.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                {post.content}
              </p>
              
              {/* 투표 UI (투표 타입일 때만) */}
              {post.type === "vote" && voteOptions.length > 0 && (
                <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {voteOptions.map((option) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                    const isSelected = votedOptionId === option.id;
                    const hasVoted = !!votedOptionId;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={(e) => handleVote(option.id, e)}
                        className={cn(
                          "relative w-full text-left rounded-lg border-2 overflow-hidden transition-all",
                          isSelected
                            ? "border-primary-400 dark:border-primary-600"
                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                        )}
                      >
                        {/* 투표 진행률 바 (투표 후에만 표시) */}
                        {hasVoted && (
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 transition-all",
                              isSelected
                                ? "bg-primary-100 dark:bg-primary-900/30"
                                : "bg-surface-100 dark:bg-surface-800"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        
                        <div className="relative px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
                            )}
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-primary-700 dark:text-primary-300" : "text-surface-700 dark:text-surface-300"
                            )}>
                              {option.text}
                            </span>
                          </div>
                          {hasVoted && (
                            <span className={cn(
                              "text-sm font-semibold tabular-nums",
                              isSelected ? "text-primary-600 dark:text-primary-400" : "text-surface-500"
                            )}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  
                  <p className="text-xs text-surface-400 pt-1">
                    {totalVotes}명 투표 참여
                    {votedOptionId && " · 다시 클릭하면 투표 취소"}
                  </p>
                </div>
              )}
              
              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className={cn(
                    "flex items-center gap-1 text-sm transition-colors",
                    isLiked ? "text-rose-500" : "text-surface-500 hover:text-rose-500"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {formatNumber(likesCount)}
                </button>
                <button className={cn(
                  "flex items-center gap-1 text-sm transition-colors",
                  isExpanded ? "text-primary-500" : "text-surface-500 hover:text-primary-500"
                )}>
                  <MessageCircle className="h-4 w-4" />
                  {formatNumber(totalComments || post.commentsCount)}
                </button>
                
                {/* 관리 액션 버튼 */}
                {(onEdit || onDelete || onTogglePin) && (
                  <div className="ml-auto flex items-center gap-1">
                    {onTogglePin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(e);
                        }}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          post.isPinned
                            ? "text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                            : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                        )}
                        title={post.isPinned ? "고정 해제" : "상단 고정"}
                      >
                        <Bookmark className={cn("h-4 w-4", post.isPinned && "fill-current")} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                        className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {!onEdit && !onDelete && !onTogglePin && (
                  <span className="ml-auto text-surface-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Comments Section */}
        {isExpanded && (
          <div className="border-t border-surface-100 dark:border-surface-800">
            {/* Comment Input */}
            <div className="p-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex gap-3">
                <Avatar fallback={user?.displayName || "?"} size="sm" />
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 작성하세요..."
                    className="min-h-[60px] text-sm"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      댓글 작성
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="px-4 divide-y divide-surface-100 dark:divide-surface-800">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onLike={handleCommentLike}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-surface-400 text-sm">
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 마일스톤 탭 컴포넌트 - 테이블 기반 모던 UI
interface MilestonesTabProps {
  milestones: Milestone[];
  projectId: string;
}

function MilestonesTab({ milestones: initialMilestones, projectId }: MilestonesTabProps) {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.status === "open" && b.status === "closed") return -1;
    if (a.status === "closed" && b.status === "open") return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredMilestones = filter === "all" 
    ? sortedMilestones 
    : sortedMilestones.filter((m) => m.status === filter);
  
  const openCount = milestones.filter((m) => m.status === "open").length;
  const closedCount = milestones.filter((m) => m.status === "closed").length;

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

  const handleOpenModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate || "",
      });
    } else {
      setEditingMilestone(null);
      setFormData({ title: "", description: "", dueDate: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    if (editingMilestone) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === editingMilestone.id
            ? { ...m, ...formData, updatedAt: new Date().toISOString() }
            : m
        )
      );
    } else {
      const newMilestone: Milestone = {
        id: `m${Date.now()}`,
        projectId: "1",
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate || undefined,
        status: "open",
        openIssuesCount: 0,
        closedIssuesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMilestones((prev) => [newMilestone, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: m.status === "open" ? "closed" : "open",
              closedAt: m.status === "open" ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 이 목표를 삭제하시겠습니까?")) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    }
  };


  const getProgress = (m: Milestone) => {
    const total = m.openIssuesCount + m.closedIssuesCount;
    return total > 0 ? Math.round((m.closedIssuesCount / total) * 100) : 0;
  };

  const getDueLabel = (dueDate?: string, status?: string) => {
    if (!dueDate) return null;
    if (status === "closed") return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 지남`, isOverdue: true };
    if (diffDays === 0) return { label: "오늘", isOverdue: false };
    return { label: `D-${diffDays}`, isOverdue: false };
  };

  return (
    <div>
      {/* Header - 다른 탭들과 동일한 스타일 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { id: "all" as const, label: "전체" },
            { id: "open" as const, label: "진행 중" },
            { id: "closed" as const, label: "완료" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          새 목표
        </Button>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 목표가 없습니다" : filter === "open" ? "진행 중인 목표가 없습니다" : "완료된 목표가 없습니다"}
            </p>
            {(filter === "all" || filter === "open") && (
              <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                첫 목표 추가
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMilestones.map((milestone) => {
            const progress = getProgress(milestone);
            const dueLabel = getDueLabel(milestone.dueDate, milestone.status);

            return (
              <Card 
                key={milestone.id}
                className="transition-colors"
              >
                <CardContent className="p-0">
                  {/* Header - 클릭하면 상세 페이지로 이동 */}
                                  <div 
                                    className="p-4 cursor-pointer hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors"
                                    onClick={() => navigate(`/project/${projectId}/community/milestones/${milestone.id}`)}
                                  >
                    <div className="flex items-start gap-4">
                      {/* Progress Circle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(milestone.id);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors cursor-pointer",
                          milestone.status === "closed"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
                        )}
                      >
                        {milestone.status === "closed" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-bold">{progress}%</span>
                        )}
                        <span className="text-[10px] mt-0.5">
                          {milestone.status === "closed" ? "완료" : "진행률"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold text-surface-900 dark:text-surface-50",
                            milestone.status === "closed" && "line-through opacity-60"
                          )}>
                            {milestone.title}
                          </h3>
                          {milestone.status === "closed" && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">
                              완료됨
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-surface-400" />
                        </div>
                        
                        {milestone.description && (
                          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-1 mb-2">
                            {milestone.description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  milestone.status === "closed" 
                                    ? "bg-emerald-500" 
                                    : "bg-primary-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {milestone.closedIssuesCount}개 완료
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-surface-400" />
                            {milestone.openIssuesCount}개 남음
                          </span>
                          {milestone.dueDate && (
                            <span className={cn(
                              "flex items-center gap-1",
                              dueLabel?.isOverdue ? "text-rose-500" : ""
                            )}>
                              <Calendar className="h-3 w-3" />
                              {new Date(milestone.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                              {dueLabel && milestone.status === "open" && (
                                <span className={dueLabel.isOverdue ? "text-rose-500" : "text-surface-400"}>
                                  ({dueLabel.label})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(milestone);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(milestone.id);
                          }}
                          className="h-8 w-8 p-0 text-surface-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={milestone.status === "open" ? "primary" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(milestone.id);
                          }}
                          className="h-8 text-xs ml-1"
                        >
                          {milestone.status === "open" ? "완료" : "재개"}
                        </Button>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal - ProfileEditModal 패턴 */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* 배경 오버레이 */}
          <div
            className="hidden md:block fixed inset-0 bg-surface-950/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />

          {/* 모달 컨테이너 */}
          <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
            <div className="h-full w-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl bg-white dark:bg-surface-900 md:border md:border-surface-200 md:dark:border-surface-800 md:shadow-xl flex flex-col overflow-hidden">
              
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
                    {editingMilestone ? "목표 편집" : "새 목표"}
                  </h1>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={!formData.title.trim()}
                  className="rounded-full"
                >
                  {editingMilestone ? "저장" : "추가"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 목표 이름 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      목표 이름 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="예: v2.0 출시, 1000명 사용자 달성"
                      maxLength={50}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/50
                    </p>
                  </div>

                  {/* 기한 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      목표 기한
                    </label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  {/* 설명 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      설명
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="이 목표에 대해 간단히 설명해주세요"
                      maxLength={200}
                      rows={3}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.description.length}/200
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// 피드백 탭 컴포넌트
interface FeedbackTabProps {
  feedbacks: UserFeedback[];
  projectId: string;
}

function FeedbackTab({ feedbacks: initialFeedbacks, projectId }: FeedbackTabProps) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "improvement">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<UserFeedback | null>(null);
  const [formData, setFormData] = useState({
    type: "feature" as "bug" | "feature" | "improvement" | "question",
    title: "",
    content: "",
    images: [] as string[],
  });

  const filteredFeedbacks = filter === "all" 
    ? feedbacks 
    : feedbacks.filter((fb) => fb.type === filter);

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

  const handleOpenModal = (feedback?: UserFeedback) => {
    if (feedback) {
      setEditingFeedback(feedback);
      setFormData({
        type: feedback.type,
        title: feedback.title,
        content: feedback.content,
        images: feedback.images || [],
      });
    } else {
      setEditingFeedback(null);
      setFormData({ type: "feature", title: "", content: "", images: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingFeedback) {
      // 수정
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb.id === editingFeedback.id
            ? { ...fb, type: formData.type, title: formData.title, content: formData.content, images: formData.images.length > 0 ? formData.images : undefined }
            : fb
        )
      );
    } else {
      // 새 피드백 추가
      const newFeedback: UserFeedback = {
        id: `fb${Date.now()}`,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        images: formData.images.length > 0 ? formData.images : undefined,
        author: {
          id: user?.id || "current",
          username: user?.username || "guest",
          displayName: user?.displayName || "게스트",
        },
        status: "open",
        votesCount: 0,
        isVoted: false,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };
      setFeedbacks((prev) => [newFeedback, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (feedbackId: string) => {
    if (confirm("정말 이 피드백을 삭제하시겠습니까?")) {
      setFeedbacks((prev) => prev.filter((fb) => fb.id !== feedbackId));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 3 - formData.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string].slice(0, 3),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleVote = (feedbackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? { ...fb, isVoted: !fb.isVoted, votesCount: fb.isVoted ? fb.votesCount - 1 : fb.votesCount + 1 }
          : fb
      )
    );
  };

  return (
    <div>
      {/* Filter & Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["all", "feature", "bug", "improvement"] as const).map((f) => (
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
              {f === "all" ? "전체" : FEEDBACK_TYPE_INFO[f].label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          피드백 작성
        </Button>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquareText className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 피드백이 없습니다" : `${FEEDBACK_TYPE_INFO[filter].label} 피드백이 없습니다`}
            </p>
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              첫 피드백 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map((feedback) => {
            const typeInfo = FEEDBACK_TYPE_INFO[feedback.type];
            const statusInfo = FEEDBACK_STATUS_INFO[feedback.status];
            const TypeIcon = typeInfo.icon;
            const isOwner = feedback.author.id === user?.id || feedback.author.id === "current";

            return (
              <Card 
                key={feedback.id} 
                className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/project/${projectId}/community/feedback/${feedback.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Vote */}
                    <button
                      onClick={(e) => handleVote(feedback.id, e)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[50px] py-2 rounded-lg transition-colors",
                        feedback.isVoted
                          ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                          : "bg-surface-100 text-surface-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-surface-800 dark:hover:bg-primary-900/20"
                      )}
                    >
                      <ThumbsUp className={cn("h-4 w-4", feedback.isVoted && "fill-current")} />
                      <span className="text-sm font-semibold mt-0.5">{formatNumber(feedback.votesCount)}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", typeInfo.color)}>
                          <TypeIcon className="h-3 w-3" />
                          {typeInfo.label}
                        </span>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        {feedback.images && feedback.images.length > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-surface-400">
                            <ImageIcon className="h-3 w-3" />
                            {feedback.images.length}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          {isOwner && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenModal(feedback);
                                }}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
                              >
                                <Edit className="h-3.5 w-3.5 text-surface-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(feedback.id);
                                }}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              </button>
                            </>
                          )}
                          <ChevronRight className="h-4 w-4 text-surface-400" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                        {feedback.title}
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                        {feedback.content}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-surface-500">
                        <span>@{feedback.author.username}</span>
                        <span>{formatRelativeTime(feedback.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {feedback.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
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
                    {editingFeedback ? "피드백 수정" : "피드백 작성"}
                  </h1>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={!formData.title.trim() || !formData.content.trim()}
                  className="rounded-full"
                >
                  {editingFeedback ? "저장" : "작성"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 피드백 타입 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      타입 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["feature", "bug", "improvement"] as const).map((type) => {
                        const info = FEEDBACK_TYPE_INFO[type];
                        const Icon = info.icon;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type }))}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors",
                              formData.type === type
                                ? cn(info.color, info.color.includes("rose") ? "border-rose-300 dark:border-rose-700" : info.color.includes("amber") ? "border-amber-300 dark:border-amber-700" : "border-primary-300 dark:border-primary-700")
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

                  {/* 제목 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="피드백 제목을 입력하세요"
                      maxLength={100}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>

                  {/* 내용 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      내용 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="피드백 내용을 자세히 작성해주세요. 버그의 경우 재현 방법, 기능 요청의 경우 사용 시나리오를 포함해주세요."
                      maxLength={2000}
                      rows={6}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.content.length}/2000
                    </p>
                  </div>

                  {/* 이미지 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      이미지 (최대 3개)
                    </label>
                    
                    {/* 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={img}
                              alt={`첨부 이미지 ${index + 1}`}
                              className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.images.length < 3 && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg text-surface-500 hover:border-primary-300 hover:text-primary-500 dark:hover:border-primary-700 transition-colors"
                        >
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm">이미지 추가 ({formData.images.length}/3)</span>
                        </button>
                      </>
                    )}
                    <p className="text-xs text-surface-400">
                      스크린샷이나 관련 이미지를 첨부하면 더 명확하게 전달할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 푸터 - 삭제 버튼 (수정 모드에서만) */}
              {editingFeedback && (
                <footer className="shrink-0 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleDelete(editingFeedback.id);
                      setIsModalOpen(false);
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    피드백 삭제
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

// 변경사항 탭 컴포넌트
interface ChangelogTabProps {
  changelogs: ChangelogEntry[];
  projectId: string;
}

// 변경사항 타입 정보
const CHANGE_TYPE_INFO = {
  feature: { label: "새 기능", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
  improvement: { label: "개선", color: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400" },
  fix: { label: "수정", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
  breaking: { label: "주의", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400" },
};

const MAX_VISIBLE_CHANGES = 5;

// URL에서 도메인 추출
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// 변경사항 카드 컴포넌트
interface ChangelogCardProps {
  entry: ChangelogEntry;
  onEdit: () => void;
  onDelete: () => void;
}

function ChangelogCard({ entry, onEdit, onDelete }: ChangelogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreChanges = entry.changes.length > MAX_VISIBLE_CHANGES;
  const visibleChanges = isExpanded ? entry.changes : entry.changes.slice(0, MAX_VISIBLE_CHANGES);
  const hiddenCount = entry.changes.length - MAX_VISIBLE_CHANGES;

  return (
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {entry.version}
              </Badge>
              <span className="text-sm text-surface-500">{entry.releasedAt}</span>
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">
              {entry.title}
            </h3>
            {/* 링크 표시 - 타이틀 아래 */}
            {(entry.repositoryUrl || entry.downloadUrl) && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {entry.repositoryUrl && (
                  <a
                    href={entry.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.repositoryUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
                {entry.downloadUrl && (
                  <a
                    href={entry.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{extractDomain(entry.downloadUrl)}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            )}
          </div>
          {/* 관리 액션 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={onEdit}
              className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="수정"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {entry.description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
            {entry.description}
          </p>
        )}
        <div className="space-y-2">
          {visibleChanges.map((change) => (
            <div key={change.id} className="flex items-start gap-2">
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium shrink-0", CHANGE_TYPE_INFO[change.type].color)}>
                {CHANGE_TYPE_INFO[change.type].label}
              </span>
              <span className="text-sm text-surface-700 dark:text-surface-300">
                {change.description}
              </span>
            </div>
          ))}
        </div>
        {/* 더 보기 버튼 */}
        {hasMoreChanges && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {hiddenCount}개 더 보기
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ChangelogTab({ changelogs: initialChangelogs, projectId }: ChangelogTabProps) {
  const { user } = useUserStore();
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>(initialChangelogs);
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

  const handleSave = () => {
    if (!formData.version.trim() || !formData.title.trim()) return;

    // 모든 변경사항 합치기
    const changes: ChangelogChange[] = [
      ...formData.features.filter(f => f.description.trim()).map(f => ({ id: f.id, type: "feature" as const, description: f.description })),
      ...formData.improvements.filter(i => i.description.trim()).map(i => ({ id: i.id, type: "improvement" as const, description: i.description })),
      ...formData.fixes.filter(x => x.description.trim()).map(x => ({ id: x.id, type: "fix" as const, description: x.description })),
      ...formData.breakings.filter(b => b.description.trim()).map(b => ({ id: b.id, type: "breaking" as const, description: b.description })),
    ];

    if (editingChangelog) {
      // 수정
      setChangelogs((prev) =>
        prev.map((cl) =>
          cl.id === editingChangelog.id
            ? {
                ...cl,
                version: formData.version,
                title: formData.title,
                description: formData.description,
                changes,
                repositoryUrl: formData.repositoryUrl || undefined,
                downloadUrl: formData.downloadUrl || undefined,
              }
            : cl
        )
      );
    } else {
      // 새 변경사항 추가
      const newChangelog: ChangelogEntry = {
        id: `cl${Date.now()}`,
        version: formData.version,
        title: formData.title,
        description: formData.description,
        changes,
        releasedAt: new Date().toISOString().split("T")[0],
        repositoryUrl: formData.repositoryUrl || undefined,
        downloadUrl: formData.downloadUrl || undefined,
      };
      setChangelogs((prev) => [newChangelog, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (changelogId: string) => {
    if (confirm("정말 이 변경사항을 삭제하시겠습니까?")) {
      setChangelogs((prev) => prev.filter((cl) => cl.id !== changelogId));
    }
  };

  const addChangeItem = (type: "features" | "improvements" | "fixes" | "breakings") => {
    const prefix = type === "features" ? "f" : type === "improvements" ? "i" : type === "fixes" ? "x" : "b";
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { id: `${prefix}-${Date.now()}`, description: "" }],
    }));
  };

  const updateChangeItem = (type: "features" | "improvements" | "fixes" | "breakings", id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((item) => (item.id === id ? { ...item, description: value } : item)),
    }));
  };

  const removeChangeItem = (type: "features" | "improvements" | "fixes" | "breakings", id: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">
          총 {changelogs.length}개의 릴리즈
        </p>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          변경사항 추가
        </Button>
      </div>

      {/* Changelog List */}
      {changelogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              아직 변경사항이 없습니다
            </p>
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              첫 변경사항 추가
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {changelogs.map((entry) => (
            <ChangelogCard 
              key={entry.id} 
              entry={entry} 
              onEdit={() => handleOpenModal(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
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
                  disabled={!formData.version.trim() || !formData.title.trim()}
                  className="rounded-full"
                >
                  {editingChangelog ? "저장" : "추가"}
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

                  {/* 링크 */}
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

                  {/* 새 기능 */}
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

                  {/* 개선 */}
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

                  {/* 수정 */}
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

                  {/* 주의 (Breaking Changes) */}
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

// 개발사 피드 (공지사항) 탭 컴포넌트
interface DevFeedTabProps {
  projectId: string;
}

// 포스트 타입 정보
const POST_TYPE_INFO = {
  announcement: { label: "공지", icon: Megaphone, color: "text-primary-500 bg-primary-50 dark:bg-primary-900/20", borderColor: "border-primary-300 dark:border-primary-700" },
  update: { label: "업데이트", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-emerald-300 dark:border-emerald-700" },
  vote: { label: "투표", icon: ThumbsUp, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-300 dark:border-amber-700" },
};

function DevFeedTab({ projectId }: DevFeedTabProps) {
  const { user } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<DevPost[]>(dummyDevPosts);
  const [filter, setFilter] = useState<"all" | "announcement" | "update" | "vote">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DevPost | null>(null);
  const [formData, setFormData] = useState({
    type: "announcement" as "announcement" | "update" | "vote",
    title: "",
    content: "",
    isPinned: false,
    images: [] as string[],
    voteOptions: ["", ""] as string[], // 투표 옵션 (최소 2개, 최대 5개)
  });

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

  const handleOpenModal = (post?: DevPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        type: post.type as "announcement" | "update" | "vote",
        title: post.title,
        content: post.content,
        isPinned: post.isPinned || false,
        images: [],
        voteOptions: ["", ""],
      });
    } else {
      setEditingPost(null);
      setFormData({ type: "announcement", title: "", content: "", isPinned: false, images: [], voteOptions: ["", ""] });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    // 투표 타입일 때 최소 2개의 유효한 옵션 필요
    if (formData.type === "vote") {
      const validOptions = formData.voteOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) return;
    }

    if (editingPost) {
      // 수정
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, type: formData.type, title: formData.title, content: formData.content, isPinned: formData.isPinned }
            : p
        )
      );
    } else {
      // 새 포스트 추가
      // 투표 옵션 생성 (투표 타입일 때만)
      const voteOptionsData = formData.type === "vote" 
        ? formData.voteOptions
            .filter(opt => opt.trim())
            .map((text, index) => ({
              id: `vo-${Date.now()}-${index}`,
              text: text.trim(),
              votesCount: 0,
            }))
        : undefined;

      const newPost: DevPost = {
        id: `dp${Date.now()}`,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        isPinned: formData.isPinned,
        author: {
          id: user?.id || "current",
          username: user?.username || "guest",
          displayName: user?.displayName || "게스트",
          role: "Founder", // 프로젝트 관리자로 가정
        },
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        comments: [],
        // 투표 관련 필드
        voteOptions: voteOptionsData,
        votedOptionId: undefined,
        totalVotes: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 3 - formData.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string].slice(0, 3),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDelete = (postId: string) => {
    if (confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleTogglePin = (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isPinned: !p.isPinned } : p
      )
    );
  };

  return (
    <div>
      {/* Filter & Actions */}
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
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-1" />
          공지 작성
        </Button>
      </div>

      {/* Posts List */}
      {sortedPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              {filter === "all" ? "아직 공지사항이 없습니다" : `${POST_TYPE_INFO[filter].label} 게시물이 없습니다`}
            </p>
            <Button onClick={() => handleOpenModal()} variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              첫 공지 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <DevPostCard 
              key={post.id} 
              post={post}
              onEdit={() => handleOpenModal(post)}
              onDelete={() => handleDelete(post.id)}
              onTogglePin={(e) => handleTogglePin(post.id, e)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
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
                    !formData.title.trim() || 
                    !formData.content.trim() ||
                    (formData.type === "vote" && formData.voteOptions.filter(opt => opt.trim()).length < 2)
                  }
                  className="rounded-full"
                >
                  {editingPost ? "저장" : "작성"}
                </Button>
              </header>

              {/* 콘텐츠 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-6">
                  {/* 고정하기 옵션 - 상단에 배치 */}
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

                  {/* 제목 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="공지 제목을 입력하세요"
                      maxLength={100}
                    />
                    <p className="text-xs text-surface-500 text-right">
                      {formData.title.length}/100
                    </p>
                  </div>

                  {/* 내용 */}
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
                            />
                            {formData.voteOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = formData.voteOptions.filter((_, i) => i !== index);
                                  setFormData((prev) => ({ ...prev, voteOptions: newOptions }));
                                }}
                                className="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
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
                        >
                          <Plus className="h-4 w-4" />
                          옵션 추가
                        </button>
                      )}
                    </div>
                  )}

                  {/* 이미지 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      이미지 (최대 3개)
                    </label>
                    
                    {/* 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={img}
                              alt={`첨부 이미지 ${index + 1}`}
                              className="h-24 w-24 rounded-lg object-cover border border-surface-200 dark:border-surface-700"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-900 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.images.length < 3 && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg text-surface-500 hover:border-primary-300 hover:text-primary-500 dark:hover:border-primary-700 transition-colors"
                        >
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm">이미지 추가 ({formData.images.length}/3)</span>
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

export function ProjectCommunityPage() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { user } = useUserStore();
  
  const validTabs: TabType[] = ["devfeed", "feedback", "rewards", "milestones", "changelog"];
  const initialTab = tab && validTabs.includes(tab as TabType) ? (tab as TabType) : "devfeed";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "bug" | "feature" | "improvement">("all");

  // URL 변경 시 탭 동기화
  useEffect(() => {
    if (tab && validTabs.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
    } else if (!tab) {
      setActiveTab("devfeed");
    }
  }, [tab]);

  // 탭 변경 핸들러
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/project/${id}/community/${newTab}`, { replace: true });
  };

  const project = projects[0]; // 임시로 첫 번째 프로젝트 사용
  const categoryInfo = project ? CATEGORY_INFO[project.category] : null;

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-surface-500">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const tabs = [
    { id: "devfeed" as TabType, label: "공지", icon: Megaphone },
    { id: "feedback" as TabType, label: "피드백", icon: MessageSquareText },
    { id: "rewards" as TabType, label: "리워드", icon: Gift },
    { id: "milestones" as TabType, label: "마일스톤", icon: Target },
    { id: "changelog" as TabType, label: "변경사항", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/project/${id}`}
            className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            프로젝트로 돌아가기
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 text-3xl dark:bg-surface-800">
              {categoryInfo?.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {project.title} 커뮤니티
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                개발팀과 소통하고 프로젝트 진행 상황을 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-surface-900 dark:text-surface-50"
                      : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {/* 개발사 피드 */}
          {activeTab === "devfeed" && (
            <DevFeedTab projectId={id || "1"} />
          )}

          {/* 피드백 */}
          {activeTab === "feedback" && (
            <FeedbackTab feedbacks={dummyFeedback} projectId={id || "1"} />
          )}

          {/* 리워드 */}
          {activeTab === "rewards" && (
            <div>
              {/* User Points */}
              <Card className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/30 border-primary-200 dark:border-primary-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white">
                        <Coins className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-600 dark:text-primary-400">내 포인트</p>
                        <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                          {formatNumber(user?.points || 0)} P
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      포인트 적립 방법
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dummyRewards.map((reward) => {
                  const remaining = reward.quantity - reward.claimedCount;
                  const progress = (reward.claimedCount / reward.quantity) * 100;
                  const canClaim = (user?.points || 0) >= reward.pointsRequired && remaining > 0;

                  return (
                    <Card key={reward.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy className={cn(
                            "h-5 w-5",
                            reward.type === "physical" ? "text-amber-500" :
                            reward.type === "access" ? "text-primary-500" : "text-emerald-500"
                          )} />
                          <Badge variant="secondary" className="text-[10px]">
                            {reward.type === "physical" ? "실물" : reward.type === "access" ? "이용권" : "디지털"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">
                          {reward.title}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                          {reward.description}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-surface-500 mb-1">
                            <span>남은 수량</span>
                            <span>{remaining} / {reward.quantity}</span>
                          </div>
                          <Progress value={progress} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary-600 dark:text-primary-400">
                            {formatNumber(reward.pointsRequired)} P
                          </span>
                          <Button
                            size="sm"
                            disabled={!canClaim}
                            variant={canClaim ? "primary" : "outline"}
                          >
                            {remaining === 0 ? "품절" : canClaim ? "교환하기" : "포인트 부족"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 마일스톤 - GitHub 스타일 */}
          {activeTab === "milestones" && (
            <MilestonesTab milestones={dummyMilestones} projectId={id || "1"} />
          )}

          {/* 변경사항 */}
          {activeTab === "changelog" && (
            <ChangelogTab changelogs={dummyChangelog} projectId={id || "1"} />
          )}
        </div>
      </div>
    </div>
  );
}

