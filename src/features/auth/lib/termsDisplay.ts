import { AGREEMENT_TERMS } from '../constants/terms';
import type { Term } from '../types/terms';

/** 동의 화면이 실제로 그리는 형태. 서버 약관과 로컬 문구를 합친 결과다. */
export type DisplayTerm = {
  /** 체크 상태의 키. 서버 약관이면 `id`, 로컬 폴백이면 로컬 id 문자열. */
  key: string;
  title: string;
  /** 펼쳤을 때 보여 줄 설명. 서버가 안 주므로 유형별 로컬 문구를 쓴다. */
  description: string | null;
  /** 약관 전문 링크. 설명이 없을 때 이걸로 대신한다. */
  contentUrl: string | null;
  required: boolean;
};

/**
 * 약관 유형 → 화면 설명.
 *
 * ⚠️ 서버 응답에는 설명이 없다 (`title`·`contentUrl` 만 있다). 동의 화면은 각
 * 항목을 펼쳐 무엇에 동의하는지 보여 줘야 해서, 기존에 쓰던 문구를 유형별로
 * 남겨 둔다. 서버가 설명을 내려주기 시작하면 이 맵은 지운다.
 *
 * 여기 없는 유형은 설명 대신 `contentUrl` 링크를 보여 준다.
 */
const DESCRIPTION_BY_TYPE: Record<string, string> = {
  SERVICE: AGREEMENT_TERMS[0].description,
  PRIVACY: AGREEMENT_TERMS[1].description,
  LOCATION: AGREEMENT_TERMS[2].description,
  PUSH: AGREEMENT_TERMS[3].description,
  MARKETING: AGREEMENT_TERMS[4].description,
};

/** 로컬 약관을 화면 형태로. 서버 목록이 비었을 때 쓰는 폴백이다. */
const LOCAL_DISPLAY_TERMS: DisplayTerm[] = AGREEMENT_TERMS.map((term) => ({
  key: term.id,
  title: term.title,
  description: term.description,
  contentUrl: null,
  required: term.required,
}));

/**
 * 서버 약관 목록을 화면 형태로 바꾼다.
 *
 * ⚠️ 서버 목록이 비어 있으면 로컬 문구로 돌아간다. 실서버의 `terms` 테이블이
 * 아직 비어 있는데(`GET /terms` → `[]`), 동의 화면을 빈 채로 두면 사용자가
 * 아무것도 동의하지 않은 상태로 가입을 통과한다. 법적으로 의미 있는 화면이라
 * 비워 두는 쪽이 더 위험하다.
 *
 * 약관이 적재되면 이 폴백은 지워야 한다.
 */
export const toDisplayTerms = (terms: Term[] | undefined): DisplayTerm[] => {
  if (!terms || terms.length === 0) {
    return LOCAL_DISPLAY_TERMS;
  }

  return terms.map((term) => ({
    key: String(term.id),
    title: `[${term.isRequired ? '필수' : '선택'}] ${term.title}`,
    description: DESCRIPTION_BY_TYPE[term.type.toUpperCase()] ?? null,
    contentUrl: term.contentUrl,
    required: term.isRequired,
  }));
};
