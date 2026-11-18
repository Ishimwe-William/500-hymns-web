"use server";

import { updateTag, revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { HYMNS_CACHE_TAG } from "@/lib/cache-tags";
import { verifyAdminAccessToken } from "@/lib/admin-verification";

export async function refreshHymnsAfterSave(accessToken: string) {
  try {
    await verifyAdminAccessToken(accessToken);
    // Expire immediately, so a read following a save cannot reuse old lyrics.
    updateTag(HYMNS_CACHE_TAG);
    // The shared layout also supplies hymn summaries to search and navigation.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false };
  }
}
