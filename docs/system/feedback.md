# 피드백 시스템

프로젝트의 버그 리포트, 기능 요청, 개선 제안 등을 관리하는 피드백 시스템입니다.
GitHub Issues UI/UX를 참고하여 설계되었습니다.

## 개요

피드백은 사용자와 개발팀 간의 소통 창구로, 다양한 유형의 피드백을 수집하고 관리합니다.

### 주요 기능
- 피드백 CRUD (생성, 조회, 수정, 삭제)
- 피드백 타입 분류 (버그, 기능 요청, 개선 제안, 질문)
- 상태 관리 (접수됨, 진행 중, 해결됨, 닫힘)
- 우선순위 관리 (낮음, 보통, 높음, 긴급)
- 담당자 지정
- 투표 기능
- 댓글 시스템 (최대 3 depth)
- 이미지 첨부
- 프로젝트 멤버 의사 결정 기능 (상태/타입/우선순위 변경, 공식 답변)
- 변경 이력 추적

---

## 데이터 구조

### Feedback

```typescript
interface Feedback {
  id: string;
  type: FeedbackType;          // "bug" | "feature" | "improvement" | "question"
  status: FeedbackStatus;      // "open" | "in_progress" | "resolved" | "closed"
  priority?: FeedbackPriority; // "low" | "medium" | "high" | "critical"
  title: string;               // 제목
  content: string;             // 내용 (마크다운 지원)
  images?: string[];           // 첨부 이미지 URL 배열
  author: FeedbackAuthor;      // 작성자 정보
  assignee?: FeedbackAuthor;   // 담당자
  votesCount: number;          // 투표 수
  isVoted: boolean;            // 현재 사용자의 투표 여부
  commentsCount: number;       // 총 댓글 수
  comments?: FeedbackComment[];// 댓글 목록
  developerResponse?: string;  // 개발팀 공식 답변
  isPinned?: boolean;          // 상단 고정 여부
  history?: FeedbackHistory[]; // 변경 이력
  createdAt: string;
  updatedAt?: string;
}
```

### FeedbackComment

```typescript
interface FeedbackComment {
  id: string;
  author: FeedbackAuthor;
  content: string;
  images?: string[];           // 댓글 첨부 이미지
  likesCount: number;
  isLiked: boolean;
  depth: number;               // 댓글 깊이 (0, 1, 2)
  parentId?: string;           // 부모 댓글 ID (답글인 경우)
  replies?: FeedbackComment[]; // 답글 목록
  createdAt: string;
  updatedAt?: string;
}
```

---

## 피드백 타입

| 타입 | 라벨 | 아이콘 | 색상 | 용도 |
|------|------|--------|------|------|
| bug | 버그 | 🐛 Bug | 빨간색 | 오류, 버그 리포트 |
| feature | 기능 요청 | 💡 Lightbulb | 주황색 | 새로운 기능 요청 |
| improvement | 개선 제안 | ✨ Sparkles | 파란색 | 기존 기능 개선 제안 |
| question | 질문 | 💬 MessageSquare | 청록색 | 사용법, API 등 문의 |

---

## 피드백 상태

| 상태 | 라벨 | 아이콘 | 색상 | 설명 |
|------|------|--------|------|------|
| open | 접수됨 | ⚠️ AlertCircle | 회색 | 새로 등록됨 |
| in_progress | 진행 중 | ⏰ Clock | 파란색 | 개발팀 검토/작업 중 |
| resolved | 해결됨 | ✅ CheckCircle | 녹색 | 문제 해결됨 |
| closed | 닫힘 | ❌ X | 회색 어두움 | 처리 완료 또는 반려 |

---

## 우선순위

| 우선순위 | 라벨 | 색상 | 설명 |
|----------|------|------|------|
| low | 낮음 | 회색 | 중요도 낮음, 여유있게 처리 |
| medium | 보통 | 파란색 | 일반적인 중요도 |
| high | 높음 | 주황색 | 빠른 처리 필요 |
| critical | 긴급 | 빨간색 | 즉시 처리 필요 |

---

## URL 구조

```
/project/:id/community/feedback              # 피드백 목록
/project/:id/community/feedback/:feedbackId  # 피드백 상세
```

---

## UI 컴포넌트

### FeedbackRow

피드백 목록에서 각 피드백을 표시하는 Row 컴포넌트입니다.

```tsx
import { FeedbackRow } from "@/entities/project";

<FeedbackRow
  feedback={feedback}
  onClick={() => navigate(`/project/${id}/community/feedback/${feedback.id}`)}
  onVote={() => handleVote(feedback.id)}
  compact={false}  // 컴팩트 모드
/>
```

**Props:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| feedback | FeedbackData | ✓ | 피드백 데이터 |
| onClick | () => void | | 클릭 핸들러 |
| onVote | () => void | | 투표 핸들러 |
| compact | boolean | | 컴팩트 모드 (기본: false) |

**표시 정보:**
- 투표 버튼 및 투표 수
- 타입 뱃지 (버그, 기능 요청 등)
- 상태 뱃지
- 제목 및 내용 미리보기
- 작성자, 작성일, 댓글 수
- 개발팀 답변 여부
- 이미지 첨부 여부

---

### FeedbackDetailPage

피드백 상세 페이지입니다.

**구성 요소:**
1. 헤더 (타입, 상태, 제목, 작성자 정보)
2. 본문 (내용, 첨부 이미지)
3. 개발팀 답변 영역
4. 액션 바 (투표, 댓글 수, 공유)
5. 댓글 섹션

---

## 댓글 시스템

### 최대 깊이: 3 depth

```
댓글 (depth: 0)
├── 답글 (depth: 1)
│   └── 답글의 답글 (depth: 2)
└── 답글 (depth: 1)
```

- depth 0: 피드백에 직접 달린 댓글
- depth 1: 댓글에 대한 답글
- depth 2: 답글에 대한 답글 (최대)

### 댓글 입력

```tsx
<CommentInput
  placeholder="의견을 남겨주세요..."
  onSubmit={(content, images) => handleSubmit(content, images)}
  onCancel={() => setShowInput(false)}
  showCancel={true}
  autoFocus={true}
/>
```

### 이미지 첨부

- 피드백 작성 시 이미지 첨부 가능
- 댓글 작성 시 이미지 첨부 가능
- 첨부된 이미지 클릭 시 새 탭에서 원본 보기

---

## 사용자 플로우

### 피드백 목록 페이지

1. 프로젝트 커뮤니티 > 피드백 탭 클릭
2. 타입별 필터 (전체, 기능 요청, 버그, 개선 제안)
3. 투표 버튼으로 관심 표현
4. 피드백 Row 클릭 → 상세 페이지 이동

### 피드백 상세 페이지

1. 피드백 전체 내용 확인
2. 첨부 이미지 확인
3. 개발팀 답변 확인
4. 투표 버튼으로 지지 표현
5. 댓글 작성
6. 기존 댓글에 답글 달기 (최대 3 depth)

---

## Storybook

스토리북에서 컴포넌트 미리보기:

```bash
bun run storybook
```

경로: `Entities/Project/FeedbackRows`

### 제공 스토리

**타입별:**
- 기능 요청 / 버그 리포트 / 개선 제안 / 질문

**상태별:**
- 접수됨 / 진행 중 / 해결됨 / 닫힘

**기타:**
- 컴팩트 모드
- 높은 투표수
- 개발팀 답변 있는 피드백
- 목록 예시

---

## 파일 구조

```
src/
├── entities/project/
│   └── ui/
│       ├── FeedbackRow.tsx           # 피드백 Row 컴포넌트
│       └── FeedbackRows.stories.tsx  # 스토리북
├── pages/project/
│   ├── community/
│   │   ├── index.tsx                 # 커뮤니티 메인 페이지 (피드백 탭 포함)
│   │   ├── tabs/
│   │   │   └── FeedbackTab.tsx       # 피드백 탭 컴포넌트
│   │   ├── components/
│   │   │   └── FeedbackCardSkeleton.tsx  # 피드백 스켈레톤
│   │   ├── types.ts                  # 타입 정의
│   │   ├── constants.ts              # 상수 정의
│   │   └── utils/                     # 유틸리티 함수들
│   └── FeedbackDetailPage.tsx        # 피드백 상세 페이지
└── app/router/
    └── index.tsx                     # 라우팅 설정
```

---

## 댓글 깊이 제한 로직

댓글 시스템은 최대 3 depth까지 지원하며, 댓글 정규화는 `normalizeComments` 유틸리티 함수를 사용합니다.

```typescript
import { normalizeComments, countAllComments } from "@/pages/project/community/utils/comment.utils";

// 댓글 배열을 CommentNode 형식으로 정규화
const comments = normalizeComments(postComments, 0);

// 모든 댓글 개수 계산 (대댓글 포함)
const totalComments = countAllComments(comments);
```

**답글 버튼 표시 조건:**
```typescript
const MAX_COMMENT_DEPTH = 3;

// 답글 버튼 표시 조건
const canReply = comment.depth < MAX_COMMENT_DEPTH - 1;
// depth 0, 1 → 답글 가능
// depth 2 → 답글 불가 (최대 깊이 도달)
```

---

## 투표 시스템

- 각 피드백에 1인 1표
- 투표 취소 가능
- 투표수 높은 피드백 우선 표시 (기본 정렬)
- 투표수는 `formatNumber`로 축약 표시 (예: 1.2K)

**투표 옵션 업데이트:**
투표 관련 로직은 `updateVoteOptions` 유틸리티 함수를 사용할 수 있습니다.

```typescript
import { updateVoteOptions } from "@/pages/project/community/utils/vote.utils";

const { options, totalVotes } = updateVoteOptions(
  voteOptions,
  selectedOptionId,
  previousOptionId
);
```

---

## 프로젝트 멤버 의사 결정 기능

프로젝트 멤버(Founder, Developer, Designer 등)는 피드백에 대해 다음 작업을 수행할 수 있습니다.

### 권한 체크

```typescript
// 현재 데모용 - 추후 API 연동 시 교체
const isProjectMember = true; // 실제로는 API에서 권한 체크
```

### 사용 가능한 기능

| 기능 | 설명 | UI 위치 |
|------|------|---------|
| 상태 변경 | 접수됨 → 진행 중 → 해결됨/닫힘 | 사이드바 Select |
| 타입 변경 | 버그/기능 요청/개선 제안/질문 간 전환 | 사이드바 Select |
| 우선순위 설정 | 낮음/보통/높음/긴급 설정 | 사이드바 Select |
| 담당자 지정 | 프로젝트 멤버 중 담당자 지정 | 사이드바 Select |
| 공식 답변 작성 | 사용자에게 공식 답변 전달 | 관리 카드 버튼 |
| 상단 고정 | 중요 피드백 상단 고정 | 관리 카드 버튼 |
| 변경 이력 보기 | 모든 변경 사항 추적 | 관리 카드 버튼 |

### 변경 이력 (History)

모든 의사 결정은 이력으로 기록됩니다.

```typescript
interface FeedbackHistory {
  id: string;
  type: "status_change" | "type_change" | "priority_change" | "assignee_change" | "response_added";
  actor: FeedbackAuthor;   // 변경한 사람
  oldValue?: string;       // 이전 값
  newValue?: string;       // 새 값
  createdAt: string;
}
```

### UI/UX

- 프로젝트 멤버가 아닌 경우: 세부 정보는 읽기 전용으로 표시
- 프로젝트 멤버인 경우: Select 컴포넌트로 변경 가능
- 변경 이력은 "관리" 카드에서 토글로 표시/숨김

---

## 상세 페이지 레이아웃

### 메인 영역

1. **헤더 카드**
   - 상단 색상 바 (타입별 색상)
   - 뱃지: 고정됨, 타입, 상태, 우선순위
   - 제목
   - 작성자 정보
   
2. **본문 영역**
   - 내용 (whitespace-pre-wrap)
   - 첨부 이미지
   
3. **공식 답변 영역**
   - 배경색 강조
   - 아이콘 + "공식 답변" 라벨
   
4. **액션 바**
   - 투표 버튼
   - 댓글 수
   - 링크 복사
   - 공유

5. **댓글 섹션**
   - 댓글 입력
   - 댓글 목록 (3 depth까지)

### 사이드바

1. **투표 카드**
   - 투표수 강조
   - 투표 버튼

2. **세부 정보 카드**
   - 상태 (Select 또는 Badge)
   - 타입 (Select 또는 Badge)
   - 우선순위 (Select 또는 Badge)
   - 담당자 (Select 또는 텍스트)
   - 작성일/수정일

3. **관리 카드** (프로젝트 멤버만)
   - 공식 답변 작성/수정
   - 상단 고정
   - 변경 이력 보기

4. **변경 이력 카드** (토글)

