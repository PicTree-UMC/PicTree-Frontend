# PicTree 프론트엔드 기능 명세서

> 작성 기준 커밋: `869e304` (main) · 최종 갱신: 2026-07-25 (최초 작성 2026-07-24, 기준 `d772084`)
> 이 문서는 `src/` 실제 소스코드와 교차 검증되도록 작성했다. 경로·컴포넌트명은 코드와 1:1 대응한다.

---

## 1. 프로젝트 소개

**PicTree** — 여행 사진을 지도에 기록하고 동선·타임라인·AI 블로그로 보여주는 **모바일 웹(PWA)**.

- 시안이 전부 390px 모바일 프레임 → **데스크톱 레이아웃 없음** (모바일 전용)
- 스택: React 19 + TypeScript + Vite 6 + Tailwind 3 + react-router 7 + TanStack Query 5 + Zustand + axios
- 외부 SDK: 카카오맵(지도), 토스페이먼츠(결제, 미설치)
- 인증: 소셜 로그인 (카카오 / 구글 OAuth)

**핵심 기능**
1. 지도 위에 방문지를 나무 마커로 기록 (홈)
2. 날짜별 방문 장소 타임라인 (타임라인)
3. 저장한 동선 목록·경로 뷰·사진 앨범 (동선)
4. AI 블로그 자동 생성 (스텁)
5. 프리미엄 구독 결제 (UI 완성, 연동 0)

---

## 2. 화면 목록 (라우팅 구조)

라우트 정의: [src/router/index.tsx](src/router/index.tsx) · 경로 상수: [src/shared/constants/routes.ts](src/shared/constants/routes.ts)

| 화면 이름 | Route Path | Page Component | 주요 기능 | Layout | 담당자 |
| --- | --- | --- | --- | --- | --- |
| 로그인/회원가입 | `/auth`, `/auth/login`, `/auth/signup` | `AuthPage` | 소셜 로그인, 약관 동의, 권한 요청 | ✕ | Gureum |
| OAuth 콜백 | `/auth/callback` | `AuthCallbackPage` | 소셜 인증 코드 수신·토큰 교환 | ✕ | Gureum |
| 홈(지도) | `/home` | `HomePage` | 카카오맵 + 나무 마커, 마커 상세 시트 | ✓ | ciracino88 |
| 타임라인 | `/timeline` | `TimelinePage` | 날짜별 기록 목록, 액션시트·삭제 | ✓ | KIM JAE WON |
| 동선 목록 | `/journey` | `JourneyPage` | 동선 카드 목록, 이름변경·삭제, 사진앨범 | ✓ | endl24 |
| 동선 경로뷰 | `/journey/view` | `RouteViewPage` | 지도 위 경로·번호 마커, 날짜 탭 | ✕ | endl24 |
| 프로필 | `/profile` | `ProfilePage` | 사용자 정보, 메뉴 진입 | ✓ | KIM JAE WON |
| 구독 관리 | `/profile/subscription` | `SubscriptionPage` | 구독 상태 확인 | ✓ | KIM JAE WON |
| 여행 캘린더 | `/profile/calendar` | `TravelCalendarPage` | 방문 날짜 캘린더 | ✓ | KIM JAE WON |
| 즐겨찾기 | `/profile/favorites` | `FavoritesPage` | 즐겨찾기 목록, 정렬 | ✓ | KIM JAE WON |
| 개인정보처리방침 | `/profile/privacy` | `PrivacyPolicyPage` | 방침 전문 표시 | ✓ | KIM JAE WON |
| AI 블로그 | `/blog` | `BlogPage` | 블로그 생성 플로우 (스텁) | ✓ | Gureum |
| 프리미엄 결제 | `/premium` | `PremiumPage` | 요금제 선택, 결제(미연동) | ✓ | Gureum |
| 카메라 | `/camera` | `CameraPage` | 카메라 스트림, 촬영·기록 입력 | ✕ | ciracino88 |
| (루트) | `/` | — | `/home` 으로 리다이렉트 | ✕ | — |

> **담당자 판정 근거**: 각 feature 디렉터리의 `git log --no-merges` 기준 최다 커밋 작성자.
> **변경 이력**: `/record`(RecordPage)는 PR #16 에서 카메라로 통합되며 **제거됨**. `/auth/callback`·`/profile/privacy` 추가.

### 라우팅 구조 특징

- `/` → `/home` **리다이렉트** (`<Navigate replace />`)
- `Layout` **중첩 라우트**: 하단 탭바가 필요한 10개 화면만 `<Layout>` 자식으로 묶임
- `Layout` **미적용**: 인증·OAuth 콜백·카메라·경로뷰는 전체화면 (탭바 없음)
- ⚠️ **인증 가드(`ProtectedRoute`) 없음** — 로그인 안 해도 모든 보호 경로 접근 가능. `authStore`로 토큰은 저장되지만 라우트 차단 로직 미구현 (부록 TBD)
- `errorElement` **미연결** — `ErrorPage` 컴포넌트는 있으나 라우터에 배선 안 됨

### 진입 경로 (내비게이션 흐름)

```
/ ─(redirect)→ /home ─┬─[하단탭]→ /timeline, /journey, /profile
                      ├─[마커 촬영]→ /camera
                      └─[배너]→ /journey/view

/auth ─[소셜 로그인]→ (카카오/구글) → /auth/callback → 토큰 저장 → /home
/journey ─[카드 메뉴]→ 이름변경/삭제(모달) · 사진앨범(시트) · AI블로그(死 버튼)
/profile ─[메뉴]→ subscription, calendar, favorites, privacy, /premium
/premium ─[구독]→ 결제확인 시트 → 완료 모달 (실제 결제 없음)
```

---

## 3. 컴포넌트 구조

### 3-1. 공통 컴포넌트 (`src/shared/components/`)

| 컴포넌트명 | 설명 | 사용 위치 | 담당 |
| --- | --- | --- | --- |
| `AppShell` | 폭 캡·가운데 정렬·뷰포트 높이 확정 셸 (0층) | 전체 (main.tsx) | endl24 |
| `Layout` | 스크롤 영역 + 하단 탭바 배치 (2층) | 탭 라우트 10개 | endl24 |
| `BottomTabBar` | 하단 탭 내비게이션 | `Layout` 내부 | endl24 |
| `Button` | 공통 버튼 | 공용 | — |
| `Input` | 공통 입력 | 공용 | — |
| `Modal` | 공통 모달 셸 | 공용 | — |
| `ErrorPage` | 에러 화면 | ⚠️ **라우터 미배선** | — |
| `PicTreeMark` | 로고 마크 | 공용 | — |
| `toast/Toaster` + `toastStore` | 전역 토스트 (Zustand) | 전역 | endl24 |

### 3-2. 공통 훅 (`src/shared/hooks/`)

| 훅 | 용도 |
| --- | --- |
| `useKeyboardOffset` | iOS 키보드 오프셋 (바텀시트 입력창) |
| `useBodyBackground` | body 배경색 제어 |
| `useLockBodyScroll` | 모달·시트 열릴 때 배경 스크롤 잠금 |

### 3-3. 공통 라이브러리 (`src/shared/lib/`)

| 파일 | 역할 |
| --- | --- |
| `httpClient.ts` | axios 인스턴스 — **모든 API 는 이걸 통함**. `baseURL` 기본값 `https://tenma.store/api/v1`, `withCredentials: true` (쿠키 인증) |
| `queryClient.ts` | TanStack Query 설정 (staleTime 60s, retry 1) |
| `kakaoSdkStore.ts` | 카카오맵 SDK 로드 상태 (Zustand) |
| `date.ts` | 날짜 포맷 유틸 |

### 3-4. 페이지별 주요 컴포넌트 (feature 로컬)

- **auth**: `AuthShell`, `WelcomeView`, `TermsAgreementView`, `DevicePermissionModal` + `lib/oauth.ts`, `store/authStore.ts`
- **home**: `MarkerDetailSheet`, `TreeMarker`, `JourneyBanner` + `useKakaoMap`, `useMapMarkers`
- **journey**: `JourneyList`, `JourneyCard`, `BottomSheet`, `RenameModal`, `DeleteModal`, `PhotoAlbumSheet`, `PlaceTrail`, `SaveRouteSheet` + `api/journeyApi`, `hooks/useJourneys·useDeleteJourney·useRenameJourney`
- **timeline**: `TimelineGroup`, `TimelineCard`, `TimelineHeader`, `RecordActionSheet`, `DeleteRecordModal`, `StorageBanner`
- **premium**: `PlanCard`, `BenefitTable`, `PaymentConfirmSheet`, `PaymentCompleteModal`, `ModalShell`
- **blog**: `BlogComposer`, `DraftCard`, `GeneratingCard`, `DateRangeCard` + `useBlogFlow`
- **profile**: `RouteFootprintBanner`, `NearbyTreeAlert`, `MapNotifications`

---

## 4. 데이터 관리 (Mock / API 연동 여부)

**원칙**: 컴포넌트는 `mocks/` 를 직접 import 하지 않고 `api/` 를 거친다. 목데이터는 API 함수 안에서 지연과 함께 반환한다 (실 연동 시 그 파일만 교체).

| 도메인 | 상태 | 근거 파일 | 비고 |
| --- | --- | --- | --- |
| **auth** | 🟢 실 API 연동 | `api/authApi.ts`, `lib/oauth.ts` → `httpClient` | 소셜 로그인(카카오/구글) OAuth 리다이렉트 플로우. 토큰 `authStore` 저장 |
| **journey** | 🟡 API 레이어 완료 (목 데이터) | `api/journeyApi.ts` → `hooks/useJourneys` | ✅ 목을 API 레이어 뒤로 분리 완료. 페이지는 훅만 사용. **함수 본문만 교체하면 실 연동** (`/routes`) |
| **timeline** | 🟡 API 함수 준비 | `api/timelineApi.ts` → `httpClient` | 엔드포인트 `/timeline` 은 추측, 백엔드 확정 후 교체 |
| **home** | 🔴 Mock | `mocks/markers.ts` | API 레이어 없음 |
| **premium** | 🔴 하드코딩 | `PremiumPage.tsx` | 요금제 가격 하드코딩. 토스 SDK 미설치 |
| **blog** | 🔴 로컬 스텁 | `hooks/useBlogFlow.ts` | 서버 무관, 화면 플로우만 |
| **camera** | ⚙️ 디바이스 | `useCameraStream`, `captureFrame` | 카메라 스트림 (API 무관) |
| **profile** | 🔴 로컬 | — | API 레이어 없음 |

🟢 = 실 API 연동 · 🟡 = API 레이어/함수 준비(목 반환) · 🔴 = 목/하드코딩 · ⚙️ = 디바이스 API

### 백엔드 대기 중 (데이터 계약 미확정 — TBD)

- 공통 응답 래퍼 형식 (`{ data, code, message }` 유무)
- 토큰 만료·갱신 정책 (현재 `httpClient`에 토큰 재발급 인터셉터 없음)
- 날짜 필드 형식 (ISO 8601 여부) — 현재 목은 `"2024년 4월 7일"` **포맷된 문자열**
- `/routes` 페이지네이션 유무
- 사진 필드명 (`imageUrl`/`photoUrl`/…) — 스키마는 시안만 보고 정한 추측
- ⚠️ **네이밍 불일치**: 코드는 `Journey`, API 는 `/routes` — 개명은 별도 브랜치로 유지 결정 (`journeyApi.ts` 주석)

---

## 5. 상태 관리

| 방식 | 사용처 | 파일 |
| --- | --- | --- |
| **Zustand** | 인증 상태·토큰 (localStorage 영속) | `features/auth/store/authStore.ts` |
| | 구독 상태 | `features/premium/store/subscriptionStore.ts` |
| | 전역 토스트 | `shared/components/toast/toastStore.ts` |
| | 카카오 SDK 로드 상태 | `shared/lib/kakaoSdkStore.ts` |
| **TanStack Query** | 동선 조회·삭제·이름변경 | `journey/hooks/useJourneys·useDeleteJourney·useRenameJourney` |
| | 타임라인 조회·삭제 | `timeline/hooks/useTimeline·useDeleteRecord` |
| | 인증(로그인/가입) | `auth/AuthPage.tsx` |
| | 카메라 | `camera/CameraPage.tsx` |
| **Context API** | **사용 안 함** (0곳) | — |
| **useState** | 각 페이지 로컬 UI 상태 | 전 페이지 |

- `src/store/` 전역 스토어 디렉터리는 여전히 비어 있음 (스토어는 각 feature 로컬)
- `authStore`: `accessToken`을 `localStorage('pictree.accessToken')`에 저장 → 새로고침해도 로그인 유지
- ⚠️ `subscriptionStore`는 `persist` 미적용 → **새로고침 시 구독 상태 소실** (트러블슈팅 6-4)

---

## 6. 트러블 슈팅

> 상세 원인·측정값은 `.claude/TROUBLESHOOTING.md` 에 누적. 아래는 대표 6건 요약.

### 6-1. 하단 탭바가 홈 인디케이터와 겹침

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | iOS 안전영역(홈 인디케이터) 위로 탭바가 겹쳐 아이콘 하단이 잘림 |
| 발생 시점 | PR #22 리뷰 |
| 담당자 | endl24 |
| 원인 | `viewport-fit=cover` 로 뷰포트가 홈 인디케이터까지 확장, `box-sizing`·`pb-safe` 상호작용 |
| 해결 여부 | ✅ 해결 (실기기 확인, 커밋 `e5ac43d`) |
| 해결 방법 | 탭바에 `pb-safe` 적용 + 자체 여백 조정 |
| 참고 자료 | TROUBLESHOOTING 2-1 |

### 6-2. 탭 전환 시 이전 스크롤 위치가 남음

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | 다른 탭으로 이동해도 이전 화면의 스크롤 위치가 유지됨 |
| 발생 시점 | PR #22 리뷰 |
| 담당자 | endl24 |
| 원인 | 스크롤 컨테이너가 AppShell·Layout 두 곳에 존재, `<ScrollRestoration>` 무동작 |
| 해결 여부 | ✅ 해결 (커밋 `b9fe237`) |
| 해결 방법 | 라우트 변경 시 스크롤 컨테이너 top 리셋 |
| 참고 자료 | TROUBLESHOOTING 3-1 ~ 3-4 |

### 6-3. 바텀시트 입력창 포커스 시 배경 전체가 밀려 올라감

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | iOS 에서 시트 입력창 포커스 시 배경 페이지 전체가 스크롤됨 |
| 발생 시점 | 동선 저장 시트 구현 중 |
| 담당자 | endl24 |
| 원인 | iOS 가 입력창 포커스 시 배경을 강제로 밀어올림 |
| 해결 여부 | ✅ 해결 |
| 해결 방법 | 버튼→입력창 전환 + `focus({ preventScroll })` (`SaveRouteSheet` + `useKeyboardOffset`) |
| 참고 자료 | TROUBLESHOOTING 4-1 |

### 6-4. 새로고침하면 구독이 풀림

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | 구독 후 새로고침하면 무료 플랜으로 되돌아감 |
| 발생 시점 | 프리미엄 화면 구현 중 |
| 담당자 | Gureum |
| 원인 | `subscriptionStore` 가 메모리 전용 (persist 없음), 서버 상태 미연동 |
| 해결 여부 | 🟡 미해결 (M3 에서 `GET /subscriptions/me` 로 전환 예정) |
| 해결 방법 | (예정) 서버 상태로 전환 |
| 참고 자료 | TROUBLESHOOTING 5-1 |

### 6-5. 루트 외 모든 경로에서 404

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | 배포 시 `/timeline` 등 새로고침하면 404 |
| 발생 시점 | 배포 사전 점검 |
| 담당자 | endl24 |
| 원인 | SPA 히스토리 폴백 미설정 |
| 해결 여부 | ✅ 해결 (`netlify.toml` 에 `/* → /index.html` rewrite 200, PR #36) |
| 해결 방법 | Netlify redirects 로 모든 요청을 `index.html` 로 rewrite |
| 참고 자료 | TROUBLESHOOTING 1-1 |

### 6-6. Netlify 시크릿 스캐너가 빌드를 막음

| 항목 | 내용 |
| --- | --- |
| 문제 상황 | `VITE_*` 공개 키가 번들에 인라인되자 Netlify 시크릿 스캐너가 빌드 실패 처리 |
| 발생 시점 | Netlify 배포 직후 (PR #41) |
| 담당자 | endl24 |
| 원인 | 브라우저가 어차피 보는 공개 값(`VITE_`)인데 스캐너가 시크릿으로 오인 |
| 해결 여부 | ✅ 해결 (커밋 `482e851`) |
| 해결 방법 | `SECRETS_SCAN_OMIT_KEYS` 로 공개 `VITE_` 키 제외. **카카오 REST 키 등 진짜 비밀은 프론트에 두지 않고 백엔드로** |
| 참고 자료 | `netlify.toml` 주석 |

---

## 7. 배포 주소

🟢 **배포됨** (Netlify)

| 항목 | 값 |
| --- | --- |
| 배포 URL | **https://picturetree.netlify.app** |
| 호스팅 | Netlify (`netlify.toml` 로 설정, 저장소가 단일 출처) |
| 빌드 | `npm run build` (`tsc -b && vite build`) → `dist` |
| Node | 20 |
| SPA 폴백 | `/* → /index.html` (status 200 rewrite) ✅ |
| 백엔드 API | `https://tenma.store/api/v1` (`VITE_API_BASE_URL`) |
| OAuth 콜백 | `https://picturetree.netlify.app/auth/callback` |

로컬 실행:

```bash
npm run dev
```

---

## 부록: 미결정 항목 (TBD — 팀 확인 필요)

1. **`ProtectedRoute` 인증 가드** — `authStore`로 토큰은 저장되나 라우트 차단 미구현. 로그인 없이 `/home`·`/profile` 접근 가능
2. **토큰 갱신 인터셉터** — `httpClient`에 401 재발급 로직 없음. 토큰 만료 정책 백엔드 확인 필요
3. **`Journey` ↔ `/routes` 네이밍** — 코드 용어 유지 + API 레이어 매핑으로 결정됨. 개명은 별도 브랜치
4. **AI 블로그 死 버튼** — `JourneyPage` 의 `onAIBlog`, `/blog` 스텁. 비활성 표시/토스트/유지 미결
5. **요금제 가격 불일치** — 하드코딩. 서버(`GET /subscription-plans`) 이관 예정
6. **`errorElement` 배선** — `ErrorPage` 있으나 라우터 미연결
7. **결제 연동 전체** — 토스 SDK 미설치, 승인 플로우·빌링키 등록 화면 미구현 (M3)
