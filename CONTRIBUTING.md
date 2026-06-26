# Contributing Guide

PicTree 프론트엔드 팀의 Git, PR, 코드 작성 컨벤션입니다.

## Branch Convention

```txt
type/issue-number-short-description
```

예시:

```txt
feat/12-login-page
fix/18-map-marker-position
docs/24-readme
refactor/31-home-feature-structure
```

### Branch Type

| Type | Description |
| --- | --- |
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 포맷팅, 세미콜론 등 코드 동작 변화 없는 수정 |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 빌드, 패키지, 설정 등 기타 작업 |

## Commit Convention

커밋 메시지는 아래 형식을 사용합니다.

```txt
type(scope): summary
```

예시:

```txt
feat(auth): add login form
fix(home): correct marker coordinate parsing
docs(readme): add project setup guide
chore(config): setup eslint and prettier
```

### Commit Rules

- summary는 영어 소문자로 시작하고 명령형으로 작성합니다.
- 한 커밋에는 하나의 의도를 담습니다.
- scope는 feature 또는 변경 영역을 사용합니다. 예: `auth`, `home`, `timeline`, `router`, `shared`, `config`.

## Pull Request Convention

PR 제목은 커밋 컨벤션과 동일하게 작성합니다.

```txt
feat(auth): add login page
```

### PR Checklist

- 변경 목적과 구현 내용을 명확히 작성합니다.
- UI 변경이 있다면 스크린샷 또는 화면 녹화를 첨부합니다.
- 테스트한 내용을 작성합니다.
- 관련 이슈가 있다면 연결합니다.
- 리뷰어가 확인해야 할 부분을 남깁니다.

## Review Rules

- 팀원은 매주 2개 이상의 PR 리뷰를 작성합니다.
- 리뷰 코멘트는 이유와 제안을 함께 남깁니다.
- 수정 요청 반영 후에는 어떤 방식으로 반영했는지 답글을 남깁니다.

## Naming Convention

| Target | Convention | Example |
| --- | --- | --- |
| 변수, 함수 | camelCase | `userName`, `getUserProfile` |
| 컴포넌트 | PascalCase | `LoginPage`, `TimelineCard` |
| 타입, 인터페이스 | PascalCase | `UserProfile`, `LoginFormValues` |
| 상수 | UPPER_SNAKE_CASE | `DEFAULT_MAP_ZOOM` |
| 파일명 | PascalCase for components, camelCase for utilities | `Button.tsx`, `formatDate.ts` |

## Folder Rules

- feature 전용 코드는 `src/features/{feature}` 내부에 둡니다.
- 여러 feature에서 함께 쓰는 코드는 `src/shared` 내부에 둡니다.
- 전역 상태는 `src/store` 내부에 둡니다.
- 라우팅 설정은 `src/router` 내부에서 관리합니다.
- 외부 API 클라이언트와 공통 라이브러리 설정은 `src/shared/lib`에서 관리합니다.

## Troubleshooting

문제 해결 과정은 [docs/troubleshooting-template.md](./docs/troubleshooting-template.md) 양식으로 기록합니다.
