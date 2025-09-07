import { XMLParser } from "fast-xml-parser";
import { PrismaClient } from "@prisma/client";
import { addPagesCrawler } from "../services/page.service";

const parser = new XMLParser();
const prisma = new PrismaClient();

// Utility: sleep for X ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Crawl today.umd.edu ----
export async function crawlTodayUMD() {
  const sitemapIndex = "https://today.umd.edu/sitemap.xml";
  const res = await fetch(sitemapIndex);
  const xml = await res.text();
  const data = parser.parse(xml);

  const urls: string[] = [];

  for (const sm of data.sitemapindex.sitemap) {
    if (!sm.loc.includes("p1.xml")) continue;

    const childRes = await fetch(sm.loc);
    const childXml = await childRes.text();
    const childData = parser.parse(childXml);

    if (!childData.urlset?.url) continue;

    // First 100 entries (descending order)
    for (const entry of childData.urlset.url.slice(0, 100)) {
      if (entry.lastmod?.startsWith("2025")) {
        urls.push(entry.loc);
      }
    }

    // Delay to avoid hitting server too fast
    await sleep(500);
  }

  if (urls.length) {
    await addPagesCrawler(urls);
  }
}

// ---- Crawl dbknews.com ----
export async function crawlDbkNews() {
  const sitemapUrl = "https://dbknews.com/sitemap.xml";
  const res = await fetch(sitemapUrl);
  const xml = await res.text();
  const data = parser.parse(xml);

  const urls: string[] = [];

  if (data.urlset?.url) {
    for (const entry of data.urlset.url.slice(0, 100)) {
      if (entry.lastmod?.startsWith("2025")) {
        urls.push(entry.loc);
      }
    }
  }

  if (urls.length) {
    await addPagesCrawler(urls);
  }
}

// ---- Crawl umterps.com ----
export async function crawlUmterps() {
  const sitemapIndex = "https://umterps.com/sitemap.xml";
  const res = await fetch(sitemapIndex);
  const xml = await res.text();
  const data = parser.parse(xml);

  const skipUmterps = [
    "sitemap_misc_1.xml",
    "sitemap_document_1.xml",
    "sitemap_staff_1.xml",
    "sitemap_coach_1.xml",
    "sitemap_player_1.xml",
    "sitemap_roster_1.xml",
  ];

  const urls: string[] = [];

  for (const sm of data.sitemapindex.sitemap) {
    const loc = sm.loc as string;
    if (skipUmterps.some((skip) => loc.includes(skip))) {
      continue;
    }

    const childRes = await fetch(loc);
    const childXml = await childRes.text();
    const childData = parser.parse(childXml);

    if (childData.urlset?.url) {
      // Only grab the last 300 entries
      const recent = childData.urlset.url.slice(-300);

      for (const entry of recent) {
        if (entry.loc && entry.loc.includes("/2025/")) {
          urls.push(entry.loc);
        }
      }
    }

    // Delay to avoid hammering
    await sleep(500);
  }

  if (urls.length) {
    await addPagesCrawler(urls);
  }
}

// ---- Config + runner ----
const sites = [
  { domain: "today.umd.edu", crawler: crawlTodayUMD },
  { domain: "dbknews.com", crawler: crawlDbkNews },
  { domain: "umterps.com", crawler: crawlUmterps },
];

export async function runCrawlers() {
  for (const site of sites) {
    try {
      console.log(`Starting crawl for ${site.domain}`);
      await site.crawler();
      console.log(`Finished crawl for ${site.domain}`);
    } catch (err) {
      console.error(`Error crawling ${site.domain}:`, err);
    }
  }
}

// Run directly
if (require.main === module) {
  runCrawlers().then(() => {
    console.log("All crawlers finished.");
    process.exit(0);
  });
}
