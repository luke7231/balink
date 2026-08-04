const { URL } = require("node:url");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

const BASE_URL = "https://www.balletmania.com";
const BOARD_ID = "working";
const LIST_PATH = `/board/index.html?id=${BOARD_ID}`;

function buildWorkingListUrl(page = 1) {
  const url = new URL(LIST_PATH, BASE_URL);
  if (page > 1) url.searchParams.set("page", String(page));
  return url.toString();
}

function buildWorkingDetailUrl(no) {
  const url = new URL(LIST_PATH, BASE_URL);
  url.searchParams.set("no", String(no));
  return url.toString();
}

async function fetchEucKrHtml(url, cookie) {
  const response = await fetch(url, {
    headers: {
      ...(cookie ? { cookie } : {}),
      "user-agent": "Mozilla/5.0 compatible; black-swan-ballet-crawler/0.1",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return iconv.decode(Buffer.from(await response.arrayBuffer()), "euc-kr");
}

async function loginBalletmania() {
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

function getTodayKstDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizePostedAtRaw(raw, todayKstDate) {
  const text = cleanText(raw);
  if (!text) return { postedAtRaw: null, postedAtIso: null };

  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    return {
      postedAtRaw: text,
      postedAtIso: `${todayKstDate}T${text}+09:00`,
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return {
      postedAtRaw: text,
      postedAtIso: `${text}T00:00:00+09:00`,
    };
  }

  return { postedAtRaw: text, postedAtIso: null };
}

function parseWorkingListings(html, options = {}) {
  const todayKstDate = options.todayKstDate || getTodayKstDate();
  const $ = cheerio.load(html);
  const rows = [];

  $("tbody#div_article_contents tr").each((_, row) => {
    const $row = $(row);
    if ($row.hasClass("notice")) return;

    const anchor = $row.find('a[href*="id=working"][href*="no="]').first();
    const href = anchor.attr("href");
    const no = extractNo(href);
    if (!no) return;

    const cells = $row.children("td");
    const title = cleanText(anchor.text());
    const cellTexts = cells
      .toArray()
      .map((cell) => cleanText($(cell).text()))
      .filter(Boolean);
    const titleCellIndex = cells.index(anchor.closest("td"));

    let author = null;
    for (let index = titleCellIndex + 1; index < cellTexts.length; index += 1) {
      const value = cellTexts[index];
      if (!value || value === title) continue;
      if (/^\d+$/.test(value)) continue;
      if (/^\d{2}:\d{2}:\d{2}$/.test(value)) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
      author = value;
      break;
    }

    let postedAtRaw = null;
    for (let index = cellTexts.length - 1; index >= 0; index -= 1) {
      const value = cellTexts[index];
      if (/^\d{2}:\d{2}:\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        postedAtRaw = value;
        break;
      }
    }

    const recommendCount = Number($row.find(".recommend-btn[data-count]").attr("data-count") || 0);
    const authorMemberNo = $row.find(".recommend-btn[data-mno]").attr("data-mno") || null;
    const viewCount = Number(
      cellTexts.find((value, index) => index > titleCellIndex && /^\d+$/.test(value)) || 0,
    );
    const posted = normalizePostedAtRaw(postedAtRaw, todayKstDate);
    const listSeq = cellTexts[0] || null;

    rows.push({
      no,
      listSeq,
      title,
      author,
      authorMemberNo,
      recommendCount,
      viewCount,
      postedAtRaw: posted.postedAtRaw,
      postedAtIso: posted.postedAtIso,
      isNotice: false,
      url: buildWorkingDetailUrl(no),
    });
  });

  return rows;
}

function detectWorkingDetailState(html) {
  if (/요청하신 게시물은 삭제된 게시물입니다/.test(html)) return "deleted";
  if (/요청하신 게시물은 존재 하지 않습니다/.test(html)) return "missing";
  if (/pay_resume\.html\?service=employ_reading/.test(html) && !html.includes("tmp_content")) return "login_required";
  return "ok";
}

function parseWorkingDetail(html) {
  const state = detectWorkingDetailState(html);
  if (state !== "ok") {
    return {
      state,
      title: null,
      detailText: null,
      author: null,
      postedAtIso: null,
      contactPhones: [],
      contactEmails: [],
      viewCount: 0,
      applicantCount: 0,
    };
  }

  const $ = cheerio.load(html);
  const tmp = $("#tmp_content");
  const rawContent = tmp.length
    ? tmp.is("textarea")
      ? tmp.text()
      : tmp.html() || tmp.text()
    : $("#div_content").html() || $("#div_content").text() || null;
  const detailText = cleanDetailHtml(rawContent) || cleanMultilineText($("#div_content").text()) || null;
  const title = cleanText($(".view_title").first().text()) || null;
  const author =
    cleanText($(".view_name").first().text()) ||
    cleanText($(".writer").first().text()) ||
    cleanText($("td.view_writer").first().text()) ||
    null;
  const postedRaw = cleanText($(".view_date").first().text()) || cleanText($("td.view_date").first().text()) || null;
  const posted = postedRaw ? normalizePostedAtRaw(postedRaw, getTodayKstDate()) : { postedAtRaw: null, postedAtIso: null };
  const bodyText = $.root().text();
  const viewMatch = bodyText.match(/조회\s*:\s*(\d+)/);
  const applicantMatch = bodyText.match(/지원자수\s*:\s*(\d+)/);

  const contactPhones = [];
  const contactEmails = [];
  $("td").each((_, cell) => {
    const text = cleanText($(cell).text());
    if (text.startsWith("핸드폰")) {
      const phone = text.replace(/^핸드폰\s*:\s*/, "");
      if (phone) contactPhones.push(phone);
    }
    if (text.startsWith("이메일")) {
      const email = text.replace(/^이메일\s*:\s*/, "");
      if (email) contactEmails.push(email);
    }
  });

  const detailPhones = detailText ? [...detailText.matchAll(/01[016789]-?\d{3,4}-?\d{4}/g)].map((match) => match[0]) : [];
  const detailEmails = detailText
    ? [...detailText.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0])
    : [];

  return {
    state: "ok",
    title,
    detailText,
    author,
    postedAtIso: posted.postedAtIso,
    postedAtRaw: posted.postedAtRaw,
    contactPhones: [...new Set([...contactPhones, ...detailPhones])],
    contactEmails: [...new Set([...contactEmails, ...detailEmails])],
    viewCount: viewMatch ? Number(viewMatch[1]) : 0,
    applicantCount: applicantMatch ? Number(applicantMatch[1]) : 0,
  };
}

function classifySubstitute(raw) {
  const text = [raw.title, raw.detailText].filter(Boolean).join("\n");
  const audiences = classifyAudiences(text);
  const subjects = classifySubjects(text);
  const schedule = classifySchedule(text, raw.postedDate);
  const locations = classifyLocations(text);
  const pay = classifyPay(text);
  const urgency = classifyUrgency(raw.title, schedule.lessonDates);

  return {
    jobType: "substitute",
    isBallet: subjects.includes("ballet") || /발레|댄스/i.test(text),
    audiences,
    subjects,
    schedule,
    locations,
    pay,
    urgency,
    contact: {
      methods: [...new Set([...(raw.contactPhones?.length ? ["phone"] : []), ...(raw.contactEmails?.length ? ["email"] : [])])],
      phones: raw.contactPhones || [],
      emails: raw.contactEmails || [],
    },
  };
}

function classifyAudiences(text) {
  const audiences = [];
  if (/유아|키즈|어린이|초등/i.test(text)) audiences.push("kids");
  if (/성인|취미/i.test(text)) audiences.push("adult");
  if (/중등|중학|청소년/i.test(text)) audiences.push("teen");
  return audiences.length ? audiences : ["unknown"];
}

function classifySubjects(text) {
  const subjects = [];
  if (/발레|ballet/i.test(text)) subjects.push("ballet");
  if (/현대|contemporary/i.test(text)) subjects.push("contemporary");
  if (/한국무용|국악/i.test(text)) subjects.push("korean");
  if (/재즈|jazz/i.test(text)) subjects.push("jazz");
  return subjects.length ? subjects : ["unknown"];
}

function classifySchedule(text, postedDate) {
  const lessonDates = extractLessonDates(text, postedDate);
  const dayMatches = text.match(/[월화수목금토일]/g) || [];
  const days = [...new Set(dayMatches)];
  const timeMatches = [...text.matchAll(/(\d{1,2}:\d{2})(?:\s*~\s*(\d{1,2}:\d{2}))?/g)];
  const times = timeMatches.map((match) => ({
    start: match[1] || null,
    end: match[2] || null,
    raw: match[0] || null,
  }));

  return {
    lessonDates,
    days,
    times,
    classCount: lessonDates.length || null,
    durationMinutes: null,
    urgency: null,
  };
}

function extractLessonDates(text, postedDate) {
  const dates = new Set();
  const baseYear = postedDate ? Number(postedDate.slice(0, 4)) : new Date().getFullYear();

  for (const match of text.matchAll(/(\d{1,2})\/(\d{1,2})(?:\([월화수목금토일]\))?/g)) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    dates.add(`${baseYear}-${month}-${day}`);
  }

  for (const match of text.matchAll(/(\d{1,2})월\s*(\d{1,2})일/g)) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    dates.add(`${baseYear}-${month}-${day}`);
  }

  if (/오늘|today/i.test(text) && postedDate) dates.add(postedDate.slice(0, 10));
  if (/내일|tomorrow/i.test(text) && postedDate) {
    const next = new Date(`${postedDate.slice(0, 10)}T12:00:00+09:00`);
    next.setDate(next.getDate() + 1);
    dates.add(next.toISOString().slice(0, 10));
  }

  return [...dates].sort();
}

function classifyLocations(text) {
  const locations = [];
  const regionPatterns = [
    /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n,|]{0,40}/g,
  ];

  for (const pattern of regionPatterns) {
    for (const match of text.matchAll(pattern)) {
      locations.push({ raw: cleanText(match[0]), sido: null, sigungu: null, dongOrStation: null, confidence: "low" });
    }
  }

  return locations.slice(0, 3);
}

function classifyPay(text) {
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*만\s*원|페이\s*(\d+)|(\d+)\s*원/);
  const amountText = amountMatch ? amountMatch[0] : null;
  return {
    type: amountText ? "explicit" : "unknown",
    amountText,
    negotiable: /협의|면담/i.test(text),
  };
}

function classifyUrgency(title, lessonDates) {
  const text = title || "";
  if (/급구|오늘|today/i.test(text)) return "same_day";
  if (/내일|tomorrow/i.test(text)) return "next_day";
  if (lessonDates?.length === 1) {
    const today = getTodayKstDate();
    if (lessonDates[0] === today) return "same_day";
    const tomorrow = new Date(`${today}T12:00:00+09:00`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (lessonDates[0] === tomorrow.toISOString().slice(0, 10)) return "next_day";
  }
  return "normal";
}

function computeExpiresAt(lessonDates, postedAtIso) {
  if (lessonDates.length > 0) {
    const last = lessonDates[lessonDates.length - 1];
    return `${last}T23:59:59+09:00`;
  }

  if (postedAtIso) {
    const posted = new Date(postedAtIso);
    posted.setDate(posted.getDate() + 7);
    return posted.toISOString();
  }

  return null;
}

function extractNo(href) {
  if (!href) return null;
  const match = href.match(/[?&]no=(\d+)/);
  return match ? match[1] : null;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanMultilineText(value) {
  return (
    String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n")
      .trim() || null
  );
}

function htmlToPlainText(html) {
  if (!html) return null;
  const $ = cheerio.load(`<div>${html}</div>`, null, false);
  $("script, style, button, input, textarea, iframe").remove();
  $("div[class*='btn'], .recommend-btn, .comment, .reply").remove();
  $("br").replaceWith("\n");
  return cleanMultilineText($("div").text());
}

function cleanDetailHtml(html) {
  return htmlToPlainText(html);
}

function dedupeByNo(listings) {
  const seen = new Set();
  return listings.filter((listing) => {
    if (seen.has(listing.no)) return false;
    seen.add(listing.no);
    return true;
  });
}

module.exports = {
  BASE_URL,
  BOARD_ID,
  LIST_PATH,
  buildWorkingListUrl,
  buildWorkingDetailUrl,
  fetchEucKrHtml,
  loginBalletmania,
  getTodayKstDate,
  normalizePostedAtRaw,
  parseWorkingListings,
  detectWorkingDetailState,
  parseWorkingDetail,
  cleanDetailHtml,
  htmlToPlainText,
  dedupeByNo,
  cleanText,
};
