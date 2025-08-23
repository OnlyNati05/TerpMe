import { PrismaClient } from "@prisma/client";
import { scrapeUMD } from "./scraping.service";

const prisma = new PrismaClient();

export async function runScraper() {
  const pages = await prisma.page.findMany();

  const scrapedResults: { url: string; content: string }[] = [];

  for (const page of pages) {
    try {
      const dbMetadata = await scrapeUMD(page.url);

      if (typeof dbMetadata === "string") {
        console.log(`Scraping failed for ${dbMetadata}`);
        continue;
      }

      scrapedResults.push(...dbMetadata);

      await prisma.page.update({
        where: { id: page.id },
        data: { lastScraped: new Date(), status: "success" },
      });
    } catch (err) {
      console.log(`Failed to scrape ${page.url}:`, err);

      await prisma.page.update({
        where: { id: page.id },
        data: { status: "error" },
      });
    }
  }

  console.log(scrapedResults);
}

runScraper().finally(() => prisma.$disconnect());

/**
import { PrismaClient } from "@prisma/client";
import { scrapeUMD } from "./scraping.service"; // your existing scraper

const prisma = new PrismaClient();

async function runScraper() {
  // Grab all pages you seeded into the DB
  const pages = await prisma.page.findMany();

  // Temporary container for scraped results
  const scrapedResults: { url: string; content: string }[] = [];

  for (const page of pages) {
    try {
      // scrapeUMD should return an array of { url, content } objects
      const dbMetadata = await scrapeUMD(page.url);

      // Dump them into the results array
      scrapedResults.push(...dbMetadata);

      // Update page status in DB
      await prisma.page.update({
        where: { id: page.id },
        data: { lastScraped: new Date(), status: "success" },
      });

    } catch (err) {
      console.error(`❌ Failed to scrape ${page.url}:`, err);

      // Mark this page as errored in DB
      await prisma.page.update({
        where: { id: page.id },
        data: { status: "error" },
      });
    }
  }

  // Output all scraped results to inspect
  console.log(scrapedResults);
}

runScraper().finally(() => prisma.$disconnect());

*/
