import { scrapeCheerio } from "./scrapeCheerio.service";

export async function scrapeUrl(url: string) {
  const cheerioChunks = await scrapeCheerio(url);
  return cheerioChunks;
}
