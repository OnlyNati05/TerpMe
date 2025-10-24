import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { deleteUrlFromIndex } from "../services/indexer.service";
import {
  addPagesCrawler,
  deleteAllPagesService,
  deletePagesService,
} from "../services/page.service";
import { prisma } from "../lib/prisma";

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
 * DELETE /api/pages/bulk
 * Body options:
 *    - {urls: string[]} -> Delete only these URLs from Prisma database
 */

export async function deletePagesBulk(req: Request, res: Response) {
  try {
    const input = req.body?.urls;

    if (!input) {
      const result = await deleteAllPagesService();
      return res.status(200).json(result);
    }

    if (!Array.isArray(input)) {
      return res.status(400).json({ error: "Body must include { urls: string[] }" });
    }

    const result = await deletePagesService(input);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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

export async function addPagesBulk(req: Request, res: Response) {
  const input = req.body?.urls;
  const urls = Array.isArray(input) ? input : [];

  if (!urls.length) {
    return res.status(400).json({ error: "Body must include { urls: string[] }" });
  }

  const normalized = urls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));

  const result = await prisma.page.createMany({
    data: unique.map((url) => ({ url, status: "queued" })),
    skipDuplicates: true,
  });

  return res.status(201).json({
    received: urls.length,
    valid: normalized.length,
    unique: unique.length,
    inserted: result.count,
    skippedDuplicates: unique.length - result.count,
  });
}

export async function check(req: Request, res: Response) {
  const body = req.body as { urls?: string[] };
  const input = body?.urls;

  if (!Array.isArray(input)) {
    return res.status(400).json({ error: "urls must be an array" });
  }

  const normalized = input.map(normalizeUrl).filter((u: any): u is string => !!u);
  const urls = Array.from(new Set(normalized));

  try {
    await addPagesCrawler(urls);
  } catch (error) {
    return res.json({ error });
  }

  return res.json({
    success: "Yes",
  });
}
