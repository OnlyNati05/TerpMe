import { Router } from "express";
import { getHealth, chat } from "../controllers/chat.controller";

const chatRouter = Router();

chatRouter.post("/", chat);
chatRouter.get("/health", getHealth);

export default chatRouter;
