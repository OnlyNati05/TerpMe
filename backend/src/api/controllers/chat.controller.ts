import { Request, Response } from "express";
import { askQuestion } from "../services/qa.service";
import { prisma } from "../lib/prisma";
import { generateConversationTitle } from "../utils/titleGenerator";

/**
 * POST /api/chat { question, sessionId?, conversationId? }
 * Body:
 *    - {question: string}
 */

const DAILY_LIMIT = 20;

export async function chat(req: Request, res: Response) {
  const raw = req.body?.question;
  const uid = req.cookies?.uid as string;
  let conversationId = req.params.conversationId || req.body.conversationId;
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
      const title = await generateConversationTitle(raw.trim());
      const convo = await prisma.conversation.create({
        data: {
          userId: uid,
          title,
        },
      });
      conversationId = convo.id;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullAnswer = "";

    const result = await askQuestion(raw.trim(), { uid, conversationId }, k, (delta) => {
      fullAnswer += delta;

      res.write(`data: ${delta.replace(/\n/g, "\ndata: ")}\n\n`);
    });
    const sources = result.sources;
    const hitCount = result.hitCount;

    res.write(
      `data: ${JSON.stringify({
        type: "metadata",
        sources,
        hitCount,
      })}\n\n`
    );

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: "Failed to generate answer" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

// Health check
export const getHealth = async (req: Request, res: Response) => {
  res.status(200).json({ success: true });
};
