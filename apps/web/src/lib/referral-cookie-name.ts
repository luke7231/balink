export const INVITE_REF_COOKIE = "balink.invite-ref";
/** Set while post-signup invite prompt is still open. */
export const CLAIM_INVITE_COOKIE = "balink.claim-invite";
/** Set once the invite prompt is finished (skip, claim, or leave). Survives re-login. */
export const CLAIM_INVITE_DONE_COOKIE = "balink.claim-invite-done";
/** ~13 months — longer than a typical reinstall cycle for this prompt. */
export const CLAIM_INVITE_DONE_MAX_AGE_SEC = 400 * 24 * 60 * 60;
