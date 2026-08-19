const { withAndroidManifest } = require("expo/config-plugins");

const KAKAO_PACKAGE = "com.kakao.talk";
const KAKAO_SCHEMES = ["kakaotalk", "kakaokompassauth", "kakaolink", "kakaoplus"];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Android 11+에서 카카오톡 패키지/스킴을 조회·실행할 수 있게 queries를 넣습니다. */
function withKakaoAndroid(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (!manifest.queries) manifest.queries = [{}];
    const queries = manifest.queries[0];

    const packages = asArray(queries.package);
    if (!packages.some((item) => item.$?.["android:name"] === KAKAO_PACKAGE)) {
      packages.push({ $: { "android:name": KAKAO_PACKAGE } });
    }
    queries.package = packages;

    const intents = asArray(queries.intent);
    for (const scheme of KAKAO_SCHEMES) {
      const exists = intents.some((intent) =>
        asArray(intent.data).some((data) => data.$?.["android:scheme"] === scheme),
      );
      if (exists) continue;
      intents.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": scheme } }],
      });
    }
    queries.intent = intents;

    return mod;
  });
}

module.exports = withKakaoAndroid;
