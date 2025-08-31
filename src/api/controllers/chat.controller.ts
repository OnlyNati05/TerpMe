import { Request, Response } from "express";
import { askQuestion } from "../services/qa.service";

/**
 * POST /api/chat { question, sessionId?, conversationId? }
 * Body:
 *    - {question: string}
 */

export async function chat(req: Request, res: Response) {
  const raw = req.body?.question;
  const sessionId = req.body?.sessionId ?? "defaultUser";
  const conversationId = req.body?.conversationId ?? "defaultConversation";
  const k = Number(req.body.k) || 5;

  if (typeof raw !== "string" || !raw.trim()) {
    return res.status(400).json({ error: "Body must include { question: string }" });
  }

  try {
    const result = await askQuestion(raw.trim(), { k, sessionId, conversationId });
    return res.status(200).json(result);
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: "Failed to generate answer", details: err?.message ?? String(err) });
  }
}

// Health check
export const getHealth = async (req: Request, res: Response) => {
  res.status(200).json({ success: true });
};
