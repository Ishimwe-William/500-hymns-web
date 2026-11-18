import { readProfileRole, supabaseUrl, supabaseKey } from "@/lib/supabase";

/** Verify the Supabase session remotely, then recheck the protected DB role. */
export async function verifyAdminAccessToken(accessToken: string) {
  if (typeof accessToken !== "string" || !accessToken || accessToken.length > 20000) throw new Error("Sign in again to refresh the hymn.");
  if (!supabaseUrl || !supabaseKey) throw new Error("Account verification is unavailable.");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Your session could not be verified. Please sign in again.");
  const user = await response.json();
  if (typeof user.id !== "string" || !user.id) throw new Error("Your session could not be verified. Please sign in again.");
  if (await readProfileRole(user.id, accessToken) !== "admin") throw new Error("Administrator access is required.");
  return { uid: user.id };
}
