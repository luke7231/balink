/**
 * User-facing copy — keep empty states, soft errors, and notification labels
 * in one friendly-polite voice ("~어요" / "~해 주세요").
 * Prefer "관심지역" over "알림 조건" / "알림 규칙".
 */

export const emptyCopy = {
  jobs: {
    title: "아직 등록된 채용 공고가 없어요",
    description: "새 공고가 올라오면 여기에 바로 보여 드릴게요.",
  },
  substitutes: {
    title: "아직 표시할 대강이 없어요",
    description: "조건에 맞는 대강이 올라오면 여기에 보여 드릴게요.",
  },
  savedJobs: {
    title: "저장한 공고가 없어요",
    description: "관심 있는 채용 공고를 저장해 두면 여기서 다시 볼 수 있어요.",
    cta: "채용 공고 보러가기",
  },
  savedSubstitutes: {
    title: "저장한 대강이 없어요",
    description: "관심 있는 대강을 저장해 두면 여기서 다시 볼 수 있어요.",
    cta: "대강 보러가기",
  },
  notifications: {
    title: "아직 받은 알림이 없어요",
    description: "관심지역에 맞는 공고가 올라오면 여기에 표시돼요.",
  },
  notificationsGuest: {
    title: "맞춤 알림은 로그인 후 이용할 수 있어요",
    description: "관심지역을 저장하고 내 알림함을 확인해 보세요.",
    cta: "로그인하기",
  },
  notificationRules: {
    title: "아직 관심지역이 없어요",
    description:
      "관심지역을 설정해 두면, 맞는 공고가 올라올 때 알림함으로 와요.",
    cta: "관심지역 추가하기",
    inline: "아직 관심지역이 없어요",
  },
  interestRegions: {
    title: "아직 선택한 지역이 없어요",
  },
  organizationJobs: {
    title: "연결된 채용 공고가 없어요",
  },
  notificationRuleMissing: {
    title: "수정할 관심지역을 찾을 수 없어요",
    cta: "알림으로 돌아가기",
  },
} as const;

export const errorCopy = {
  retrySoon: "잠시 후 다시 시도해 주세요.",
  loadMoreJobs: "채용 공고를 더 불러오지 못했어요",
  loadMoreSubstitutes: "대강을 더 불러오지 못했어요",
  reload: "다시 불러오기",
  loginFailed: "로그인에 실패했어요. 다시 시도해 주세요.",
  accountNotFound: "계정을 찾을 수 없어요.",
  jobNotFound: "공고를 찾을 수 없어요.",
  substituteNotFound: "대강을 찾을 수 없어요.",
  regionNothingToDelete: "삭제할 지역이 없어요.",
  inviteShareFailed: "초대 링크를 보내지 못했어요. 복사로 보내 주세요.",
  inviteLinkCopyFailed: "링크를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.",
  inviteCodeCopyFailed: "코드를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.",
  imageUploadFailed: "이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.",
  emailSendFailed: "인증 메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요.",
  kakaoChatLoadFailed: "카카오톡 채팅을 불러오지 못했어요.",
  kakaoChatOpenFailed: "카카오톡 채팅을 열지 못했어요.",
  tooManyRequests: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  profileBusy: "잠시 후 다시 요청해 주세요.",
  emailChangeFailed: "이메일 변경에 실패했어요",
} as const;

export const notificationCopy = {
  inboxTitle: "받은 알림",
  rulesTitle: "관심지역",
  rulesHeading: "관심지역",
  rulesHelp:
    "관심지역마다 정규/대강·요일·시간대를 따로 정해요. 하나라도 맞으면 알림이 와요.",
  rulesPreviewLabel: "이렇게 알림이 와요",
  regionRequired: "지역을 선택해야 알림이 가요.",
  noEnabledRules: "켜져 있는 관심지역이 없어요.",
  noRegionRules: "아직 지역을 고르지 않았어요. 관심지역에서 시·군·구를 골라 주세요.",
  deleteConfirm:
    "관심지역을 삭제할까요? 삭제하면 이 지역으로는 더 이상 알림이 오지 않아요.",
  deleteTitle: "관심지역 삭제",
  addChip: "+ 관심지역",
  addButton: "+ 관심지역 추가",
  addPageTitle: "관심지역 추가",
  editPageTitle: "관심지역 수정",
  masterAria: "알림 받기",
  markAllRead: "모두 읽음",
  backToInbox: "← 알림함",
  backToRules: "← 관심지역",
} as const;

export const listEndCopy = {
  allJobs: "모든 공고를 다 봤어요",
  allSubstitutes: "모든 대강을 다 봤어요",
} as const;
