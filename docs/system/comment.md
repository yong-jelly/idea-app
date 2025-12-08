# 댓글 시스템 설계

## 개요

게시물에 대한 댓글 및 대댓글 시스템으로, 최대 3단계 깊이까지 중첩된 답글을 지원합니다.

## 댓글 구조

### Depth 구조

```
원글 (Post)
├── 댓글 (depth: 0)
│   ├── 대댓글 (depth: 1)
│   │   ├── 대대댓글 (depth: 2) ← 최대 깊이, 답글 버튼 없음
│   │   └── 대대댓글 (depth: 2)
│   └── 대댓글 (depth: 1)
└── 댓글 (depth: 0)
```

### 규칙

| Depth | 설명 | 답글 가능 |
|-------|------|----------|
| 0 | 원글에 대한 직접 댓글 | ✅ |
| 1 | 댓글에 대한 답글 (대댓글) | ✅ |
| 2 | 대댓글에 대한 답글 (대대댓글) | ❌ |

- **최대 깊이**: `MAX_COMMENT_DEPTH = 2`
- **마지막 depth(2)에서는 답글 버튼이 표시되지 않음**
- 대화를 이어가려면 같은 depth에서 새 댓글 작성

## 데이터 모델

### Comment Interface

```typescript
interface Comment {
  id: string;
  parentId?: string;           // 부모 댓글 ID (없으면 원글에 대한 답글)
  replyTo?: {                  // 답장 대상 (멘션 표시용)
    username: string;
    displayName: string;
  };
  depth: number;               // 0, 1, 2 (최대)
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;           // ISO 8601 형식
  likesCount: number;
  isLiked: boolean;
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | 댓글 고유 식별자 |
| `parentId` | string | - | 부모 댓글 ID. depth 0이면 없음 |
| `replyTo` | object | - | 답장 대상 정보 (UI 표시용) |
| `depth` | number | ✅ | 중첩 깊이 (0-2) |
| `author` | object | ✅ | 작성자 정보 |
| `content` | string | ✅ | 댓글 내용 |
| `createdAt` | string | ✅ | 작성 시간 |
| `likesCount` | number | ✅ | 좋아요 수 |
| `isLiked` | boolean | ✅ | 현재 사용자의 좋아요 여부 |

## UI/UX

### 들여쓰기

depth에 따라 시각적으로 구분되는 들여쓰기 적용:

| Depth | Padding 클래스 | 설명 |
|-------|---------------|------|
| 0 | `px-4` | 기본 여백 |
| 1 | `pl-14 pr-4` | 좌측 56px 들여쓰기 |
| 2 | `pl-20 pr-4` | 좌측 80px 들여쓰기 |

### 아바타 크기

| Depth | 크기 |
|-------|------|
| 0 | `md` (40px) |
| 1+ | `sm` (32px) |

### 폰트 크기

| Depth | 크기 |
|-------|------|
| 0 | `text-[15px]` |
| 1+ | `text-sm` |

### 답글 작성 UI

- 댓글 클릭 시 인라인으로 답글 작성 폼 표시
- `@username` 멘션으로 답장 대상 표시
- 단축키: `⌘+Enter` 전송, `Esc` 취소
- depth 2 댓글에는 답글 버튼 미표시

## 댓글 정렬

### 표시 순서

1. 원글에 대한 댓글은 최신순으로 표시
2. 대댓글은 부모 댓글 바로 아래에 시간순(오래된 순)으로 표시
3. 같은 부모의 대댓글들은 그룹화되어 표시

### 새 댓글 삽입 위치

```typescript
// 대댓글인 경우: 부모 댓글의 마지막 대댓글 다음에 삽입
if (targetComment) {
  let insertIndex = parentIndex + 1;
  while (comments[insertIndex]?.parentId === targetComment.id) {
    insertIndex++;
  }
  comments.splice(insertIndex, 0, newComment);
}
// 원글에 대한 댓글: 맨 앞에 추가
else {
  comments.unshift(newComment);
}
```

## 액션

### 댓글 액션

| 액션 | 설명 | 조건 |
|------|------|------|
| 답글 | 해당 댓글에 답글 작성 | depth < 2 |
| 좋아요 | 댓글에 좋아요 토글 | 로그인 필요 |

### 향후 확장 가능

- 댓글 수정
- 댓글 삭제
- 댓글 신고
- 댓글 고정 (작성자 전용)

## 관련 컴포넌트

- `PostDetailPage.tsx` - 게시물 상세 페이지
- `CommentItem` - 개별 댓글 컴포넌트
- `InlineReplyComposer` - 인라인 답글 작성 컴포넌트

