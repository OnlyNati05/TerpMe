import type { ChatStatus as BaseChatStatus } from "ai";

export type ChatStatus = BaseChatStatus | "submitted" | "streaming" | "idle";
