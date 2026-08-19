/**
 * 요금제 표시 문구 파생 — `SubscriptionPlanDto.features[]` → 화면 문자열.
 *
 * 화면에 요금제 값을 하드코딩하지 않기 위한 유일한 변환 지점이다.
 * 컴포넌트는 여기서 나온 문자열만 그리고, 값 자체는 서버가 정한다.
 *
 * ⚠️ 되돌리지 말 것: 예전엔 types/premium.ts 의 PLAN_DETAILS 상수가 이 역할을 했는데
 *    실제 가격과 어긋나 있었다(플러스 4,900원 → 서버 2,900원). 상수로 되돌리면 같은
 *    일이 반복된다.
 */

import type { PlanFeatureDto, SubscriptionPlanDto } from '../types/payment';

/** 서버가 쓰는 혜택 코드. 화면이 특정 혜택을 집어 쓸 때만 필요하다. */
export const FEATURE_CODE = {
  adFree: 'AD_FREE',
  aiBlogMonthly: 'AI_BLOG_MONTHLY',
  photoStorage: 'PHOTO_STORAGE',
} as const;

/**
 * 혜택을 늘어놓는 순서. 서버 `features[]` 는 코드 알파벳순으로 와서 그대로 그리면
 * 저장 용량보다 광고 제거가 먼저 나온다 — 유료 전환의 근거가 약한 것부터 읽히는 셈이다.
 *
 * 여기 없는 코드는 뒤에 붙는다. 혜택이 새로 생겨도 화면 코드를 안 고치기 위해서다.
 */
const ROW_ORDER: string[] = [
  FEATURE_CODE.photoStorage,
  FEATURE_CODE.aiBlogMonthly,
  FEATURE_CODE.adFree,
];

const orderOf = (code: string) => {
  const i = ROW_ORDER.indexOf(code);
  return i === -1 ? ROW_ORDER.length : i;
};

/** 혜택을 표시 순서대로 정렬해서 돌려준다. 원본 배열은 건드리지 않는다. */
export const sortedFeatures = (plan: SubscriptionPlanDto): PlanFeatureDto[] =>
  [...plan.features].sort((a, b) => orderOf(a.code) - orderOf(b.code));

export const findFeature = (
  plan: SubscriptionPlanDto,
  code: string,
): PlanFeatureDto | undefined => plan.features.find((f) => f.code === code);

/**
 * 화면에 쓰는 혜택 **이름**. 서버 `name` 을 우리 낱말로 갈아끼우는 자리다.
 *
 * `AI_BLOG_MONTHLY` 를 `PICTREE_TOKEN_LABEL` 로 부른다 — 새 기능이 아니라 **같은 값의
 * 다른 이름**이다. 서버가 주는 건 그대로 '한 달에 몇 편' 이고, 바뀌는 건 부르는 말뿐이다.
 *
 * ⚠️ **이건 값 하드코딩이 아니다.** 이 파일 맨 위의 "되돌리지 말 것" 은 용량·횟수·가격
 * 같은 **숫자**를 화면에 박지 말라는 것이고, 여기서 정하는 건 이름표다. 숫자는 여전히
 * `formatFeatureValue` 가 서버 응답에서 뽑는다. 둘을 헷갈려 이 맵에 '월 5회' 같은 값을
 * 넣기 시작하면 그때부터 진짜 하드코딩이 된다.
 *
 * 여기 없는 코드는 서버 `name` 을 그대로 쓴다 — 혜택이 새로 생겨도 화면이 안 깨진다.
 */
/**
 * `AI_BLOG_MONTHLY` 를 화면에서 부르는 이름. **여기가 유일한 출처다.**
 *
 * ⚠️ 한때 비교표·히어로·FAQ 는 `PICTREE 토큰`, 업그레이드 완료 모달은 `AI 초안 생성권`
 * 이라고 서로 다르게 불렀다(이슈 #329). 시안 안에서도 프레임마다 갈려 있었는데, 값은
 * 서버 혜택 하나뿐이고 바뀌는 건 부르는 말뿐이라 화면이 두 이름을 쓸 이유가 없다.
 *
 * ⚠️ **문장에 이름을 직접 적지 말 것.** 이름을 쓰는 자리는 전부 이 상수를 끼워 넣는다 —
 * 다시 이름을 바꿀 때 놓치는 곳이 생기지 않게.
 *
 * ⚠️ **바꿀 때 조사도 같이 봐야 한다.** 지금 이름이 자음(ㄴ)으로 끝나는 것을 전제로
 * 문장들이 `을`·`이` 를 쓰고 있다. 모음으로 끝나는 이름으로 바꾸면 `를`·`가` 로 같이
 * 고쳐야 한다.
 *
 * ⚠️ **짧게 줄여 부르는 자리는 따로 있다** — 맥락이 이미 잡힌 뒤라 `토큰` 으로만 쓴다
 * (업셀 시트 제목 `토큰을 다 썼어요`, 마이페이지 타일 `남은 토큰`, FAQ 답변의 두 번째
 * 언급). 이름을 바꾸면 그 줄임말도 함께 손봐야 한다.
 */
export const PICTREE_TOKEN_LABEL = 'PICTREE 토큰';

const FEATURE_LABEL: Record<string, string> = {
  [FEATURE_CODE.aiBlogMonthly]: PICTREE_TOKEN_LABEL,
};

export const featureLabel = (feature: PlanFeatureDto): string =>
  FEATURE_LABEL[feature.code] ?? feature.name;

/**
 * 혜택의 `unit` 을 바이트로 바꾸는 **유일한 표.**
 *
 * ⚠️ 서버 `unit` 은 `'COUNT' | 'MB' | null` 이다. 여기 없는 단위(`COUNT`·`null`, 그리고
 * 앞으로 생길 수 있는 `GB`)는 **일부러 비워 둔다** — 모르는 단위를 MB 로 치고 계산하면
 * 화면이 틀린 숫자를 자신 있게 그린다.
 */
const BYTES_PER_UNIT: Record<string, number> = {
  MB: 1024 ** 2,
};

/**
 * 용량 혜택(`PHOTO_STORAGE`)의 한도를 **바이트**로. 용량이 아니거나 단위를 모르면 `null`.
 *
 * ⚠️ **단위 해석은 반드시 여기를 거친다.** 한때 `planDisplay` 는 `unit === 'MB'` 를 보고
 * `ProfileSummary` 는 안 보고 `× 1024²` 를 했다 — 같은 필드를 두 화면이 다르게 읽었고,
 * `unit` 이 `GB` 로 바뀌면 마이페이지 막대만 한도를 1024배 작게 잡아 **아직 여유가 있는데
 * 꽉 찬 것처럼** 보이게 될 자리였다(이슈 #276).
 *
 * 단위가 늘면 `BYTES_PER_UNIT` 에 한 줄 넣는 것으로 끝난다.
 */
export const featureLimitBytes = (feature: PlanFeatureDto | undefined): number | null => {
  if (!feature || feature.limitValue == null) return null;
  const bytesPerUnit = feature.unit == null ? undefined : BYTES_PER_UNIT[feature.unit];
  return bytesPerUnit == null ? null : feature.limitValue * bytesPerUnit;
};

/**
 * **바이트**를 받아 1024MB 로 딱 떨어지면 GB 로 줄인다 (100MB · 1GB · 5GB · 20GB).
 *
 * ⚠️ 내보내지 않는다. 한때 MB 를 받았던 함수라, 밖에서 부르는 자리가 생기면 옛 감각으로
 * `limitValue` 를 그대로 넘겨 1024²배 어긋난 숫자가 나온다. 밖에서 필요한 건 언제나
 * `featureLimitBytes` 를 거친 값이므로 `planSummary` 처럼 이 파일 안에서 엮어 준다.
 */
const formatStorage = (bytes: number | null): string => {
  if (bytes == null) return '-';
  const mb = bytes / 1024 ** 2;
  if (mb >= 1024 && mb % 1024 === 0) return `${mb / 1024}GB`;
  return `${mb}MB`;
};

/** 혜택 1건을 표에 넣을 한 칸짜리 문구로. BOOLEAN 은 textValue 를 그대로 쓴다. */
export const formatFeatureValue = (feature: PlanFeatureDto | undefined): string => {
  if (!feature) return '-';
  if (feature.valueType === 'BOOLEAN') return feature.textValue ?? (feature.isEnabled ? '제공' : '미제공');
  if (!feature.isEnabled || feature.limitValue == null) return '사용불가';

  // 바이트로 환산되면 용량, 아니면 횟수다 — `unit === 'MB'` 를 여기서 또 보지 않는다.
  const bytes = featureLimitBytes(feature);
  if (bytes != null) return formatStorage(bytes);

  return `월 ${feature.limitValue}회`;
};

/*
  formatFeatureRange('1GB~20GB' 처럼 유료 플랜 전체를 한 칸에 접던 함수)는 지웠다.
  유일한 사용처인 BenefitTable 이 PlanComparison 으로 바뀌면서 필요가 없어졌다 —
  비교표가 이제 피커로 고른 플랜 하나만 열로 보여준다(그쪽 주석에 이유를 적어 뒀다).
*/

/**
 * 유료 플랜들의 혜택값을 한 칸에 늘어놓는다 — `1GB/5GB/20GB` · `월 5/20/50회`.
 *
 * **되살린 `formatFeatureRange` 가 아니다.** 그건 양 끝만 물결로 이어(`1GB~20GB`) 가운데
 * 플랜을 지웠고, 고를 화면(비교표)에서 쓰였다. 이건 **고르지 않는 자리**에 쓴다 — 업셀
 * 시트는 "올리면 이만큼 는다" 만 말하고 고르는 일은 `/premium` 이 맡으므로, 플랜 이름 없이
 * 값만 늘어놓는 편이 맞다.
 *
 * ⚠️ 값은 서버에서만 온다(이 파일 맨 위 "되돌리지 말 것"). 시트가 `월 5회/20회/50회` 를
 * 문자열로 박아 두고 있었는데, 그 표엔 **무료 플랜의 월 1회가 아예 없었다.**
 *
 * 같은 값이 겹치면 접는다 — 두 플랜이 광고 제거를 똑같이 주는데 `제공/제공` 으로 보일 이유가 없다.
 * 아무 플랜도 이 혜택을 안 켰으면 `null` 을 준다(줄째로 빼라는 뜻).
 */
export const featureValuesLabel = (
  plans: SubscriptionPlanDto[],
  code: string,
): string | null => {
  const features = plans
    .map((plan) => findFeature(plan, code))
    .filter((feature): feature is PlanFeatureDto => Boolean(feature?.isEnabled));

  if (features.length === 0) return null;

  // BOOLEAN 은 '있다/없다' 라 늘어놓을 값이 없다 — 한 칸으로 접는다.
  if (features[0].valueType === 'BOOLEAN') return formatFeatureValue(features[0]);

  // 단위는 앞이나 뒤에 한 번만 — `월 5회/월 20회` 는 같은 말을 세 번 한다.
  const byteValues = [...new Set(features.map(featureLimitBytes).filter((v) => v != null))];
  if (byteValues.length > 0) return byteValues.map(formatStorage).join('/');

  const values = [...new Set(features.map((f) => f.limitValue).filter((v) => v != null))];
  if (values.length === 0) return null;

  return `월 ${values.join('/')}회`;
};

/*
  featureLine / planBenefitLines('사진 저장 1GB' 처럼 혜택을 문장 한 줄로 잇던 함수들)는
  지웠다. 유일한 사용처인 PlanIntroCard 가 사라졌다 — 카드에 적던 이름·가격·혜택이
  바로 아래 비교표에 무료와 나란히 다시 나와서 같은 값을 두 번 읽히는 자리였다.
*/

/** 2900 → '2,900원' */
export const formatPrice = (won: number): string => `${won.toLocaleString('ko-KR')}원`;

/**
 * 비교표의 '가격' 줄에 들어갈 문구 — '무료' / '월 2,900원'.
 *
 * 주기는 `billingCycle` 에서 파생한다. 화면에 '월' 을 박아 두면 연간 요금제가 생기는
 * 순간 월 가격으로 거짓말을 하게 된다.
 *
 * 0원은 `formatPrice` 를 태우지 않는다 — '0원' 은 값이 비어 보이고, 이 자리에서
 * 하려는 말은 '돈을 안 낸다' 다.
 */
export const planPriceLabel = (plan: SubscriptionPlanDto): string => {
  if (plan.price === 0) return '무료';
  const cycle = plan.billingCycle === 'YEARLY' ? '년' : '월';
  return `${cycle} ${formatPrice(plan.price)}`;
};

/**
 * 비교표 이용료 줄의 **라벨** — '월 이용료' / '연 이용료'.
 *
 * 주기가 라벨로 올라가면서 값 쪽은 `planAmountLabel` 이 맡는다. 종전처럼 라벨 `가격` +
 * 값 `월 2,900원` 으로 두면 두 열에 '월' 이 두 번 찍히고, 그렇다고 라벨에 '월' 을
 * 박아 두면 연간 요금제가 생기는 순간 화면이 거짓말을 한다 — 그래서 여기서도 파생한다.
 *
 * ⚠️ **무료 플랜(`billingCycle: 'NONE'`)이 아니라 견주는 유료 플랜을 넘긴다.** 무료를
 * 넘기면 주기가 없어 늘 '월' 로 떨어진다.
 */
export const planPriceRowLabel = (plan: SubscriptionPlanDto): string =>
  `${plan.billingCycle === 'YEARLY' ? '연' : '월'} 이용료`;

/** 같은 줄의 **값** — '무료' / '2,900원'. 주기는 라벨이 이미 말한다. */
export const planAmountLabel = (plan: SubscriptionPlanDto): string =>
  plan.price === 0 ? '무료' : formatPrice(plan.price);

/**
 * '플러스 플랜' → '플러스'. 접미사가 없으면 그대로 둔다.
 *
 * 폭이 빠듯한 자리에서 쓴다 — 플랜 카드 한 줄(이름·용량·횟수를 다 담아 390px 에서
 * 넘쳤다)과 마이페이지 요약 타일이다. 타일 쪽은 폭보다 **겹말** 때문이다:
 * 라벨이 이미 `요금제` 인데 값까지 `플러스 플랜` 이면 같은 말을 두 번 한다.
 */
export const planShortName = (name: string) => name.replace(/\s*플랜$/, '');

/** 플랜 카드·결제 시트가 쓰는 요약 문구 묶음. */
export const planSummary = (plan: SubscriptionPlanDto) => ({
  /** '플러스 플랜' — 서버 name 그대로 */
  name: plan.name,
  /** '플러스' */
  shortName: planShortName(plan.name),
  /** '1GB' */
  storage: formatStorage(featureLimitBytes(findFeature(plan, FEATURE_CODE.photoStorage))),
  /** '월 5회' */
  generations: formatFeatureValue(findFeature(plan, FEATURE_CODE.aiBlogMonthly)),
  /** '2,900원' */
  price: formatPrice(plan.price),
  description: plan.description,
});
