import { Request, Response } from "express";
import { ingestService } from "../services/ingest.service";

export async function ingestController(req: Request, res: Response) {
  try {
    const result = await ingestService(req.body?.urls);
    const STATUS =
      result.result.success === "false" || result.result.success === "partial" ? 400 : 200;
    return res.status(STATUS).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
