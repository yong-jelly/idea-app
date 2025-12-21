# 메인 피드 시스템

## 개요

메인 피드의 홈 영역에 커뮤니티에서 발생한 모든 피드들을 통합하여 표시하는 시스템입니다. 프로젝트 커뮤니티의 공지, 피드백, 프로젝트 생성 정보, 프로젝트 타임라인 포스트가 시간순으로 표시되며, 각 피드 타입별로 최적화된 스타일과 제목 강조가 적용됩니다.

### 주요 기능

- **통합 피드 조회**: 모든 피드 타입을 하나의 API로 조회
- **시간순 정렬**: 모든 피드를 `created_at` 기준으로 시간순 정렬
- **피드 타입별 스타일**: 각 피드 타입에 맞는 최적화된 UI 제공
- **제목 강조**: 제목이 있는 피드는 강조 스타일 적용
- **Bot 작성자 표시**: 시스템 Bot이 생성한 피드는 Bot 배지 표시
- **페이지네이션**: 무한 스크롤을 통한 피드 로드

---

## 포함되는 피드 타입

### 1. 일반 포스트

- **text**: 일반 텍스트 포스트
- **project_update**: 프로젝트 업데이트
- **milestone**: 마일스톤 달성
- **feature_accepted**: 기능 제안 수락

### 2. 커뮤니티 공지

- **announcement**: 공지사항
- **update**: 업데이트 소식
- **vote**: 투표

### 3. 피드백

- **bug**: 버그 리포트
- **feature**: 기능 요청
- **improvement**: 개선 제안
- **question**: 질문

### 4. 프로젝트 생성

- **project_created**: 새로운 프로젝트 생성 알림 (Bot이 자동 생성)

---

## API 사용법

### 통합 피드 조회

**함수**: `odd.v1_fetch_unified_feed`

**매개변수**:
- `p_limit` (integer, 기본값: 50): 조회 개수 제한 (최대: 100)
- `p_offset` (integer, 기본값: 0): 페이지네이션 오프셋

**반환값**: 통합 피드 목록 (작성자 정보, 인터랙션 상태, 피드 타입별 추가 정보 포함)

**예시**:
```typescript
import { fetchUnifiedFeed } from "@/entities/post/api/post.api";

const { data, error } = await fetchUnifiedFeed({
  limit: 50,
  offset: 0,
});
```

---

## 컴포넌트 구조

### 피드 Row 컴포넌트

각 피드 타입별로 최적화된 Row 컴포넌트가 있습니다:

- `TextPostRow`: 일반 텍스트 포스트
- `ProjectUpdateRow`: 프로젝트 업데이트
- `MilestoneAchievedRow`: 마일스톤 달성
- `FeatureAcceptedRow`: 기능 제안 수락
- `ProjectCreatedRow`: 프로젝트 생성 (Bot 작성자 표시 포함)
- `AnnouncementRow`: 커뮤니티 공지 (제목 강조)
- `FeedbackRow`: 피드백 (제목 강조)

### FeedTimeline 컴포넌트

**파일**: `src/widgets/feed-timeline/FeedTimeline.tsx`

통합 피드 API를 호출하여 모든 피드 타입을 렌더링합니다.

**주요 기능**:
- 통합 피드 API 호출
- 피드 타입별 컴포넌트 자동 렌더링
- 무한 스크롤 지원
- 좋아요/북마크 인터랙션 처리

---

## 데이터 흐름

```
프로젝트 생성
  ↓
트리거 (trigger_after_project_created)
  ↓
Bot이 피드 자동 생성 (project_created 타입)
  ↓
통합 피드 조회 API (v1_fetch_unified_feed)
  ↓
FeedTimeline 컴포넌트
  ↓
피드 타입별 Row 컴포넌트 렌더링
```

---

## 제목 강조 스타일

제목이 있는 피드 타입 (공지, 피드백, 프로젝트 생성)은 다음과 같은 강조 스타일이 적용됩니다:

- `font-semibold`: 굵은 글꼴
- `text-lg`: 큰 글꼴 크기
- `text-surface-900 dark:text-surface-50`: 높은 대비 색상

---

## Bot 시스템

시스템 Bot이 자동으로 생성하는 피드는 다음과 같이 표시됩니다:

- Bot 배지 표시 (역할별 색상 및 아이콘)
- Bot 프로필 클릭 비활성화
- 시스템 아이콘 표시

자세한 내용은 [Bot 시스템 문서](./system/Bot-시스템.md)를 참고하세요.

---

## 관련 파일

- **API 함수**: `src/entities/post/api/post.api.ts`
- **타입 정의**: `src/entities/feed/model/feed.types.ts`
- **피드 컴포넌트**: `src/entities/feed/ui/rows/`
- **FeedTimeline**: `src/widgets/feed-timeline/FeedTimeline.tsx`
- **SQL 함수**: `docs/sql/034_v1_fetch_unified_feed.sql`
- **프로젝트 생성 피드**: `docs/sql/035_v1_create_project_with_feed.sql`


