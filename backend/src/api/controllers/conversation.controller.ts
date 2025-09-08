import { Request, Response } from "express";
import * as conversationService from "../services/conversation.service";

// GET /conversations
export async function getConversations(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const conversations = await conversationService.getUserConversations(uid);
  return res.json(conversations);
}

// POST /conversations
export async function getConversationById(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  const { id } = req.params;

  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const conversation = await conversationService.getConversationById(uid, id);
  if (!conversation) return res.status(404).json({ error: "Not found" });

  return res.json(conversation);
}

// POST /conversations
export async function createConversation(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const conversation = await conversationService.createConversation(uid);
  return res.status(201).json(conversation);
}

// DELETE /conversations/:id
export async function deleteConversation(req: Request, res: Response) {
  const uid = req.headers["x-user-token"] as string;
  const { id } = req.params;

  if (!uid) return res.status(400).json({ error: "Missing user token" });

  await conversationService.deleteConversation(uid, id);
  return res.status(204).send(); // no content
}
