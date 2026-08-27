/** Auth.js session payload → Amplitude user_id. Only `User.id` is used. */
export function readAuthUserId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const user = (payload as { user?: unknown }).user;
  if (!user || typeof user !== "object") return undefined;
  const id = (user as { id?: unknown }).id;
  if (typeof id !== "string") return undefined;
  const trimmed = id.trim();
  return trimmed || undefined;
}
