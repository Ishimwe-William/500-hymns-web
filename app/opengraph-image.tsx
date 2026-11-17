import { createShareImage } from "@/lib/share-image";
export const alt = "Indirimbo Zo Guhimbaza Imana - 500 Kinyarwanda Hymns";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() { return createShareImage(); }
