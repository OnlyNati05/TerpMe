import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { indexChunks, reindexUrl, Chunk } from "../services/indexer.service";
import { scrapeUrl } from "./scraping.service";

const prisma = new PrismaClient();

function hashChunks(chunks: Chunk[]): string {
  const joined = chunks.map((c) => c.content).join("\n\n");
  return crypto.createHash("sha256").update(joined, "utf8").digest("hex");
}

export async function ingestUrls(urls: string[]) {
  const report: Array<{
    url: string;
    action: "indexed" | "reindexed" | "skipped" | "error" | "unchanged";
    reason?: string;
    chunks?: number;
  }> = [];

  for (const url of urls) {
    try {
      const result = await scrapeUrl(url);

      // If scraper returns an error message
      if (typeof result === "string") {
        report.push({ url, action: "error", reason: result });
        await prisma.page.upsert({
          where: { url },
          update: { status: "error", lastIndexAt: new Date() },
          create: { url, status: "error", lastIndexAt: new Date() },
        });
        continue;
      }

      const chunks = result as Chunk[];

      // No content was scraped
      if (!chunks.length) {
        report.push({ url, action: "skipped", reason: "no chunks scraped", chunks: 0 });
        await prisma.page.upsert({
          where: { url },
          update: { status: "skipped", lastIndexAt: new Date(), chunkCount: 0 },
          create: { url, status: "skipped", lastIndexAt: new Date(), chunkCount: 0 },
        });
        continue;
      }

      const newHash = hashChunks(chunks);
      const existing = await prisma.page.findUnique({ where: { url } });

      //If first time seeing URL -> index
      if (!existing) {
        const { upserted } = await indexChunks(chunks);
        await prisma.page.upsert({
          where: { url },
          update: {
            contentHash: newHash,
            chunkCount: chunks.length,
            lastIndexAt: new Date(),
            status: "indexed",
          },
          create: {
            url,
            contentHash: newHash,
            chunkCount: chunks.length,
            lastIndexAt: new Date(),
            status: "indexed",
          },
        });

        report.push({ url, action: "indexed", chunks: upserted });
        continue;
      }

      // If content is unchanged -> skip
      if (existing.contentHash === newHash) {
        await prisma.page.update({
          where: { url },
          data: { status: "unchanged", lastIndexAt: new Date() },
        });
        report.push({
          url,
          action: "unchanged",
          reason: "content unchanged",
          chunks: chunks.length,
        });
        continue;
      }

      // If content changed -> update/reindex
      const { upserted } = await reindexUrl(url, chunks);
      await prisma.page.update({
        where: { url },
        data: {
          contentHash: newHash,
          chunkCount: chunks.length,
          lastIndexAt: new Date(),
          status: "reindexed",
        },
      });
      report.push({ url, action: "reindexed", chunks: upserted });
    } catch (error: any) {
      report.push({ url, action: "error", reason: error?.message ?? String(error) });

      await prisma.page.upsert({
        where: { url },
        update: { status: "error", lastIndexAt: new Date() },
        create: { url, status: "error", lastIndexAt: new Date() },
      });
    }
  }

  return { success: true, report };
}
