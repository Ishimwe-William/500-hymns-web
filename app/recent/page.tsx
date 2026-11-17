import RecentPage from "@/components/recent-page";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";

export default async function Page() {
  const hymns = toSummaries(await getHymns());
  return <RecentPage hymns={hymns} />;
}
