# Figma Auto-Layout Spec

## 프레임 구조

- `Desktop / Home / Feed`
- `Desktop / Project / Overview`
- `Desktop / Project / CommunityHub`
- `Desktop / Feedback / Detail`
- `Desktop / Institution / Cohort`
- `Tablet / ...`
- `Mobile / ...`

## 오토레이아웃 규칙

- 페이지 루트: vertical, gap `32`
- 섹션 카드: vertical, padding `24`, gap `16`
- 카드 헤더: horizontal, center, space-between
- 메타 뱃지: wrap, gap `8`
- 피드 카드: `header / body / actions / footer`

## 컴포넌트 아키텍처

### Foundations

- Color tokens
- Typography tokens
- Spacing tokens
- Radius tokens
- Shadow tokens

### Components

- Buttons
- Tabs
- Badges
- ProjectCard
- FeedbackRow
- MilestoneCard
- ChangelogCard
- EmptyState
- StatusBanner

### Patterns

- FeedList
- DetailHero
- RightRail
- AdminTable
- InstitutionShowcaseGrid

## 디자인 토큰 방향

| Token | 방향 |
|---|---|
| `color.bg.primary` | 밝고 안정적인 배경 |
| `color.surface.card` | 약한 elevation 카드 |
| `color.text.primary` | 높은 대비 텍스트 |
| `color.state.open` | 중립 회색 |
| `color.state.progress` | 선명한 블루 |
| `color.state.resolved` | 안정적인 그린 |
| `space.2 ~ space.10` | 8pt 스케일 |
| `radius.md/lg/xl` | 카드와 패널의 일관성 |

## 프로토타입 연결

- 피드 카드 -> 프로젝트 상세
- 프로젝트 상세 CTA -> 커뮤니티 허브
- 커뮤니티 허브 -> 피드백 상세 / 마일스톤 상세 / 변경사항
- 기관 페이지 -> 기수 페이지 -> 프로젝트 상세

## 개발 핸드오프 원칙

- 모든 컴포넌트는 `state`, `size`, `platform`, `role` variant 보유
- enum 값은 API와 맞춘 뒤 디자인에 반영
- 숫자/날짜 포맷은 formatter 규칙으로 분리
- disabled / empty / loading / error 상태 포함

## 접근성 주석

- 포커스 링 색상과 두께 정의
- 최소 터치 타겟 `44x44`
- 키보드 포커스 순서 명시
- 상태 변화는 스크린리더에도 전달 가능하게 설계
