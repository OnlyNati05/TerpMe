import { Request, Response } from "express";
import * as messageService from "../services/messages.service";

export async function createMessage(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  const { id: conversationId } = req.params as { id: string };
  const { content, role } = req.body as { content: string; role?: "user" | "assistant" };

  if (!uid) return res.status(400).json({ error: "Missing user token" });
  if (!content?.trim()) return res.status(400).json({ error: "Message content is required" });

  try {
    const msg = await messageService.createMessage({
      uid,
      conversationId,
      role: role ?? "user",
      content: content.trim(),
    });
    return res.status(201).json(msg);
  } catch (e: any) {
    return res.status(404).json({ error: e.message ?? "Not found" });
  }
}

export async function listMessages(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  const { id: conversationId } = req.params as { id: string };
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  try {
    const messages = await messageService.listMessages(uid, conversationId);
    return res.json(messages);
  } catch (e: any) {
    return res.status(404).json({ error: e.message ?? "Not found" });
  }
}
