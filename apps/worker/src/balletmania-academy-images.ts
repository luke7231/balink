import iconv from "iconv-lite";
import { load } from "cheerio";
import { isAcademyPlaceholderImageUrl, type RawAcademyImages } from "@black-swan/domain";

const BASE_URL = "https://www.balletmania.com";

export function parseBalletmaniaAcademyImages(html: string): RawAcademyImages | null {
  const $ = load(html);
  const toAbsolute = (src: string | undefined | null): string | null => {
    if (!src?.trim()) return null;
    if (src.startsWith("http")) return src.trim();
    return `${BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;
  };

  let logoUrl: string | null = null;
  $('a[href*="company_detail.html"]')
    .closest("table")
    .find('img[src*="/PEG/"]')
    .each(function () {
      if (logoUrl) return;
      const candidate = toAbsolute($(this).attr("src"));
      if (candidate && !isAcademyPlaceholderImageUrl(candidate)) {
        logoUrl = candidate;
      }
    });

  const gallery = [0, 1, 2, 3]
    .map((index) => {
      const src = $(`#my_cphoto${index}`).attr("src");
      const url = toAbsolute(src);
      if (!url || isAcademyPlaceholderImageUrl(url)) return null;
      return {
        type: "interior" as const,
        order: index + 1,
        url,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  const profileHref = $('a[href*="company_detail.html"]').attr("href");
  const companyProfileUrl = profileHref ? toAbsolute(profileHref) : null;

  if (!logoUrl && gallery.length === 0) return null;

  return { logoUrl, gallery, companyProfileUrl };
}

export async function fetchBalletmaniaAcademyImages(
  url: string,
  cookie: string,
): Promise<RawAcademyImages | null> {
  const response = await fetch(url, {
    headers: {
      cookie,
      "user-agent": "Mozilla/5.0 compatible; black-swan-ballet-crawler/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = iconv.decode(Buffer.from(await response.arrayBuffer()), "euc-kr");
  return parseBalletmaniaAcademyImages(html);
}

export async function loginBalletmania(): Promise<string> {
  const id = process.env.BALLET_MANIA_ID;
  const passwd = process.env.BALLET_MANIA_PW;

  if (!id || !passwd) {
    throw new Error("BALLET_MANIA_ID and BALLET_MANIA_PW are required in .env");
  }

  const params = new URLSearchParams({ kind: "general", id, passwd });
  const response = await fetch(`${BASE_URL}/rankup_module/rankup_member/login_regist.php`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Mozilla/5.0 compatible; black-swan-ballet-crawler/0.1",
    },
    body: params,
    redirect: "manual",
  });

  const cookie = (response.headers.get("set-cookie") || "")
    .split(",")
    .map((value) => value.split(";")[0])
    .filter(Boolean)
    .join("; ");

  if (!cookie) throw new Error("Failed to create Balletmania login session.");
  return cookie;
}
