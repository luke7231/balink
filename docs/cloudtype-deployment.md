# Cloudtype 서버 자동 배포

대상은 `blueblue/ballet:main`이다. Cloudtype의 표시명은 balink-api/balink-scraper이지만, 생성된 서비스 YAML과 URL의 실제 식별자는 `black-swan-api`/`black-swan-scraper`다. 워크플로는 기존 식별자를 유지하므로 새 서비스를 만들지 않는다. PostgreSQL `ballet-ql`과 Vercel 웹 배포는 포함하지 않는다.

## 배포 흐름

`.github/workflows/deploy-cloudtype.yml`은 main의 서버·공통 패키지·배포 관련 변경을 감지하며, main에서 수동 실행할 수도 있다.

1. Node 22.14.0/pnpm 10.12.1로 설치하고 도메인·DB·워커 테스트, API 빌드, 워커 런타임 의존성을 검증한다.
2. production 환경의 Secrets로 API·수집기 설정을 모두 검증한다.
3. Cloudtype의 읽기 전용 배포키 연결을 준비한다.
4. 현재 저장소의 정확한 실행 커밋 SHA를 API에 배포한다.
5. API 시작 명령의 DB 대기와 Prisma migrate deploy가 완료되고 `/health`가 DB 연결 및 해당 SHA를 확인하면 수집기를 배포한다.
6. 수집기 `/health`에서도 DB 연결과 해당 SHA를 확인해야 성공한다. 기존 버전의 정상 응답은 성공으로 인정하지 않는다.

배포 중 새 push가 발생해도 진행 중인 배포는 취소하지 않는다. GitHub concurrency는 대기 실행을 최신 것으로 대체할 수 있으므로 모든 중간 커밋의 배포를 보장하지 않는다. API 배포 확인 실패 시 수집기 배포는 시작하지 않는다. 수집기 실패 시 API를 자동으로 되돌리지는 않는다.

## 최초 연결: GitHub Secrets 4개

[luke7231/balink의 Actions Secrets](https://github.com/luke7231/balink/settings/secrets/actions)에 다음을 등록한다. GitHub Environment `production`의 Secrets로 등록해도 된다. 값은 채팅이나 저장소 파일에 붙이지 않는다.

| 이름 | 값 |
| --- | --- |
| `CLOUDTYPE_TOKEN` | blueblue 스페이스의 배포 권한을 가진 Cloudtype API 키 |
| `GHP_TOKEN` | luke7231/balink 저장소의 Deploy Key를 관리할 수 있는 GitHub PAT |
| `CLOUDTYPE_API_YAML` | 아래 API 서비스 CLI 탭의 **첫 번째 서비스 YAML 전체** |
| `CLOUDTYPE_SCRAPER_YAML` | 아래 수집기 서비스 CLI 탭의 **첫 번째 서비스 YAML 전체** |

- [API CLI](https://app.cloudtype.io/@blueblue/ballet:main/black-swan-api#cli)
- [수집기 CLI](https://app.cloudtype.io/@blueblue/ballet:main/black-swan-scraper#cli)

CLI 화면의 하단 GitHub Actions 워크플로 전체가 아니라, 상단 `black-swan-api.yaml`/`black-swan-scraper.yaml` 내용을 복사한다. 설정에 포함된 환경변수·포트·추가 옵션·리소스는 보존하고, 저장소 주소와 Git ref, 빌드 컨텍스트, 실행 커밋 환경변수만 자동으로 맞춘다. 환경변수를 Cloudtype 대시보드에서 변경한 뒤에는 이 YAML Secret도 갱신해야 다음 배포에 유지된다.

공식 connect 액션에는 기본 `GITHUB_TOKEN` 대신 Deploy Key 관리 권한을 가진 PAT가 필요하다. 공식 문서의 classic PAT 설정과 만료 기간을 참고한다. 워크플로의 `permissions: contents: read`는 기본 GITHUB_TOKEN의 권한이며 별도 PAT 권한을 대체하지 않는다.

## 첫 실행

1. Secrets를 등록한다. 이미 GitHub Environment production에 승인 규칙이 있다면 그 규칙에 따라 실행한다.
2. 이 변경과 미노출 기능 변경을 main에 반영한다. 기존 Cloudtype/GitHub 웹훅 자동 배포가 있다면 이중 배포가 되지 않도록 트리거를 확인한다.
3. [GitHub Actions](https://github.com/luke7231/balink/actions)에서 `Deploy Cloudtype servers` 실행을 확인하거나 main을 선택하고 Run workflow한다.
4. API 및 수집기 상태 확인 단계가 모두 성공했는지 확인한다. 워크플로를 저장하는 것만으로 운영 검증이 완료되지는 않는다.
5. 웹의 미노출 조회 변경도 별도의 웹 배포에 반영한 다음, `docs/post-visibility.md`의 두 ID 처리 명령을 실행한다. 서버 자동 배포 자체는 게시글 데이터를 숨기지 않는다.

## 실패와 복구

Cloudtype 배포 요청 성공과 컨테이너 기동 완료는 다를 수 있다. 워크플로는 각 서비스의 새 커밋 상태를 최대 20분씩 기다린다. 시간 초과 시 해당 서비스의 빌드/실행 로그, DATABASE_URL, 마이그레이션 오류, GitHub 배포키, 공개 상태 확인 URL을 점검한다. 주소 변경 시 워크플로 URL도 갱신한다.

Prisma 마이그레이션은 기존 서버 시작 명령에서 실행되므로 GitHub runner에 운영 DATABASE_URL을 별도로 주거나 DB 접근 포트를 새로 열 필요가 없다. DB 변경은 구버전 서버와 호환되게 먼저 추가한 뒤 사용하고, 제거 작업은 별도 배포로 진행한다. 이번 미노출 마이그레이션은 nullable 컬럼 추가다.

코드 복구는 Cloudtype 배포 내역에서 이전 버전을 복원하거나, main에 변경을 되돌리는 커밋을 반영한다. 코드 복구는 DB 마이그레이션을 되돌리지 않는다. 수집기는 스케줄러가 있으므로 교체 중 구·신 컨테이너가 겹치면 중복 작업 가능성이 있다. 기존 교체 전략을 확인하고, 잠금 없는 수집기를 여러 레플리카로 확대하지 않는다.

## 검증 상태

로컬에서 설정 변환 테스트 3개, 새 커밋 대기 테스트 2개, 도메인 테스트, API·워커 빌드와 워커 테스트/의존성 검사를 수행한다. GitHub Secrets 등록, 원격 workflow 실행 및 운영 배포 성공 여부는 별도로 확인해야 한다.

공식 근거:
- [Cloudtype GitHub Actions](https://docs.cloudtype.dev/ko/developers/githubactions)
- [Cloudtype Dockerfile 배포](https://docs.cloudtype.dev/ko/developers/dockerfile)
- [공식 connect 액션](https://github.com/cloudtype-github-actions/connect)
- [공식 deploy 액션](https://github.com/cloudtype-github-actions/deploy)
