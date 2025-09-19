import { Request, Response } from "express";
import { askQuestion } from "../services/qa.service";
import { prisma } from "../lib/prisma";

/**
 * POST /api/chat { question, sessionId?, conversationId? }
 * Body:
 *    - {question: string}
 */

const DAILY_LIMIT = 20;

export async function chat(req: Request, res: Response) {
  const raw = req.body?.question;
  const uid = req.headers["x-user-token"] as string;
  let conversationId = req.params.conversationId;
  const k = Number(req.body.k) || 5;

  if (typeof raw !== "string" || !raw.trim()) {
    return res.status(400).json({ error: "Body must include { question: string }" });
  }

  if (!uid) {
    return res.status(400).json({ error: "Missing user token" });
  }

  // Quota check
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let quota = await prisma.userQuota.findUnique({ where: { userId: uid } });

  if (!quota || quota.date.toISOString().split("T")[0] !== today) {
    quota = await prisma.userQuota.upsert({
      where: { userId: uid },
      update: { date: new Date(), messages: 0 },
      create: { userId: uid, date: new Date(), messages: 0 },
    });
  }

  if (quota.messages >= DAILY_LIMIT) {
    return res.status(429).json({ error: "Daily message limit reached" });
  }

  await prisma.userQuota.update({
    where: { userId: uid },
    data: { messages: { increment: 1 } },
  });

  try {
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: {
          userId: uid,
          title: "New Conversation",
        },
      });
      conversationId = convo.id;
    }
    const result = await askQuestion(raw.trim(), { uid, conversationId }, k);
    return res.status(200).json({ conversationId, result });
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
