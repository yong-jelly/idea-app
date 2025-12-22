# Google Tag Manager (GTM) 설정

## 개요
Google Tag Manager를 사용하여 웹사이트의 태그 및 추적 코드를 중앙에서 관리합니다.

## GTM 컨테이너 ID
- **GTM ID**: `GTM-NVVZHQW2`

## 적용 위치

### ✅ 적용 완료
- `index.html` - 메인 HTML 파일 (모든 페이지에 공통 적용)

### 적용 방법

#### 1. `<head>` 섹션에 추가
`<head>` 태그 내부, 가능한 한 상단에 다음 코드를 추가합니다:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NVVZHQW2');</script>
<!-- End Google Tag Manager -->
```

#### 2. `<body>` 섹션에 추가
`<body>` 태그 직후, 가능한 한 상단에 다음 코드를 추가합니다:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NVVZHQW2"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## 확인 방법

1. **브라우저 개발자 도구 확인**
   - F12 또는 우클릭 > 검사
   - Network 탭에서 `gtm.js` 요청 확인
   - Console에서 `dataLayer` 객체 확인

2. **Google Tag Assistant 확장 프로그램 사용**
   - Chrome 확장 프로그램 설치
   - 페이지에서 GTM 컨테이너 로드 확인

3. **GTM 미리보기 모드**
   - Google Tag Manager 대시보드에서 "미리보기" 버튼 클릭
   - 사이트 URL 입력하여 연결 확인

## SPA 페이지뷰 추적

React SPA 환경에서는 페이지 전환이 클라이언트 사이드에서 일어나므로, 자동으로 페이지뷰를 추적하도록 구현되어 있습니다.

### ✅ 구현 완료
- `src/shared/lib/gtm.ts` - GTM 유틸리티 함수
- `src/app/router/index.tsx` - 라우터에 페이지뷰 추적 자동 적용

### 사용 방법

#### 페이지뷰 추적 (자동)
라우터에서 자동으로 페이지 전환 시 페이지뷰 이벤트를 전송합니다. 추가 작업이 필요 없습니다.

#### 커스텀 이벤트 추적
커스텀 이벤트를 추적하려면 `trackEvent` 함수를 사용합니다:

```typescript
import { trackEvent } from "@/shared/lib/gtm";

// 프로젝트 조회 추적
trackEvent('project_view', {
  project_id: '123',
  project_name: 'My Project'
});

// 버튼 클릭 추적
trackEvent('button_click', {
  button_name: 'create_project',
  location: 'header'
});
```

#### 직접 dataLayer 푸시
더 세밀한 제어가 필요한 경우 `pushToDataLayer` 함수를 사용합니다:

```typescript
import { pushToDataLayer } from "@/shared/lib/gtm";

pushToDataLayer('custom_event', {
  event_category: 'engagement',
  event_label: 'project_created',
  value: 1
});
```

## Google Analytics 연동

### GA4 스트림 정보
- **스트림 이름**: 1DD 웹 사이트
- **스트림 URL**: https://1dd.net
- **스트림 ID**: 13174428590
- **측정 ID**: `G-XNYR1K36E7`

### GTM 대시보드 설정

#### 1. Google Analytics GA4 구성 태그 추가

GTM 대시보드에서 Google Analytics를 연동하려면:

1. **GTM 대시보드 접속**
   - https://tagmanager.google.com 접속
   - 컨테이너 `GTM-NVVZHQW2` 선택

2. **태그 생성**
   - 왼쪽 메뉴에서 **태그** 클릭
   - **새로 만들기** 버튼 클릭
   - 태그 이름: `GA4 - Configuration` (또는 원하는 이름)

3. **태그 구성**
   - **태그 구성** 클릭
   - 태그 유형: **Google Analytics: GA4 구성** 선택
   - 측정 ID: `G-XNYR1K36E7` 입력

4. **트리거 설정**
   - **트리거** 섹션에서 **트리거 선택** 클릭
   - **새로 만들기** 클릭
   - 트리거 이름: `All Pages` (또는 원하는 이름)
   - 트리거 유형: **페이지뷰** 선택
   - 트리거 발생 위치: **모든 페이지뷰** 선택
   - 저장

5. **태그 저장 및 게시**
   - 태그 설정 완료 후 **저장** 클릭
   - 상단 **제출** 버튼 클릭
   - 버전 이름 입력 (예: "GA4 연동 추가")
   - **게시** 클릭

#### 2. SPA 페이지뷰 추적 설정 (중요)

SPA 환경에서는 추가 설정이 필요합니다:

1. **사용자 정의 이벤트 트리거 생성**
   - **트리거** > **새로 만들기**
   - 트리거 이름: `SPA Page View`
   - 트리거 유형: **사용자 정의 이벤트** 선택
   - 이벤트 이름: `page_view` 입력
   - 저장

2. **GA4 이벤트 태그 생성**
   - **태그** > **새로 만들기**
   - 태그 이름: `GA4 - Page View Event`
   - 태그 구성: **Google Analytics: GA4 이벤트** 선택
   - 측정 ID: `G-XNYR1K36E7` 입력
   - 이벤트 이름: `page_view` (또는 그대로 유지)
   - 트리거: `SPA Page View` 선택
   - 저장

3. **페이지 경로 변수 설정 (선택사항)**
   - **변수** > **새로 만들기**
   - 변수 이름: `Page Path`
   - 변수 유형: **데이터 레이어 변수** 선택
   - 데이터 레이어 변수 이름: `page_path` 입력
   - 저장

   - **변수** > **새로 만들기**
   - 변수 이름: `Page Title`
   - 변수 유형: **데이터 레이어 변수** 선택
   - 데이터 레이어 변수 이름: `page_title` 입력
   - 저장

4. **GA4 구성 태그에 페이지 경로 추가**
   - `GA4 - Configuration` 태그 편집
   - **필드 추가** > **페이지 경로** 선택
   - 값: `{{Page Path}}` 선택
   - 저장

#### 4. 확인 방법

1. **GTM 미리보기 모드**
   - GTM 대시보드에서 **미리보기** 버튼 클릭
   - 사이트 URL: `https://1dd.net` 입력
   - 페이지 이동 시 태그가 발화되는지 확인

2. **Google Analytics 실시간 보고서**
   - Google Analytics 대시보드 접속
   - **보고서** > **실시간** 메뉴 선택
   - 사이트에서 페이지 이동 시 실시간 방문자 수 확인

3. **브라우저 개발자 도구**
   - F12 또는 우클릭 > 검사
   - Network 탭에서 `collect` 요청 확인 (GA4 데이터 전송)
   - Console에서 `dataLayer` 확인

#### 5. 커스텀 이벤트 트리거 설정

코드에서 `trackEvent()` 함수로 전송한 커스텀 이벤트를 추적하려면:

1. **트리거 생성**
   - **트리거** > **새로 만들기**
   - 트리거 이름: 이벤트 이름과 동일하게 (예: `project_view`)
   - 트리거 유형: **사용자 정의 이벤트** 선택
   - 이벤트 이름: 코드에서 사용한 이벤트 이름 입력 (예: `project_view`)
   - 저장

2. **GA4 이벤트 태그 생성**
   - **태그** > **새로 만들기**
   - 태그 이름: `GA4 - [이벤트명]` (예: `GA4 - Project View`)
   - 태그 구성: **Google Analytics: GA4 이벤트** 선택
   - 측정 ID: `G-XNYR1K36E7` 입력
   - 이벤트 이름: 트리거와 동일하게 입력
   - 트리거: 위에서 생성한 트리거 선택
   - 저장

## 설정 체크리스트

### 코드 레벨 (✅ 완료)
- [x] `index.html`에 GTM 코드 추가
- [x] SPA 페이지뷰 추적 구현 (`src/app/router/index.tsx`)
- [x] GTM 유틸리티 함수 구현 (`src/shared/lib/gtm.ts`)

### GTM 대시보드 설정 (필요)
- [ ] GA4 구성 태그 생성 (측정 ID: `G-XNYR1K36E7`)
- [ ] SPA 페이지뷰 트리거 및 태그 생성
- [ ] 페이지 경로 변수 설정 (선택사항)
- [ ] 커스텀 이벤트 트리거 및 태그 생성 (필요 시)
- [ ] 설정 게시

### 확인 (필요)
- [ ] GTM 미리보기 모드에서 태그 발화 확인
- [ ] Google Analytics 실시간 보고서에서 데이터 확인
- [ ] 브라우저 개발자 도구에서 dataLayer 확인

## 참고사항

- GTM 코드는 모든 페이지에 한 번만 추가하면 됩니다 (SPA의 경우 index.html에만 추가)
- `noscript` 태그는 JavaScript가 비활성화된 환경을 위한 대체 방법입니다
- GTM을 통해 Google Analytics, Facebook Pixel 등 다양한 태그를 관리할 수 있습니다
- SPA 환경에서는 페이지 전환 시 자동으로 `page_view` 이벤트가 전송됩니다
- 개발 환경에서는 콘솔에 GTM 이벤트 로그가 출력됩니다
- **중요**: GTM 대시보드에서 태그를 생성하고 게시해야 실제로 데이터가 수집됩니다