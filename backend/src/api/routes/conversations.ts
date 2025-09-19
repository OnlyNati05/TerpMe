import { Router } from "express";
import {
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  renameConversation,
} from "../controllers/conversation.controller";
import messagesRoutes from "./messages";

const router = Router();

router.get("/", getConversations);
router.get("/:id", getConversationById);
router.post("/", createConversation);
router.delete("/:id", deleteConversation);
router.patch("/:id", renameConversation);
router.use("/:id/messages", messagesRoutes);

export default router;
