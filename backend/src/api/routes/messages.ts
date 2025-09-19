import { Router } from "express";
import { createMessage, listMessages } from "../controllers/messages.controller";

const router = Router({ mergeParams: true });

// GET /conversations/:id/messages
router.get("/", listMessages);

// POST /conversations/:id/messages
router.post("/", createMessage);

export default router;
