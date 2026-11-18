/** Public project settings only. Never use a service-role key in this module. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export async function supabaseRequest<T>(path: string, options: RequestInit & { token?: string; next?: { revalidate: number; tags: string[] } } = {}): Promise<T> {
  if (!isSupabaseConfigured) throw new Error("The hymn database is not configured.");
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("apikey", supabaseKey);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init, headers, signal: init.signal ?? AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Do not expose URLs, tokens, or raw backend messages to logs or users.
    throw new Error(response.status === 401 || response.status === 403
      ? "Database access was denied. Check your account permissions."
      : "The hymn database is temporarily unavailable. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function readProfileRole(uid: string, token: string) {
  const query = new URLSearchParams({ select: "role", auth_user_id: `eq.${uid}`, limit: "1" });
  const rows = await supabaseRequest<{ role: string }[]>(`profiles?${query}`, { token, cache: "no-store" });
  return rows[0]?.role;
}
