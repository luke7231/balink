# 공고 미노출 운영

채용·대강 공고에 `hiddenAt`과 `hiddenReason`을 기록한다. 원문, 수집 연결, 북마크는 보존한다. 미노출 공고는 공개 API의 목록·상세·원문 링크·지역별 집계, 학원 공고, 오늘 공고, 저장 목록, 사이트맵에서 제외한다. 상세 주소는 404가 된다. 수집기의 일반 갱신과 대강 상태 갱신은 미노출 상태를 변경하지 않는다.

## 최초 배포

1. 운영 DB를 대상으로 `pnpm db:migrate:deploy`를 실행한다. nullable 컬럼 추가이므로 기존 코드와 호환된다.
2. 이 변경이 포함된 API·웹·워커를 빌드하고 배포한다. 운영 명령 실행 환경에서도 `pnpm --filter @balink/db build`로 DB 패키지를 준비한다.
3. 아래 명령을 운영 DB에 연결된 환경에서 실행한다. 루트 `.env` 또는 `DATABASE_URL`이 가리키는 DB를 사용한다. 명령은 API를 경유하지 않으며 DB 접근 권한을 가진 운영자만 실행한다.

## 이번 요청 2건

먼저 제목과 현재 상태를 확인한다. 둘 중 하나라도 없거나 ID가 두 테이블에 중복되면 전체 작업을 취소한다. 채용·대강 유형은 자동으로 판별한다.

```sh
pnpm posts:visibility hide cmtb51nnv024d2ifaz2j61sme cmsschd7x00sc2ifa7fs0x9g3 --reason "게시자 삭제 요청"
```

확인한 대상에 적용한다.

```sh
pnpm posts:visibility hide cmtb51nnv024d2ifaz2j61sme cmsschd7x00sc2ifa7fs0x9g3 --reason "게시자 삭제 요청" --apply
```

두 건은 하나의 트랜잭션으로 처리한다. 이미 숨긴 글에 다시 hide를 실행하면 최초 숨김 시각과 사유를 유지한다. 이 저장소 변경 자체는 해당 ID의 운영 데이터를 수정하지 않는다.

## 복구

```sh
pnpm posts:visibility show cmtb51nnv024d2ifaz2j61sme cmsschd7x00sc2ifa7fs0x9g3
pnpm posts:visibility show cmtb51nnv024d2ifaz2j61sme cmsschd7x00sc2ifa7fs0x9g3 --apply
```

복구는 숨김 시각·사유를 비운다. 대강이 만료되었거나 다른 공개 조건에 맞지 않으면 복구해도 목록에 나오지 않는다.

## 적용 확인과 범위

- API 상세 조회 결과가 `null`이고, 웹의 `/jobs/<ID>` 또는 `/substitutes/<ID>`가 404인지 확인한다.
- 목록, 저장 목록, 학원 상세, 사이트맵에서 해당 ID가 없는지 확인한다.
- 웹 GraphQL 응답에는 기본 60초 캐시가 있으므로 반영까지 시간이 걸릴 수 있다. 이미 열린 화면은 새로고침이 필요하다. 검색엔진의 기존 검색 결과는 재수집 후 갱신된다.
- 이미 생성한 알림과 발송한 푸시는 삭제하지 않는다. 해당 링크로 들어가도 상세 내용은 공개하지 않는다. 새로운 알림함 과거 공고 채우기에서는 숨긴 글을 제외한다.
- 같은 원문을 기존 수집 연결로 갱신할 때 숨김이 유지된다. DB 행을 직접 삭제하거나 다른 원문 ID로 새 글이 생성되는 경우까지 차단하는 원문 차단 목록 기능은 포함하지 않는다.

검증: `pnpm --filter @balink/db test`
