import { PrismaClient } from "@prisma/client";
import { normalizeUrl } from "../controllers/page.controller";
import { deleteUrlsFromIndex } from "../services/indexer.service";

const prisma = new PrismaClient();

/**
 * Delete pages by URL (used by both API + crawler).
 */
export async function deletePagesService(urls: string[]) {
  if (!urls.length) throw new Error("No URLs provided");

  const normalized = urls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));
  if (!unique.length) throw new Error("No valid URLs provided");

  // Delete from Qdrant index
  const result = await deleteUrlsFromIndex(unique);
  if (!result.ok) {
    await prisma.page.updateMany({
      where: { url: { in: unique } },
      data: { status: "delete_pending" },
    });
    return {
      received: urls.length,
      valid: normalized.length,
      unique: unique.length,
      deletedFromDb: 0,
      indexerError: result.error,
    };
  }

  // Delete from DB
  const dbResult = await prisma.page.deleteMany({ where: { url: { in: unique } } });

  return {
    received: urls.length,
    valid: normalized.length,
    unique: unique.length,
    deletedFromDb: dbResult.count,
    indexer: result,
  };
}

/**
 * Add pages with cap + rotate-in logic (crawler only).
 */
export async function addPagesCrawler(urls: string[], domainCap = 1000, keep = 100) {
  if (!urls.length) throw new Error("No URLs provided");

  const normalized = urls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));
  if (!unique.length) throw new Error("No valid URLs provided");

  const domain = new URL(unique[0]).hostname;

  // Count existing
  const existingCount = await prisma.page.count({ where: { url: { contains: domain } } });

  // Rotate if needed
  if (existingCount + unique.length > domainCap) {
    const overBy = existingCount + unique.length - domainCap;
    const oldPages = await prisma.page.findMany({
      where: { url: { contains: domain } },
      orderBy: { createdAt: "asc" },
      take: overBy,
      select: { url: true },
    });

    if (oldPages.length) {
      const oldUrls = oldPages.map((p) => p.url);
      await deletePagesService(oldUrls);
    }
  }

  // Insert
  const result = await prisma.page.createMany({
    data: unique.map((url) => ({ url, status: "queued" })),
    skipDuplicates: true,
  });

  // Trim down to newest `keep`
  const extraPages = await prisma.page.findMany({
    where: { url: { contains: domain } },
    orderBy: { createdAt: "desc" },
    skip: keep,
    select: { url: true },
  });

  let trimmed = 0;
  if (extraPages.length) {
    const extraUrls = extraPages.map((p) => p.url);
    await deletePagesService(extraUrls);
    trimmed = extraUrls.length;
  }

  return {
    received: urls.length,
    valid: normalized.length,
    unique: unique.length,
    inserted: result.count,
    rotated: existingCount + unique.length > domainCap,
    trimmed,
  };
}
