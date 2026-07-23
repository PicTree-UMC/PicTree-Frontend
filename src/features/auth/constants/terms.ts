import type { AgreementTerm } from '../types/auth';

export const AGREEMENT_TERMS: AgreementTerm[] = [
  {
    id: 'service',
    title: '[필수] 서비스 이용약관 동의',
    required: true,
    description:
      'PicTree 서비스 이용에 필요한 기본 약관입니다. 회원의 권리·의무, 서비스 제공 범위, 이용 제한 사유 등을 포함합니다.',
  },
  {
    id: 'privacy',
    title: '[필수] 개인정보 수집 · 이용 동의',
    required: true,
    description:
      '수집 항목, 수집 계정 식별자·닉네임·프로필 사진, 서비스 이용 기록. 목적: 회원 식별 및 서비스 제공. 개인정보 처리방침에 따라 처리됩니다.',
  },
  {
    id: 'location',
    title: '[필수] 위치정보 수집 · 이용 동의\n(위치 기반 서비스 이용약관)',
    required: true,
    description:
      '촬영 위치, 사진의 EXIF 위치 메타데이터, 기기 위치를 수집해 지도 위 장소·동선 기록과 지나간 장소 알림에 사용합니다. 위치정보는 서비스 제공 목적 외로 사용하지 않습니다.',
  },
  {
    id: 'push',
    title: '[선택] 푸시 알림 수신 동의',
    required: false,
    description:
      '지나간 장소 알림, 기록 리마인더 등 서비스 관련 푸시 알림을 받습니다. 기기 알림 권한과 별개로 언제든 설정에서 끌 수 있습니다.',
  },
  {
    id: 'marketing',
    title: '[선택] 마케팅·이벤트 알림 수신 동의',
    required: false,
    description:
      '신규 기능, 이벤트, 혜택 소식을 받습니다. 미동의 시에도 서비스 이용에는 제한이 없습니다.',
  },
];
