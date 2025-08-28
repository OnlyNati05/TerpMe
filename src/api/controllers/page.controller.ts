import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

// Add a single page to Prisma database
export async function addPage(req: Request, res: Response) {
  const norm = normalizeUrl(req.body?.urls);
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
