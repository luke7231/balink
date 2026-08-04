import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const working = require("../scripts/lib/balletmania-working.cjs");

export interface WorkingListing {
  no: string;
  listSeq: string | null;
  title: string;
  author: string | null;
  authorMemberNo: string | null;
  recommendCount: number;
  viewCount: number;
  postedAtRaw: string | null;
  postedAtIso: string | null;
  isNotice: boolean;
  url: string;
}

export interface WorkingDetail {
  state: string;
  title: string | null;
  detailText: string | null;
  author: string | null;
  postedAtIso: string | null;
  postedAtRaw?: string | null;
  contactPhones: string[];
  contactEmails: string[];
  viewCount: number;
  applicantCount: number;
}

export const buildWorkingDetailUrl = working.buildWorkingDetailUrl;
export const buildWorkingListUrl = working.buildWorkingListUrl;
export const cleanDetailHtml = working.cleanDetailHtml;
export const detectWorkingDetailState = working.detectWorkingDetailState;
export const fetchEucKrHtml = working.fetchEucKrHtml;
export const getTodayKstDate = working.getTodayKstDate;
export const htmlToPlainText = working.htmlToPlainText;
export const loginBalletmania = working.loginBalletmania;
export const normalizePostedAtRaw = working.normalizePostedAtRaw;
export const parseWorkingDetail = working.parseWorkingDetail as (html: string) => WorkingDetail;
export const parseWorkingListings = working.parseWorkingListings as (
  html: string,
  options?: { todayKstDate?: string },
) => WorkingListing[];
