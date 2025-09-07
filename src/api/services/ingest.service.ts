import { PrismaClient } from "@prisma/client";
import { indexChunks, Chunk } from "../services/indexer.service";
import { scrapeUrl } from "./scraping.service";
import { normalizeUrl } from "../controllers/page.controller";

const prisma = new PrismaClient();

export async function ingestUrls(urls: string[]) {
  const report: Array<{
    url: string;
    action: "indexed" | "skipped" | "error";
    reason?: string;
    chunks?: number;
  }> = [];
  let success = "true";

  for (const url of urls) {
    try {
      // Check DB first
      const existing = await prisma.page.findUnique({ where: { url } });

      if (existing) {
        await prisma.page.update({
          where: { url },
          data: { status: "skipped", lastIndexAt: new Date() },
        });
        report.push({ url, action: "skipped", reason: "already indexed" });
        continue; // no scrape needed
      }

      // Only scrape if not already indexed
      const result = await scrapeUrl(url);

      if (typeof result === "string") {
        success = "partial";
        report.push({ url, action: "error", reason: result });
        await prisma.page.create({
          data: { url, status: "error", lastIndexAt: new Date() },
        });
        continue;
      }

      const chunks = result as Chunk[];
      if (!chunks.length) {
        report.push({ url, action: "error", reason: "no chunks scraped", chunks: 0 });
        await prisma.page.create({
          data: { url, status: "skipped", lastIndexAt: new Date(), chunkCount: 0 },
        });
        continue;
      }

      // Index new page
      const { upserted } = await indexChunks(chunks);
      await prisma.page.create({
        data: {
          url,
          chunkCount: chunks.length,
          lastIndexAt: new Date(),
          status: "indexed",
        },
      });

      report.push({ url, action: "indexed", chunks: upserted });
    } catch (error: any) {
      success = "false";
      report.push({ url, action: "error", reason: error?.message ?? String(error) });

      await prisma.page.upsert({
        where: { url },
        update: { status: "error", lastIndexAt: new Date() },
        create: { url, status: "error", lastIndexAt: new Date() },
      });
    }
  }

  return { success, report };
}

// Decide what URLs to ingest (specific array or all from DB).
export async function ingestService(urls?: string[]) {
  let finalUrls: string[];

  if (!urls) {
    const pages = await prisma.page.findMany({ select: { url: true } });
    finalUrls = pages.map((p) => p.url);
    if (!finalUrls.length) throw new Error("No URLs in database to ingest");
  } else {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("URLs must be a non-empty array of strings");
    }
    finalUrls = urls;
  }

  const normalized = finalUrls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));

  const result = await ingestUrls(unique);

  return {
    received: finalUrls.length,
    valid: normalized.length,
    unique: unique.length,
    ingested: result.report.length,
    result,
  };
}
