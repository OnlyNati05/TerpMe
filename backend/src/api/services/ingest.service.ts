import { indexChunks, Chunk } from "../services/indexer.service";
import { scrapeUrl } from "./scraping.service";
import { normalizeUrl } from "../controllers/page.controller";
import { prisma } from "../lib/prisma";

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
        if (["indexed", "skipped"].includes(existing.status!)) {
          await prisma.page.update({
            where: { url },
            data: { lastIndexAt: new Date() },
          });
          report.push({ url, action: "skipped", reason: `already ${existing.status}` });
          continue;
        }
      }

      // Only scrape if not already indexed
      const result = await scrapeUrl(url);

      if (!result) {
        success = "partial";
        report.push({ url, action: "error", reason: result });
        await prisma.page.upsert({
          where: { url },
          update: { status: "skipped", lastIndexAt: new Date(), chunkCount: 0 },
          create: { url, status: "skipped", lastIndexAt: new Date(), chunkCount: 0 },
        });
        continue;
      }

      const chunks = result as Chunk[];

      // Index new page
      const { upserted } = await indexChunks(chunks);
      await prisma.page.upsert({
        where: { url },
        update: {
          chunkCount: chunks.length,
          lastIndexAt: new Date(),
          status: "indexed",
        },
        create: {
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
