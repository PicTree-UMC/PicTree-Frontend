# Contributing Guide

PicTree 프론트엔드 팀의 Git, PR, 코드 작성 컨벤션입니다. 팀원은 아래 양식을 그대로 복사해 브랜치, 커밋, PR을 작성합니다.

## Workflow

```bash
git switch main
git pull origin main
git switch -c feat/loginPage

# 작업 후
npm run lint
npm run build

git add .
git commit -m "feat: add login page"
git push -u origin feat/loginPage
```

## Issue Convention

작업은 이슈 생성에서 시작합니다. 이슈를 만들고, 그 이슈 번호를 브랜치와 PR에 연결합니다.

### Issue Title

PR 제목과 동일하게 `[type] 작업 내용` 형식으로 한국어로 작성합니다.

```txt
[feat] 로그인 화면 추가
[fix] 마커 좌표가 어긋나는 문제
[chore] 이슈 템플릿 추가
```

### Template

이슈 생성 시 `.github/ISSUE_TEMPLATE/`의 양식이 자동으로 표시됩니다.

| 템플릿 | 용도 | 라벨 |
| --- | --- | --- |
| 기능 개발 | 새로 구현할 기능 | `feat` |
| 버그 리포트 | 동작하지 않는 부분 | `fix` |
| 기타 작업 | 리팩토링, 문서, 설정 | `chore` |

### Rules

- 하나의 이슈에는 하나의 작업 단위를 담습니다.
- `Tasks` 체크박스로 작업을 쪼개 진행 상황을 공유합니다.
- PR 본문에 `Closes #12`를 적으면 머지 시 이슈가 자동으로 닫힙니다.

## Branching Strategy

**`main` + 단명 기능 브랜치 2단계 구조를 씁니다.** `dev`/`release` 같은 중간 통합 브랜치는 두지 않습니다.

### `main` 머지는 배포가 아닙니다

이 전제가 나머지를 전부 결정합니다.

**Netlify 자동 배포를 쓰지 않습니다.** 머지마다 빌드가 도는 방식은 배포할 것이 없는 변경(문서·리팩터링)에도 빌드 토큰을 써서 낭비가 컸습니다. 지금은 **Netlify에서 deploy를 직접 실행하는 시점에만** 실제 배포가 일어납니다.

`netlify.toml`에 있는 것은 빌드 명령(`npm run build`)·산출물 경로·리다이렉트뿐입니다. **언제 배포할지는 이 파일이 정하지 않습니다** — 대시보드의 auto publish 설정이 정하고, 그것을 꺼 둔 상태입니다.

### 그래서 `main`이 `dev` 자리를 대신합니다

3단계(`main`/`dev`/`feature`) 구조에서 `dev`가 맡는 일은 **기능을 모아 두고 테스트하는 공간**입니다. 우리는 그 자리를 `main`이 겸합니다 — 머지해도 사용자에게 나가지 않으므로 겸할 수 있습니다.

```txt
feature/*  ──PR──▶  main  ──(모아서 기능 테스트)──▶  Netlify deploy 수동 실행  ──▶  배포
                     └── 여기까지는 사용자에게 나가지 않는다
```

`dev`를 따로 두면 이 역할이 둘로 쪼개질 뿐, 새로 얻는 것이 없습니다.

### 이 구조로 얻는 것

1. **브랜치 관리가 단순합니다.** 살아 있는 장기 브랜치가 `main` 하나라, 어디서 잘라 어디로 보낼지 매번 판단할 일이 없습니다.
2. **충돌이 최소화됩니다.** 기능 브랜치가 짧게 살고 곧바로 `main`으로 들어가 갈라져 있는 시간이 짧습니다 — 실제로 충돌 해결을 논의한 적이 아직 없습니다.
3. **Netlify 하나로 끝나는 CI/CD에 맞습니다.** 배포 대상이 한 곳뿐인데 브랜치만 여러 층으로 두면 구조가 도구보다 복잡해집니다.
4. **리뷰를 매번 붙들 수 없는 현실을 구조로 감당합니다.** 모든 PR에 리뷰를 남길 여력이 늘 있지는 않습니다. 단계를 줄여 두면 놓친 리뷰가 밀린 병합으로 쌓이지 않습니다.

### 리뷰와 브랜치 보호

모든 병합은 PR을 거칩니다. 다만 ⚠️ **GitHub 브랜치 보호 규칙(리뷰 승인 필수)은 `main`에 걸려 있지 않습니다** — 리뷰는 관행으로 지켜지고 있을 뿐 강제되지 않습니다.

`main` 머지가 곧 배포는 아니어서 리뷰를 놓친 병합이 곧장 사고가 되지는 않습니다. 그 완충 덕분에 보호 규칙 없이 굴러가고 있고, 배포 전 기능 테스트가 마지막 관문 역할을 합니다.

<br/>

## Branch Convention

### Format

```txt
type/shortDescription
```

### Examples

```txt
feat/loginPage
fix/mapMarkerPosition
docs/updateReadme
refactor/homeFeatureStructure
chore/eslintConfig
```

- `type`: 작업 종류를 작성합니다. 예: `feat`, `fix`, `docs`
- `shortDescription`: 작업 내용을 camelCase로 작성합니다.

### Type

| Type | Description | Example |
| --- | --- | --- |
| `feat` | 새로운 기능 | `feat/loginPage` |
| `fix` | 버그 수정 | `fix/mapMarkerPosition` |
| `docs` | 문서 수정 | `docs/updateReadme` |
| `style` | 코드 동작 변화 없는 스타일 수정 | `style/formatButton` |
| `refactor` | 리팩토링 | `refactor/homeFeatureStructure` |
| `test` | 테스트 추가 또는 수정 | `test/authForm` |
| `chore` | 패키지, 빌드, 설정 등 기타 작업 | `chore/eslintConfig` |

## Commit Convention

### Format

```txt
type: 작업 내용
```

### Examples

```txt
feat: login form 추가
fix: correct marker coordinate parsing
docs: readme 수정
style: format shared button
refactor: split home marker hook
test: add auth form validation test
chore: setup eslint and prettier
```

### Optional Scope

변경 범위를 꼭 구분해야 할 때만 scope를 선택적으로 사용합니다.

```txt
feat(auth): add login form
fix(home): correct marker coordinate parsing
docs(readme): update project introduction
```

### Rules

- summary는 영어 소문자로 시작하고 명령형으로 작성합니다.
- 한 커밋에는 하나의 의도를 담습니다.
- 불필요한 콘솔 로그, 주석, 사용하지 않는 코드는 커밋 전에 제거합니다.

## Pull Request Convention

### PR Title

PR 제목은 대표적인 작업 내용을 한국어로 작성합니다.

```txt
[feat] 로그인 화면 추가
[fix] 올바른 마커 좌표 파싱
[docs] readme 수정
```

### PR Body

아래 양식을 사용합니다. 실제 PR 생성 시에는 `.github/pull_request_template.md`가 자동으로 표시됩니다.

```md
## Summary

- 로그인 페이지 UI와 입력 폼을 추가했습니다.

## Changes

- `AuthPage` 라우트를 추가했습니다.
- 이메일, 비밀번호 입력 필드를 구현했습니다.
- 공용 `Input`, `Button` 컴포넌트를 적용했습니다.

## Screenshots

| 화면 | 이미지 |
| --- | --- |
| 로그인 | 첨부 |

## Test

- [x] `npm run lint`
- [x] `npm run build`
- [ ] 브라우저에서 직접 확인

## Review Points

- 입력 폼 구조가 이후 API 연동에 적절한지 확인해주세요.
```

## Review Rules

- 팀원은 매주 2개 이상의 PR 리뷰를 작성하려고 노력합니다.
- 리뷰 코멘트는 이유와 제안을 함께 남깁니다.
- 수정 요청 반영 후에는 어떤 방식으로 반영했는지 답글을 남깁니다.

### Review Comment Examples

```md
이 로직은 `home/hooks`로 분리하면 컴포넌트가 더 읽기 쉬울 것 같습니다.
```

```md
마커 좌표가 없을 때의 예외 처리가 필요해 보여요. EXIF 정보가 없는 사진도 업로드될 수 있습니다.
```

```md
좋습니다. 다만 이 컴포넌트가 다른 feature에서도 쓰이면 `shared/components`로 옮기는 것도 고려해볼 수 있을 것 같습니다.
```
