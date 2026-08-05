export type HomeBannerItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

/** 임시 배너 데이터 — 이후 CMS/어드민으로 교체 예정 */
export const HOME_BANNERS: HomeBannerItem[] = [
  {
    id: "recruit",
    title: "오늘의 채용 공고",
    subtitle: "관심 지역의 새 공고를 모아보세요",
    href: "/",
    imageSrc: "/banners/banner-01.jpg",
    imageAlt: "포즈를 취하고 있는 발레리나",
  },
  {
    id: "substitute",
    title: "급하게 찾는 대타",
    subtitle: "오늘·내일 수업 공고를 바로 확인",
    href: "/substitutes",
    imageSrc: "/banners/banner-02.jpg",
    imageAlt: "검은 천과 함께 움직이는 발레 무용수",
  },
  {
    id: "alerts",
    title: "맞춤 알림 받기",
    subtitle: "조건에 맞는 공고만 모아 알려드려요",
    href: "/notifications",
    imageSrc: "/banners/banner-03.jpg",
    imageAlt: "위에서 내려다본 튜튜와 발레리나",
  },
  {
    id: "regions",
    title: "지역별 채용 살펴보기",
    subtitle: "시·군·구 필터로 딱 맞는 학원을 찾아보세요",
    href: "/",
    imageSrc: "/banners/banner-01.jpg",
    imageAlt: "포즈를 취하고 있는 발레리나",
  },
  {
    id: "saved",
    title: "관심 공고 모아두기",
    subtitle: "나중에 볼 공고를 저장해 두세요",
    href: "/saved",
    imageSrc: "/banners/banner-02.jpg",
    imageAlt: "검은 천과 함께 움직이는 발레 무용수",
  },
  {
    id: "account",
    title: "프로필 완성하기",
    subtitle: "닉네임과 관심지역을 먼저 정리해 보세요",
    href: "/account",
    imageSrc: "/banners/banner-03.jpg",
    imageAlt: "위에서 내려다본 튜튜와 발레리나",
  },
];
