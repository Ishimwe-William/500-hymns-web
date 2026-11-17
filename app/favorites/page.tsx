import FavoritesPage from "@/components/favorites-page";
import { getHymns } from "@/lib/hymns-server";
import { toSummaries } from "@/lib/hymns";

export default async function Page() {
  const hymns = toSummaries(await getHymns());
  return <FavoritesPage hymns={hymns} />;
}
