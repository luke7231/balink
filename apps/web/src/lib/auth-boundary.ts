import { revalidatePath } from "next/cache";
import { AUTH_BOUNDARY_PATHS } from "@/lib/auth-boundary-paths";

/**
 * Drop Next.js router/RSC cache for auth-sensitive tab roots.
 * Call from server actions right before/after session create or destroy.
 */
export function revalidateAuthBoundary(): void {
  for (const path of AUTH_BOUNDARY_PATHS) {
    revalidatePath(path);
  }
}
