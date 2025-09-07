import OpenAI from "openai";
import { OPENAI_API_KEY, OPENAI_CHAT_MODEL } from "../config/env";

// New openai client
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const CHAT_MODEL = OPENAI_CHAT_MODEL;
