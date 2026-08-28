import {
  SUPPORT_INQUIRY_FORM_TITLE,
  SUPPORT_INQUIRY_FORM_URL,
} from "@/lib/support";

export type HomeBannerItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** 외부 URL 인앱 브라우저 시트 제목 (원문 보기와 동일) */
  browserTitle?: string;
  imageSrc: string;
  imageAlt: string;
};

/** 임시 배너 데이터 — 이후 CMS/어드민으로 교체 예정 */
export const HOME_BANNERS: HomeBannerItem[] = [
  {
    id: "about",
    title: "발링크가 뭔가요?",
    subtitle: "발레 강사 채용·대강·알림을 한곳에서",
    href: "https://quirky-moss-44e.notion.site/3cad3b76738880158babd46b6abb46fb",
    browserTitle: "발링크가 뭔가요?",
    imageSrc: "/banners/1.png",
    imageAlt: "발링크 로고 타일",
  },
  {
    id: "alerts",
    title: "관심지역 설정하고 알림 받자!",
    subtitle: "맞는 공고가 올라오면 바로 알려드려요",
    href: "/notifications",
    imageSrc: "/banners/2.png",
    imageAlt: "알림 벨과 채용 알림 카드 일러스트",
  },
  {
    id: "feedback",
    title: "앱 피드백이 필요해요!",
    subtitle: "불편한 점이나 바라는 점을 들려 주세요",
    href: SUPPORT_INQUIRY_FORM_URL,
    browserTitle: SUPPORT_INQUIRY_FORM_TITLE,
    imageSrc: "/banners/3.png",
    imageAlt: "체크리스트와 연필 일러스트",
  },
];
