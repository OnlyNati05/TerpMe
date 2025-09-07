type Role = "user" | "assistant";
export type Message = { role: Role; content: string };

// User chat history (sessionId: <conversationId: message[]>)
const memoryStore = new Map<string, Map<string, Message[]>>();

// Number of turns (user + assistant pairs) to keep
const MAX_TURNS = 5;

// Get or initialize conversation
export function getConversation(sessionId: string, conversationId: string): Message[] {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, new Map());
  }

  const userConvos = memoryStore.get(sessionId)!;

  if (!userConvos.has(conversationId)) {
    userConvos.set(conversationId, []);
  }

  return userConvos.get(conversationId)!;
}

// Append new messages and enforce rolling window
export function addToConversation(sessionId: string, conversationId: string, messages: Message[]) {
  const convo = getConversation(sessionId, conversationId);
  convo.push(...messages);

  trimConversation(sessionId, conversationId);
}

function trimConversation(sessionId: string, conversationId: string) {
  const convo = getConversation(sessionId, conversationId);

  // Ensure we have complete pairs
  let trimmed: Message[] = [];

  if (convo.length > MAX_TURNS * 2) {
    trimmed = convo.slice(-MAX_TURNS * 2);
  } else {
    trimmed = convo;
  }

  const userConvos = memoryStore.get(sessionId)!;
  userConvos.set(conversationId, trimmed);
}

// Reset only one conversation
export function resetConversation(sessionId: string, conversationId: string) {
  const userConvos = memoryStore.get(sessionId);

  if (userConvos) {
    userConvos.set(conversationId, []);
  }
}

// Reset all conversations for a user
export function resetAllConversations(sessionId: string) {
  memoryStore.set(sessionId, new Map());
}

// Helper function
function getConversationsForUser(sessionId: string): Map<string, Message[]> {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, new Map());
  }

  return memoryStore.get(sessionId)!;
}
