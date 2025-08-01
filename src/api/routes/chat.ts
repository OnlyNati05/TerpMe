import { Router } from "express";
import { getHealth, sendChat } from "../controllers/chat.controller";

const chatRouter = Router();

chatRouter.post("/", sendChat);
chatRouter.get("/health", getHealth);

export default chatRouter;
