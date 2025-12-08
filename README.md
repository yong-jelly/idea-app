# IndieStart - 인디해커들을 위한 스타팅 프로젝트 플랫폼

혁신적인 아이디어를 현실로. 커뮤니티와 함께 성장하는 인디 프로젝트의 시작점.

## 🚀 기능

- **마이크로 SNS 타임라인**: 트위터 스타일의 피드, 포스트 작성, 좋아요, 리포스트, 북마크
- **프로젝트 탐색**: 카테고리별 필터링, 검색, 트렌딩 프로젝트
- **프로젝트 등록**: 5단계 마법사 형태의 프로젝트 등록 시스템
- **후원 시스템**: 다양한 활동을 통한 포인트 획득 및 리워드 교환
- **기능 제안**: 유저가 기능을 제안하고 개발자가 응답하는 시스템
- **커뮤니티**: 포럼, 이벤트, 리더보드

## 🛠 기술 스택

- **런타임**: Bun
- **프레임워크**: React 19 (순수 SPA)
- **라우팅**: react-router v7
- **상태관리**: zustand
- **스타일링**: Tailwind CSS 3.x + tailwindcss-animate
- **아이콘**: lucide-react
- **빌드**: Vite
- **문서화**: Storybook

## 📁 프로젝트 구조 (FSD 아키텍처)

```
src/
├── app/                    # 앱 초기화, 라우터, 프로바이더
├── pages/                  # 페이지 컴포넌트
│   ├── feed/
│   ├── explore/
│   ├── project/
│   ├── community/
│   └── profile/
├── widgets/                # 독립적 UI 블록
│   ├── header/
│   ├── sidebar/
│   └── feed-timeline/
├── features/               # 사용자 시나리오 기능
│   ├── feed/
│   └── project/
├── entities/               # 비즈니스 엔티티
│   ├── user/
│   ├── post/
│   └── project/
└── shared/                 # 재사용 가능한 공용 코드
    ├── ui/
    ├── lib/
    └── config/
```

## 🚀 시작하기

### 설치

```bash
bun install
```

### 개발 서버 실행

```bash
bun run dev
```

http://localhost:5173 에서 앱을 확인할 수 있습니다.

### Storybook 실행

```bash
bun run storybook
```

http://localhost:6006 에서 Storybook을 확인할 수 있습니다.

### 빌드

```bash
bun run build
```

## 📱 주요 페이지

- `/` - 메인 피드 (타임라인)
- `/explore` - 프로젝트 탐색
- `/community` - 커뮤니티
- `/create-project` - 프로젝트 등록
- `/project/:id/support` - 프로젝트 후원
- `/project/:id/feature-requests` - 기능 제안
- `/profile/:username` - 프로필 페이지

## 🎨 디자인 시스템

- 차분한 Blue/Indigo 그라데이션
- 다크/라이트 모드 지원
- 모바일 반응형

## 📝 라이센스

MIT License
