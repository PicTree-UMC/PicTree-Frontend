import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/*
  색 규칙 강제 — docs/design-guidelines.md §1.1(canonical) · §1.3(폐기된 값)

  왜 문서가 아니라 lint 냐: 이 저장소는 옛 팔레트를 **두 번** 되살렸다(#5C6F2B·#89986D 11곳,
  PR #230 에서 걷어냈다). 유입 경로는 문서를 안 읽어서가 아니라 **옆 화면 복사**였고, 그 경로는
  문서가 못 막는다. 게다가 값이 canonical 과 비슷해서 화면으로도 리뷰로도 안 걸린다
  (#5C6F2B 와 #5B6B38 은 나란히 놓지 않으면 같은 색이다). CI 가 PR 마다 lint 를 돌리므로
  여기 넣으면 그날부터 잡힌다.

  ⚠️ **대괄호 형태(`[#hex]`)만 잡는다 — 이게 규칙의 요점이다.**
  hex 가 정당한 자리가 20곳 넘게 있고 전부 Tailwind 클래스가 **아니다**:
    · 원시 SVG 속성 — `fill="#2c3930"` `stroke="#5B6B38"` (클래스가 안 먹는다)
    · 인라인 style 로 들어가는 prop — `Sheet` 의 `handleColor="#D9D9D9"`
    · 지도 SDK 등 문자열 옵션 — `strokeColor: '#7A5C3A'`, `useBodyBackground('#000000')`
  bare hex 를 잡으면 이것들이 전부 오탐이 되어 규칙이 disable 로 덮인다. 대괄호를 요구하면
  **"토큰을 써야 하는데 안 쓴 자리"에 정확히 겹친다.**

  ⚠️ 주석은 원래 안 걸린다 — Literal/TemplateElement 는 AST 노드고 주석은 노드가 아니다.
  그래서 "종전엔 #303030 이 섞여 있었다" 같은 경위 기록이 살아남는다. 그건 지우면 안 된다.
*/
const withToken = {
  '5b6b38': 'pictree-700',
  ecf6d8: 'pictree-100',
  c5d89d: 'pictree-300',
  '788f4a': 'pictree-500',
  d9d9d9: 'line',
  ececec: 'line-soft',
  '2c3930': 'ink',
  '60655c': 'ink-muted',
  b4b4b4: 'ink-disabled',
  fffcef: 'cream',
  f6f0d7: 'cream-sub',
  dc2626: 'error',
  fef7f7: 'error-surface',
  '7a5c3a': 'bark',
};

/** 폐기된 값 → `[대신 쓸 토큰, 정체]`. 표 전문은 docs/design-guidelines.md §1.3. */
const deprecated = {
  '5c6f2b': ['pictree-700', '옛 팔레트 700'],
  '89986d': ['pictree-500', '옛 팔레트 500'],
  '9cab84': ['pictree-300', '옛 팔레트 400'],
  '4f8d34': ['pictree-700', '초기 라임그린'],
  '8bcf5d': ['pictree-500', '초기 라임그린'],
  e5f7d9: ['pictree-100', '초기 라임그린'],
  '8da071': ['pictree-500', '눈대중 올리브'],
  '879b54': ['pictree-500', '눈대중 올리브'],
  '7f9648': ['pictree-500', '눈대중 올리브'],
  abc582: ['pictree-300', '눈대중 올리브'],
  '111111': ['ink', '순검정'],
  '303030': ['ink', '근사 검정'],
  '20251f': ['ink', 'blog·premium 본문색 드리프트'],
  '8d8d8d': ['ink-muted', '구 보조 텍스트, 3.2:1 로 대비 미달이었다'],
  '90908f': ['ink-muted', '구 보조 텍스트'],
  ff4b4b: ['error', '옛 에러 빨강'],
  e6e6e6: ['line-soft', 'LINE 토큰 이전의 회색'],
  e5e5e5: ['line-soft', 'LINE 토큰 이전의 회색'],
  ededed: ['line-soft', 'LINE 토큰 이전의 회색'],
  e4e5e6: ['line-soft', 'LINE 토큰 이전의 회색'],
  e2e2e2: ['line', 'LINE 토큰 이전의 회색'],
  d4d4d4: ['line', 'LINE 토큰 이전의 회색'],
  fffdf7: ['cream` 또는 `white', '크림 위에 뜨는 면은 흰색이다'],
  fffdf4: ['cream', '크림 근사값'],
  faf8ef: ['cream', '크림 근사값'],
};

/**
 * `[#abc]`/`[#aabbcc]` 형태만 잡는 정규식. 코드가 대소문자를 섞어 써서 문자 클래스로 편다
 * (esquery 셀렉터의 `/regex/` 에는 `i` 플래그를 못 붙인다).
 */
const bracketed = (hex) =>
  `\\[#${[...hex].map((c) => (/[a-f]/.test(c) ? `[${c}${c.toUpperCase()}]` : c)).join('')}\\]`;

/**
 * **색 하나에 규칙 하나씩** 만든다. `no-restricted-syntax` 의 message 는 셀렉터마다 고정이라
 * 여러 색을 한 셀렉터에 묶으면 위반 하나에 매핑표 전체가 쏟아진다 — 쓴 사람이 그 목록에서
 * 자기 색을 찾아야 하는 메시지는 결국 disable 로 덮인다. 색마다 나누면 "이 색 → 이 토큰"
 * 한 줄로 끝난다.
 *
 * `Literal` 은 일반 className, `TemplateElement` 는 템플릿 리터럴·clsx 안쪽이다. **둘 다 봐야**
 * 새는 곳이 없다.
 */
const rulesFor = (map, section) =>
  Object.entries(map).flatMap(([hex, entry]) => {
    const [token, why] = Array.isArray(entry) ? entry : [entry, null];
    // 조사를 피해 화살표로 쓴다 — `ink`(잉크)는 '를', `pictree-700`(칠백)은 '을' 이라 한 형태로 못 맞춘다.
    const message = why
      ? `#${hex} → \`${token}\` — ${why} (docs/design-guidelines.md ${section})`
      : `#${hex} → \`${token}\` (docs/design-guidelines.md ${section})`;
    return [
      { selector: `Literal[value=/${bracketed(hex)}/]`, message },
      { selector: `TemplateElement[value.raw=/${bracketed(hex)}/]`, message },
    ];
  });

const colorRules = [
  ...rulesFor(withToken, '§1.1 토큰이 있는 색'),
  ...rulesFor({ ...deprecated, 111: ['ink', '순검정 축약형'] }, '§1.3 폐기된 색'),
];

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': ['error', ...colorRules],
    },
  },
  eslintConfigPrettier,
);
