import type { Term } from '../types/terms';

/** 동의 화면이 실제로 그리는 형태. */
export type DisplayTerm = {
  /** 체크 상태의 키. */
  key: string;
  /** 서버 약관 id. 동의 저장(`POST /users/me/terms-agreements`)에 이 값을 보낸다. */
  termId: number;
  title: string;
  /** 펼쳤을 때 보여 줄 설명. 서버 `summary` 를 그대로 쓴다. */
  description: string | null;
  /** 약관 전문 링크. 설명이 없을 때 이걸로 대신한다. */
  contentUrl: string | null;
  required: boolean;
};

/**
 * 서버 약관 목록을 화면 형태로 바꾼다.
 *
 * 설명은 서버 `summary` 를 그대로 쓴다. 예전에는 서버가 `title`·`contentUrl`
 * 만 줘서 유형별 로컬 문구를 들고 있었는데, 이제 서버가 본문을 내려준다.
 * 같은 문구를 양쪽에서 관리하면 약관이 개정될 때 화면만 옛 내용을 보여 준다.
 *
 * 목록이 비면 빈 배열이다. 예전에는 로컬 약관으로 폴백했는데 그건 `terms`
 * 테이블이 비어 있던 시절의 임시 조치였고, 지금은 5개가 적재돼 있다. 폴백을
 * 남겨 두면 서버 장애로 약관을 못 받았을 때 **동의 기록이 저장되지 않는데도
 * 가입이 통과된다** — 법적으로 의미 있는 화면이라 그쪽이 더 위험하다.
 */
export const toDisplayTerms = (terms: Term[] | undefined): DisplayTerm[] =>
  (terms ?? []).map((term) => ({
    key: String(term.id),
    termId: term.id,
    title: `[${term.isRequired ? '필수' : '선택'}] ${term.title}`,
    description: term.summary,
    contentUrl: term.contentUrl,
    required: term.isRequired,
  }));
