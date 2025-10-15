import { Request, Response } from "express";
import * as conversationService from "../services/conversation.service";
import { prisma } from "../lib/prisma";

// GET /conversations
// Only gets all user conversations
export async function getConversations(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const conversations = await conversationService.getUserConversations(uid);
  return res.json(conversations);
}

// GET /conversations/:id
// Gets conversation + messages
export async function getConversationById(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  const { id } = req.params;

  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const conversation = await conversationService.getConversationById(uid, id);
  if (!conversation) return res.status(404).json({ error: "Not found" });

  return res.json(conversation);
}

// POST /conversations
export async function createConversation(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });
  const { initialMessage } = req.body;

  try {
    const conversation = await conversationService.createConversation(uid, initialMessage);
    return res.status(201).json(conversation);
  } catch (err: any) {
    console.error("Failed to create conversation:", err);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
}

// PATCH /conversations/:id
export async function renameConversation(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  const { id } = req.params;
  const { title } = req.body;

  if (!uid) return res.status(400).json({ error: "Missing user token" });
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title must be a string" });
  }

  try {
    const convo = await prisma.conversation.updateMany({
      where: { id, userId: uid },
      data: { title },
    });

    if (convo.count === 0) {
      return res.status(404).json({ error: "Conversation not found or not yours" });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /conversations/:id
export async function deleteConversation(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  const { id } = req.params;

  if (!uid) return res.status(400).json({ error: "Missing user token" });

  await conversationService.deleteConversation(uid, id);
  return res.status(204).send();
}
