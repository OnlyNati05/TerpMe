import { scrapeCheerio } from "./scrapeCheerio.service";
import { scrapePuppeteer } from "./scrapePuppeteer.service";

// Unified scraper: tries Cheerio first, falls back to Puppeteer
export async function scrapeUrl(url: string) {
  const cheerioChunks = await scrapeCheerio(url);

  // If Cheerio found enough words, use it
  const wordCount = cheerioChunks.reduce((sum, c) => sum + c.content.split(" ").length, 0);

  if (wordCount > 50) {
    return cheerioChunks;
  }

  return await scrapePuppeteer(url);
}
