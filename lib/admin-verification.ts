/** Verify the Firebase session and current database role without trusting client role flags. */
export async function verifyAdminIdToken(idToken: string) {
  if (typeof idToken !== "string" || !idToken || idToken.length > 20000) throw new Error("Sign in again to refresh the hymn.");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error("Account verification is unavailable.");

  const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!identityResponse.ok) throw new Error("Your session could not be verified. Please sign in again.");
  const identity = await identityResponse.json();
  const user = identity.users?.[0];
  if (!user || typeof user.localId !== "string" || !user.localId || user.disabled) throw new Error("Your session could not be verified. Please sign in again.");

  const roleResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(user.localId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!roleResponse.ok) throw new Error("Administrator access could not be verified.");
  const profile = await roleResponse.json();
  if (profile.fields?.role?.stringValue !== "admin") throw new Error("Administrator access is required.");
  return { uid: user.localId };
}
