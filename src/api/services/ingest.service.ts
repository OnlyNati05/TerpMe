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
  let success = "true";

  for (const url of urls) {
    try {
      console.log("hey 1");
      const result = await scrapeUrl(url);

      // If scraper returns an error message
      if (typeof result === "string") {
        success = "partial";
        report.push({ url, action: "error", reason: result });
        await prisma.page.upsert({
          where: { url },
          update: { status: "error", lastIndexAt: new Date() },
          create: { url, status: "error", lastIndexAt: new Date() },
        });
        continue;
      }
      console.log("hey 2");
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
      console.log("hey 3");
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
      console.log("hey 4");
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
      console.log("hey 5");
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
