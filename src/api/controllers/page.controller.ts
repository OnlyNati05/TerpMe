import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { deleteUrlFromIndex, deleteUrlsFromIndex } from "../services/indexer.service";

const prisma = new PrismaClient();

/**
 * POST /api/pages
 * Body options:
 *    - {urls: string[]} -> Add only these URLs to Prisma database
 */

// Normalize and validate a URL (remove hash, trailing slash, enforce http/https)
export function normalizeUrl(u: string): string | null {
  try {
    const url = new URL(String(u).trim());
    if (!/^https?:$/.test(url.protocol)) return null;

    // Drop hash fragments
    url.hash = "";

    // Remove trailing slashes except root "/"
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      while (url.pathname.endsWith("/")) {
        url.pathname = url.pathname.slice(0, -1);
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * POST /api/pages
 * Body options:
 *    - {url: string} -> Add only these URLs to Prisma database
 */

// Add a single page to Prisma database
export async function addPage(req: Request, res: Response) {
  const norm = normalizeUrl(req.body?.url);
  if (!norm) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // Upsert: if URL already exists, do nothing; else insert with status=queued
  await prisma.page.upsert({
    where: { url: norm },
    update: {},
    create: { url: norm, status: "queued" },
  });

  return res.status(201).json({ inserted: 1, url: norm });
}

// Add multiple pages at once
export async function addPagesBulk(req: Request, res: Response) {
  const input = req.body?.urls;
  const urls = Array.isArray(input) ? input : [];

  if (!urls.length) {
    return res.status(400).json({ error: "Body must include {urls: string[]}" });
  }

  const normalized = urls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));

  // Normalize, drop invalids, and deduplicate
  const result = await prisma.page.createMany({
    data: unique.map((url) => ({ url, status: "queued" })),
    skipDuplicates: true,
  });

  // Return summary of what happened
  return res.status(201).json({
    recieved: urls.length,
    valid: normalized.length,
    unique: unique.length,
    inserted: result.count,
    skippedDuplicates: unique.length - result.count,
  });
}

/**
 * DELETE /api/pages
 * Body options:
 *    - {url: string} -> Delete only this URL from Prisma database
 */

export async function deletePage(req: Request, res: Response) {
  const input = req.body?.url;

  if (typeof input !== "string") {
    return res.status(400).json({ error: "Body must include { url: string } " });
  }

  // Normalize URL
  const url = normalizeUrl(input);

  if (!url) {
    return res.status(400).json({ error: "Invalid Url" });
  }

  //Delete from Qdrant DB
  const result = await deleteUrlFromIndex(url);

  if (!result.ok) {
    await prisma.page.updateMany({ where: { url }, data: { status: "delete_pending" } });
    return res
      .status(400)
      .json({ error: "Failed to delete vector in index", details: result.error });
  }

  // Delete from Prisma DB
  const dbResult = await prisma.page.deleteMany({ where: { url } });
  return res.status(200).json({
    received: 1,
    deletedFromDb: dbResult.count,
    indexer: result,
  });
}

/**
 * DELETE /api/pages
 * Body options:
 *    - {urls: string[]} -> Delete only these URLs from Prisma database
 */

export async function deletePagesBulk(req: Request, res: Response) {
  const input = req.body?.urls;

  // Validate input
  if (!Array.isArray(input) || !input.every((u) => typeof u === "string")) {
    return res.status(400).json({ error: "Body must include { urls: string[] }" });
  }

  // Normalize and dedupe
  const normalized = input.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));
  if (!unique.length) {
    return res.status(400).json({ error: "No valid URLs provided" });
  }

  // Delete from Qdrant DB
  const result = await deleteUrlsFromIndex(unique);

  if (!result.ok) {
    await prisma.page.updateMany({
      where: { url: { in: unique } },
      data: { status: "delete_pending" },
    });
    return res
      .status(502)
      .json({ error: "Failed to delete vectors in index", details: result.error });
  }

  // Delete from Prisma DB
  const dbResult = await prisma.page.deleteMany({ where: { url: { in: unique } } });
  return res.status(200).json({
    received: input.length,
    valid: normalized.length,
    unique: unique.length,
    deletedFromDb: dbResult.count,
    indexer: result,
  });
}
