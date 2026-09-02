import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildJobDescription,
  buildPageMetadata,
  jobPostingJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "./seo";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

describe("seo helpers", () => {
  it("builds absolute urls from site origin", () => {
    assert.equal(absoluteUrl("/"), SITE_URL);
    assert.equal(absoluteUrl("/jobs/1"), `${SITE_URL}/jobs/1`);
  });

  it("truncates job descriptions for meta tags", () => {
    const description = buildJobDescription({
      title: "강남 발레 강사 모집",
      location: "서울 강남구",
      pay: "회당 8만원",
      description: "A".repeat(200),
    });
    assert.ok(description.length <= 160);
    assert.match(description, /강남 발레 강사 모집/);
  });

  it("sets canonical path in page metadata", () => {
    const metadata = buildPageMetadata({
      title: "대강",
      path: "/substitutes",
      description: "대강 목록",
    });
    assert.equal(metadata.alternates?.canonical, "/substitutes");
    assert.equal(metadata.openGraph?.url, `${SITE_URL}/substitutes`);
    assert.equal(metadata.title, "대강");
  });

  it("uses absolute title with brand on the home path", () => {
    const metadata = buildPageMetadata({
      title: "발레 강사 채용",
      path: "/",
      description: "홈",
    });
    assert.deepEqual(metadata.title, {
      absolute: `발레 강사 채용 | ${SITE_NAME}`,
    });
  });

  it("emits organization and website json-ld for the brand", () => {
    const org = organizationJsonLd();
    const site = websiteJsonLd();
    assert.equal(org.name, SITE_NAME);
    assert.equal(org.url, SITE_URL);
    assert.equal(site["@type"], "WebSite");
    assert.equal(site.url, SITE_URL);
  });

  it("builds JobPosting json-ld with KRW salary conversion", () => {
    const json = jobPostingJsonLd({
      id: "job_1",
      title: "발레 강사",
      sido: "서울",
      sigungu: "마포구",
      payMinManwon: 200,
      payMaxManwon: 250,
      organizationName: "테스트 학원",
    });
    assert.equal(json["@type"], "JobPosting");
    assert.equal(json.url, `${SITE_URL}/jobs/job_1`);
    assert.equal(json.baseSalary?.currency, "KRW");
    assert.equal(json.baseSalary?.value?.minValue, 2_000_000);
    assert.equal(json.baseSalary?.value?.maxValue, 2_500_000);
  });
});
