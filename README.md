# PicTree Frontend

> 사진은 남지만, 이야기는 흩어집니다.  
> PicTree는 사진, 위치, 동선, 글쓰기를 하나의 흐름으로 연결하는 여행 기록 서비스입니다.

PicTree는 여행 중 찍은 사진의 위치 정보를 기반으로 장소를 기록하고, 지도 위에서 이동 동선을 시각화하며, 그 기록을 타임라인과 AI 블로그 작성으로 이어주는 서비스입니다.

이 저장소는 **PicTree의 프론트엔드 애플리케이션**입니다. 사용자가 사진을 업로드하고, 지도에서 기록을 확인하고, 타임라인과 블로그 작성까지 자연스럽게 이어지는 화면 흐름과 인터랙션을 구현합니다.

<br/>

## Service Vision

PicTree는 단순히 사진을 보관하는 서비스가 아니라, 사진에 담긴 장소와 시간을 다시 연결해 사용자가 자신의 여행을 하나의 이야기로 정리할 수 있는 경험을 지향합니다.

- **사진 기반 기록:** 사진의 위치 정보를 활용해 장소 기록을 쉽게 생성합니다.
- **지도 기반 회상:** 저장된 장소와 이동 경로를 지도에서 한눈에 확인합니다.
- **이야기로 확장:** 흩어진 기록을 타임라인과 블로그 글로 자연스럽게 이어갑니다.

<br/>

## Frontend Focus

PicTree 프론트엔드는 사용자가 복잡한 기록 과정을 느끼지 않도록 **지도, 사진 업로드, 입력 폼, 타임라인, 블로그 작성 화면을 하나의 사용 흐름으로 연결**하는 데 집중합니다.

- **User Flow:** 로그인 이후 지도 홈을 중심으로 기록 생성, 동선 확인, 타임라인 조회, 블로그 작성으로 이어지는 화면 흐름을 구성합니다.
- **Map Interaction:** Kakao Maps SDK를 활용해 현재 위치, 사진 기반 마커, 저장된 장소, 동선을 지도 위에 시각화합니다.
- **Image Metadata:** `exifr`를 활용해 업로드한 사진의 위치 데이터를 추출하고 기록 생성 폼과 연결합니다.
- **State Management:** TanStack Query와 Zustand를 분리해 서버 상태와 클라이언트 상태를 관리합니다.
- **Feature-based Architecture:** 기능 단위로 UI, API, Hook, Type을 모아 팀원이 병렬로 작업하기 쉬운 구조를 유지합니다.

<br/>

## Main Features

| 기능 | 설명 |
| :--- | :--- |
| 회원가입 / 로그인 | 사용자의 서비스 진입과 인증 흐름을 담당합니다. |
| 지도 홈 | 현재 위치, 저장된 장소, 사진 기반 마커, 이동 동선을 표시합니다. |
| 기록 생성 | 사진 업로드, 위치 데이터 추출, 장소 설명, 날짜, 한 줄 코멘트를 입력합니다. |
| 타임라인 | 날짜별 기록을 카드 형태로 정리해 보여줍니다. |
| AI 블로그 작성 | 저장된 기록과 동선을 기반으로 블로그 초안 작성을 지원합니다. |
| 마이페이지 | 구독, 결제, 여행 캘린더, 즐겨찾기 장소, 알림 설정을 관리합니다. |

<br/>

## Service Flow

```text
첫 화면
└── 회원가입 / 로그인
    └── 지도 홈
        ├── 현재 위치 확인
        ├── 사진 업로드 및 기록 생성
        │   ├── 위치 데이터 추출
        │   ├── 장소 정보 입력
        │   └── 지도 마커 표시
        ├── 타임라인 조회
        ├── AI 블로그 작성
        └── 마이페이지
            ├── 구독 및 결제
            ├── 여행 캘린더
            ├── 즐겨찾기 장소
            └── 알림 설정
```

<br/>

## Tech Stack

| 분류 | 기술 | 비고 |
| :--- | :--- | :--- |
| Core | React, TypeScript | UI 라이브러리 및 정적 타입 |
| Build | Vite | 개발 서버 및 빌드 도구 |
| Style | Tailwind CSS | 유틸리티 기반 스타일링 |
| Routing | React Router | SPA 라우팅 |
| Server State | TanStack Query | 서버 데이터 캐싱 및 패칭 |
| Client State | Zustand | 전역 클라이언트 상태 관리 |
| Network | Axios | API 요청 |
| Form | React Hook Form | 폼 상태 및 검증 |
| Map | Kakao Maps SDK | 지도, 마커, 동선 표시 |
| Image Metadata | exifr | 사진 위치 정보 추출 |
| PWA / Push | web-push | PWA 푸시 알림 |
| Quality | ESLint, Prettier | 코드 품질 및 포맷팅 |

<br/>

## Getting Started

이 프로젝트는 **Node.js 20 이상** 환경을 권장합니다.

### 1. Clone

```bash
git clone https://github.com/PicTree-UMC/PicTree-Frontend.git
cd PicTree-Frontend
```

### 2. Install

```bash
npm install
```

팀원과 동일한 의존성 버전으로 설치하려면 아래 명령어를 사용합니다.

```bash
npm ci
```

### 3. Environment Variables

루트 디렉터리에 `.env` 파일을 생성하고 `.env.example`을 참고해 값을 입력합니다.

```env
VITE_API_BASE_URL=
VITE_KAKAO_MAP_APP_KEY=
```

### 4. Run

```bash
npm run dev
```


### 5. Build

```bash
npm run build
```

### 6. Lint

```bash
npm run lint
```

<br/>

## Project Structure

PicTree는 **기능 중심 아키텍처**를 사용합니다. 특정 기능에서만 사용하는 UI, API, Hook, Type은 해당 feature 폴더 안에 배치합니다.

```text
src/
├── app/                 # 앱 루트 컴포넌트
├── features/            # 도메인별 기능 모음
│   ├── auth/            # 회원가입, 로그인
│   ├── home/            # 지도 홈, 마커, 기록 생성
│   ├── timeline/        # 타임라인 카드 및 리스트
│   ├── profile/         # 구독, 결제, 즐겨찾기, 알림 설정
│   ├── blog/            # AI 블로그 작성
│   └── journey/         # 저장된 동선 조회 및 시각화
├── router/              # 라우터 매핑
├── shared/              # 공용 컴포넌트, 타입, 상수, 라이브러리 설정
│   ├── components/
│   ├── constants/
│   ├── lib/
│   └── types/
├── store/               # 전역 클라이언트 상태
└── main.tsx             # QueryClientProvider, RouterProvider 설정
```

### Feature Folder

```text
features/{featureName}/
├── api/                 # 해당 feature API 요청
├── components/          # 해당 feature 전용 컴포넌트
├── hooks/               # 해당 feature 전용 Hook
├── types/               # 해당 feature 전용 타입
└── {FeatureName}Page.tsx
```

<br/>


## Contribution Guide

자세한 협업 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인합니다.

### Branch

```text
type/shortDescription
```

```bash
git switch -c feat/loginPage
git switch -c fix/mapMarkerPosition
git switch -c docs/updateReadme
```

### Commit

```text
type: summary
```

```bash
git commit -m "feat: add login page"
git commit -m "fix: correct marker coordinate parsing"
git commit -m "docs: update readme"
```

### Pull Request

PR 제목은 대표적인 작업 내용을 한국어로 작성합니다.

```text
[feat] 로그인 화면 추가
```

PR을 올리기 전 아래 명령어를 실행합니다.

```bash
npm run lint
npm run build
```

<br/>
