# PicTree Frontend

한 장의 사진을 하루의 기록과 동선으로 연결하는 PicTree 프론트엔드 저장소입니다.

PicTree는 사진의 위치 정보, 지도, 동선, 블로그 기록을 하나의 흐름으로 묶어 사용자가 흩어진 순간을 다시 돌아볼 수 있게 하는 서비스입니다.

## Tech Stack

| Category | Libraries |
| --- | --- |
| Core | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| State | Zustand |
| Server State | TanStack Query |
| API | Axios |
| Form | React Hook Form |
| Map | Kakao Maps SDK |
| Image Metadata | exifr |
| PWA / Push | web-push |
| Convention | ESLint, Prettier |

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 체크 후 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run lint` | ESLint 검사 |

## Project Structure

```txt
public/
  apple-touch-icon.jpg
  manifest.json
src/
  app/
    App.tsx
  features/
    auth/
    blog/
    home/
    journey/
    profile/
    timeline/
  router/
    index.tsx
  shared/
    components/
    constants/
    lib/
    types/
  store/
  main.tsx
```

## Feature Structure

각 feature는 아래 구조를 기준으로 확장합니다.

```txt
features/{featureName}/
  api/
  components/
  hooks/
  types/
  {FeatureName}Page.tsx
```

## Feature Owners

| Feature | Scope | Owner |
| --- | --- | --- |
| `auth` | 회원가입, 로그인 | 허현 |
| `home` | 지도, 마커, 카메라, 이미지 위치 데이터 추출, 입력 폼, 동선 가시화 | 이승호 |
| `timeline` | 타임라인 카드 작성, 리스트 배치, 공용 컴포넌트 | 김재원 |
| `profile` | 구독, 결제창, 즐겨찾기, 알림 설정 | 미정 |
| `blog` | AI 블로그 작성, 블로그 저장 | 미정 |
| `journey` | 저장된 동선 카드 조회, 리스트 배치, 동선 가시화 | 강두이 |

## Team Rules

- 네이밍 컨벤션은 camelCase를 기본으로 합니다.
- feature 내부 구조를 통일합니다.
- 정기 회의는 매주 화요일 오후 9시에 진행합니다.
- PR 리뷰는 매주 2개 이상 작성합니다.
- 자세한 Git, branch, commit, PR 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인합니다.

## Documentation

- [기여 및 협업 규칙](./CONTRIBUTING.md)
- [폴더 구조 가이드](./docs/folder-structure.md)
- [트러블슈팅 템플릿](./docs/troubleshooting-template.md)
- [KPT 회고 템플릿](./docs/kpt-template.md)
