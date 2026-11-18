import { createHash } from "node:crypto";
import { connection } from "next/server";
import { getFreshHymns } from "@/lib/hymns-server";

export async function GET(request: Request) {
  await connection();
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  try {
    const hymns = await getFreshHymns();
    const revision = createHash("sha256").update(JSON.stringify(hymns)).digest("hex");
    const etag = `"${revision}"`;
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...headers, ETag: etag } });
    return Response.json({ schemaVersion: 1, revision, hymns }, { headers: { ...headers, ETag: etag } });
  } catch {
    return Response.json({ error: "Could not download hymns. Your existing download is safe. Please try again." }, { status: 503, headers });
  }
}
