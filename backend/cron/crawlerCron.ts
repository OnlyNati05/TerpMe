import { crawlTodayUMD, crawlDbkNews, crawlUmterps } from "../src/api/services/crawler.service";

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
      console.error(`Error crawling ${site.domain}`);
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
