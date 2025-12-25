# 프로젝트 스타팅 가이드

이 디렉토리는 **Bun.js + Supabase + React.js + Tailwind CSS + Vercel** 스택을 사용하는 프로젝트의 완전한 시작 가이드를 제공합니다.

## 📚 문서 목록

1. **[00_README.md](./00_README.md)** - 전체 개요 및 빠른 시작 (현재 문서)
2. **[01_project-setup.md](./01_project-setup.md)** - 프로젝트 초기 설정
3. **[02_project-structure.md](./02_project-structure.md)** - 프로젝트 구조 설명 (FSD 아키텍처)
4. **[03_backend-supabase.md](./03_backend-supabase.md)** - 백엔드 구조 (Supabase)
5. **[04_api-design.md](./04_api-design.md)** - API 설계 가이드
6. **[05_packages.md](./05_packages.md)** - 패키지 관리 및 필수 패키지
7. **[06_tailwindcss.md](./06_tailwindcss.md)** - Tailwind CSS 설정 및 스타일 가이드
8. **[07_authentication.md](./07_authentication.md)** - 인증 처리 및 라우트 보호
9. **[08_storybook.md](./08_storybook.md)** - Storybook 설정 및 사용법
10. **[09_code-patterns.md](./09_code-patterns.md)** - 코드 패턴 및 주석 가이드
11. **[10_vercel-deployment.md](./10_vercel-deployment.md)** - Vercel 배포 설정
12. **[agent-guide.md](./agent-guide.md)** - LLM을 위한 에이전트 문서
13. **[vercel.json.example](./vercel.json.example)** - Vercel 설정 파일 예시

## 🚀 빠른 시작

### 1. 프로젝트 생성

```bash
# 새 디렉토리 생성
mkdir my-project
cd my-project

# Bun 초기화
bun init

# 필수 패키지 설치
bun add react react-dom react-router @supabase/supabase-js zustand clsx tailwind-merge tailwindcss-animate lucide-react @react-hookz/web

# 개발 의존성 설치
bun add -d vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer @types/bun
```

### 2. 기본 파일 구조 생성

```bash
mkdir -p src/{app/{providers,router},pages,entities,features,widgets,shared/{ui,lib,config}}
mkdir -p public
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
bun run dev
```

## 📋 필수 체크리스트

- [ ] Bun.js 설치 확인
- [ ] Supabase 프로젝트 생성 및 설정
- [ ] 환경 변수 설정 (`.env` 파일)
- [ ] 기본 프로젝트 구조 생성
- [ ] Tailwind CSS 설정 완료
- [ ] Vite 빌드 설정 완료
- [ ] TypeScript 설정 완료
- [ ] 라우터 설정 완료
- [ ] 인증 시스템 구현
- [ ] Storybook 설정 (선택사항)

## 🛠 기술 스택

- **런타임**: Bun.js
- **프레임워크**: React 19
- **라우팅**: React Router v7
- **상태관리**: Zustand
- **백엔드**: Supabase (PostgreSQL + Auth + Storage)
- **스타일링**: Tailwind CSS 3.x
- **빌드 도구**: Vite
- **배포**: Vercel
- **문서화**: Storybook

## 📖 다음 단계

1. **[프로젝트 초기 설정](./01_project-setup.md)** - 상세한 설정 가이드
2. **[프로젝트 구조](./02_project-structure.md)** - FSD 아키텍처 이해
3. **[백엔드 설정](./03_backend-supabase.md)** - Supabase 설정 및 데이터베이스 구조

## 💡 팁

- 모든 설정 파일은 이 가이드의 각 문서에서 제공하는 템플릿을 사용하세요
- 코드 패턴은 [코드 패턴 가이드](./09_code-patterns.md)를 참고하세요
- LLM 에이전트를 사용하는 경우 [에이전트 가이드](./agent-guide.md)를 확인하세요

