import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const working = require("../scripts/lib/balletmania-working.cjs");

export const buildWorkingDetailUrl = working.buildWorkingDetailUrl;
export const buildWorkingListUrl = working.buildWorkingListUrl;
export const detectWorkingDetailState = working.detectWorkingDetailState;
export const fetchEucKrHtml = working.fetchEucKrHtml;
export const getTodayKstDate = working.getTodayKstDate;
export const loginBalletmania = working.loginBalletmania;
export const normalizePostedAtRaw = working.normalizePostedAtRaw;
export const parseWorkingDetail = working.parseWorkingDetail;
export const parseWorkingListings = working.parseWorkingListings;
export const classifySubstitute = working.classifySubstitute;
export const computeExpiresAt = working.computeExpiresAt;
