import { ingestService } from "../src/api/services/ingest.service";
import { runCrawlers } from "./crawlerCron";

export async function runPipeline() {
  try {
    console.log("Starting pipeline job...");

    // Step 1: Crawl sites (adds new URLs)
    console.log("Crawling sites...");
    await runCrawlers();
    console.log("Crawling finished.");

    //Ingest all URLs (scrape + index)
    console.log("Ingesting pages...");
    await ingestService(); // no args = ingest all
    console.log("Ingest finished");

    console.log("Pipeline job completed successfully.");
  } catch (err) {
    console.error("Pipeline job failed: ", err);
  }
}

// Run directly (local or Lambda entrypoint)
if (require.main === module) {
  runPipeline().then(() => process.exit(0));
}
