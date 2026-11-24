import { getHymnById } from "@/lib/hymns-server";
import { createShareImage } from "@/lib/share-image";
export const alt = "Kinyarwanda Seventh-day Adventist Church hymn lyrics in Rwanda - Indirimbo Zo Guhimbaza Imana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createShareImage(await getHymnById(id));
}
