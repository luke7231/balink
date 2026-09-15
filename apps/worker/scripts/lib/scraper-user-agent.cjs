// Do not put "crawler" in this string. Balletmania Apache 302s those UAs to
// /error.html and that Location redirects to itself until fetch throws
// "redirect count exceeded".
const SCRAPER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const SCRAPER_BROWSER_HEADERS = {
  "user-agent": SCRAPER_USER_AGENT,
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

module.exports = { SCRAPER_USER_AGENT, SCRAPER_BROWSER_HEADERS };
