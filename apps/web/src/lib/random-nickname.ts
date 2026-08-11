import { prisma } from "@balink/db";

const ADJECTIVES = [
  "친절한",
  "행복한",
  "용감한",
  "느긋한",
  "상냥한",
  "든든한",
  "반짝이는",
  "포근한",
  "재빠른",
  "고요한",
  "따뜻한",
  "씩씩한",
  "귀여운",
  "단정한",
  "밝은",
  "차분한",
  "활기찬",
  "다정한",
  "싱그러운",
  "우아한",
] as const;

const NOUNS = [
  "도토리",
  "백조",
  "토끼",
  "구름",
  "달빛",
  "별빛",
  "호두",
  "코끼리",
  "펭귄",
  "참새",
  "앵두",
  "민들레",
  "개나리",
  "햇살",
  "이슬",
  "단풍",
  "모카",
  "코코아",
  "치즈",
  "마카롱",
] as const;

export function generateRandomNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  return `${adjective}${noun}`;
}

export async function allocateUniqueNickname(): Promise<string> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const name = generateRandomNickname();
    const existing = await prisma.user.findFirst({
      where: { name },
      select: { id: true },
    });
    if (!existing) return name;
  }

  return `${generateRandomNickname()}${Math.floor(Math.random() * 900 + 100)}`;
}
