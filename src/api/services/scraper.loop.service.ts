import { PrismaClient } from "@prisma/client";
import { scrapeUMD } from "./scraping.service";
import { randomDelay } from "../utils/delay";
import { indexChunks } from "./indexer.service";

const prisma = new PrismaClient();

export async function runScraper() {
  const pages = await prisma.page.findMany();

  // Loop through each url from the database
  for (const page of pages) {
    try {
      const chunks = await scrapeUMD(page.url);

      // If scrapeUMD returns an error string print it here
      if (typeof chunks === "string") {
        console.log(`Scraping failed for ${page.url}`);
        await prisma.page.update({
          where: { id: page.id },
          data: { status: "error", lastScraped: new Date() },
        });
        continue;
      }

      // If there are no chunks skip this page
      if (!chunks.length) {
        console.log(`No chunks for page ${page.url}, skipping index`);
        await prisma.page.update({
          where: { id: page.id },
          data: { status: "skipped", lastScraped: new Date() },
        });
        await randomDelay();
        continue;
      }

      // Index with the full batch of chunks
      await indexChunks(chunks);

      // Update last scraped and status in database
      await prisma.page.update({
        where: { id: page.id },
        data: { lastScraped: new Date(), status: "success" },
      });

      // Delay the next scrape from 2-5 seconds
      await randomDelay();
    } catch (err) {
      console.log(`Failed to scrape ${page.url}:`, err);

      await prisma.page.update({
        where: { id: page.id },
        data: { status: "error" },
      });
    }
  }
}
