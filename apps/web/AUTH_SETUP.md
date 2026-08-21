# 로그인 설정 (Kakao / Apple / 이메일)

Auth.js + Prisma. 소셜 콜백 경로는 `/api/auth/callback/{provider}` 입니다.
이메일은 OTP(6자리 코드)로 인증한 뒤 비밀번호를 설정·로그인합니다.

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
   - 프로덕션: `https://www.balink.co.kr/api/auth/callback/kakao`
   - Vercel 프리뷰(필요 시): `https://<deployment>.vercel.app/api/auth/callback/kakao`
5. 동의 항목: 프로필 사진(선택). 닉네임·이메일은 앱에서 요청하지 않음(닉네임은 랜덤 부여)
6. **네이티브 앱 키** → `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` (실기기에서 카카오톡 로그인 후 앱으로 돌아오는 URL 스킴 `kakao{네이티브앱키}://`)
7. **앱 설정 > 플랫폼**
   - iOS Bundle ID: `com.luke7231.balink`
   - Android 패키지명: `com.luke7231.balink`
   - Android 키 해시: 디버그/스토어 서명 키 해시를 등록해야 카카오톡이 앱으로 돌아옵니다.
     ```bash
     keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64
     ```
8. iOS 시뮬레이터·Android 에뮬레이터에는 카카오톡을 설치할 수 없어 계정 웹 로그인이 뜹니다. 카카오톡 전환은 실기기에서 확인하세요.

## Vercel 배포

- 프로젝트: `balink-web` (Root Directory `apps/web`)
- 프로덕션 도메인: `https://www.balink.co.kr` (`balink.co.kr`은 www로 리다이렉트)
- `AUTH_URL`: `https://www.balink.co.kr`
- 채용/대강 목록용 `API_URL`: 공개 GraphQL 전체 URL (예: `https://<api-host>/graphql`)
  - 로컬 `.env`에 없으면 Vercel에도 등록되지 않습니다.
  - 등록 예: `printf '%s' 'https://YOUR_API/graphql' | vercel env add API_URL production`
  - Preview/Development에도 동일 값 등록 후 재배포
- API `CORS_ORIGIN` 기본값은 `*`이라 Vercel 오리진 추가가 필수는 아닙니다. 제한해 둔 경우 Vercel 웹 오리진을 허용하세요.

## Apple (심사 대비)

1. Apple Developer → Identifiers
   - App ID: Sign In with Apple 활성화
   - Services ID (`AUTH_APPLE_ID`): Sign In with Apple 구성
2. Return URLs: `https://www.balink.co.kr/api/auth/callback/apple`
3. Keys → Sign in with Apple 키 생성 후 `.p8`로 client secret JWT 발급
4. 생성된 JWT를 `AUTH_APPLE_SECRET`에 넣습니다 (보통 6개월 유효)
5. `AUTH_APPLE_ID` + `AUTH_APPLE_SECRET`이 둘 다 있으면 로그인 화면에 Apple 버튼이 노출됩니다

## 이메일 로그인 / 회원가입 (OTP)

1. Resend가 설정되어 있어야 합니다 (아래 Resend 절).
2. 흐름
   - 회원가입: `/signup` → 이메일 → 6자리 코드 → 비밀번호 → **이때** `User` 생성 (`emailVerified` 설정)
   - 로그인: `/login/email` → 이메일+비밀번호 (인증·비밀번호가 있는 계정만)
   - 재설정: `/login/reset` → 동일 OTP 게이트 후 비밀번호 저장/추가
3. 비밀번호는 Node `scrypt` 해시로 `User.passwordHash`에 저장합니다.
4. 세션은 Auth.js와 동일하게 DB `Session` + `authjs.session-token` 쿠키입니다.
5. 마이그레이션: `packages/db/prisma/migrations/20260821120000_email_password_auth`

## Resend (이메일 변경·가입·재설정 인증)

1. Vercel Marketplace에서 Resend 설치: `vercel integration add resend`
   - 팀 약관 동의가 필요하면 대시보드에서 Accept 후 다시 실행
2. 발신 도메인 `balink.co.kr`에 SPF/DKIM 레코드를 Resend 안내에 따라 등록
3. Vercel Production에 `RESEND_API_KEY`가 생겼는지 확인
4. (선택) `RESEND_FROM_EMAIL=발링크 <noreply@balink.co.kr>`
5. 로컬도 동일 키를 `.env`에 넣습니다
6. 확인 링크(이메일 변경): `https://www.balink.co.kr/account/email/confirm?token=...`
7. 가입·재설정은 링크로 로그인하지 않고 **6자리 코드**를 메일로 보냅니다 (앱 WebView 세션 유지).

## 계정 연동

이메일이 같은 카카오·Apple 계정은 `allowDangerousEmailAccountLinking`으로 한 User에 연결됩니다.
카카오가 이메일을 주지 않으면 연동되지 않고 별도 계정으로 생성될 수 있습니다.
소셜 계정에 인증된 이메일이 있으면 비밀번호 재설정·계정 관리에서 비밀번호를 붙여 이메일 로그인을 쓸 수 있습니다.

## 로컬 검증

```bash
pnpm dev:web
# http://localhost:3100/login → 카카오 로그인
# http://localhost:3100/signup → 이메일 OTP 가입
# http://localhost:3100/login/email → 이메일 로그인
# DB User / Account·Session 행 생성, 헤더에 이름·로그아웃 표시
```
