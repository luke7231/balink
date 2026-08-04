# 소셜 로그인 설정 (Kakao / Apple)

Auth.js + Prisma. 콜백 경로는 `/api/auth/callback/{provider}` 입니다.

## 공통

1. 루트 `.env`에 `AUTH_SECRET` 추가: `openssl rand -base64 32`
2. `AUTH_URL`을 배포/로컬 오리진에 맞춥니다. 로컬: `http://localhost:3100`
3. 웹·API와 동일하게 `DATABASE_URL`이 필요합니다 (세션/유저 저장).

## Kakao

1. [Kakao Developers](https://developers.kakao.com/console/app) 앱 생성
2. **앱 키** → REST API 키 → `AUTH_KAKAO_ID` (기존 `KAKAO_REST_API_KEY`가 있으면 동일 값을 넣으면 됩니다)
3. **카카오 로그인 > 보안** → Client Secret 활성화 → `AUTH_KAKAO_SECRET`
4. **카카오 로그인 > Redirect URI**
   - 로컬: `http://localhost:3100/api/auth/callback/kakao`
   - 운영: `https://<your-domain>/api/auth/callback/kakao`
5. 동의 항목: 닉네임, 프로필 사진, (가능하면) 이메일

## Apple (심사 대비)

1. Apple Developer → Identifiers
   - App ID: Sign In with Apple 활성화
   - Services ID (`AUTH_APPLE_ID`): Sign In with Apple 구성
2. Return URLs: `https://<your-domain>/api/auth/callback/apple`
3. Keys → Sign in with Apple 키 생성 후 `.p8`로 client secret JWT 발급
4. 생성된 JWT를 `AUTH_APPLE_SECRET`에 넣습니다 (보통 6개월 유효)
5. `AUTH_APPLE_ID` + `AUTH_APPLE_SECRET`이 둘 다 있으면 로그인 화면에 Apple 버튼이 노출됩니다

## 계정 연동

이메일이 같은 카카오·Apple 계정은 `allowDangerousEmailAccountLinking`으로 한 User에 연결됩니다.
카카오가 이메일을 주지 않으면 연동되지 않고 별도 계정으로 생성될 수 있습니다.

## 로컬 검증

```bash
pnpm dev:web
# http://localhost:3100/login → 카카오 로그인
# DB User / Account 행 생성, 헤더에 이름·로그아웃 표시
```
