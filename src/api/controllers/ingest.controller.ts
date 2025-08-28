import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ingestUrls } from "../services/ingest.service";
import { normalizeUrl } from "./page.controller";

const prisma = new PrismaClient();

/**
 * POST /api/ingest
 * Body options:
 *    - {urls: string[]} -> ingest only these URLs
 *    - {}               -> ingest ALL URLs currently in Prisma database
 */

export async function ingestController(req: Request, res: Response) {
  let urls: string[];

  if (req.body?.urls === undefined) {
    // If no urls proided, scrape and all to Prisma database
    const pages = await prisma.page.findMany({ select: { url: true } });
    urls = pages.map((p) => p.url);
    if (urls.length === 0) {
      res.status(400).json({ error: "No URLs in database to ingest" });
    }
  } else if (
    Array.isArray(req.body.urls) &&
    req.body.urls.every((u: unknown) => typeof u === "string")
  ) {
    // If valid array of strings, use only those URLs
    urls = req.body.urls;
    if (urls?.length === 0) {
      return res.status(400).json({ error: "Body must be non-empty array of strings" });
    }
  } else {
    // If invalid type, reject
    return res.status(400).json({ error: "Body must include { urls: string[] }" });
  }

  // Dedupe and normalize
  const normalized = urls.map(normalizeUrl).filter((u): u is string => !!u);
  const unique = Array.from(new Set(normalized));

  const result = await ingestUrls(urls);
  return res.status(200).json({
    received: urls.length,
    valid: normalized.length,
    unique: unique.length,
    ingested: result.report.length,
    result,
  });
}
