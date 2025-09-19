import { prisma } from "../lib/prisma";

export async function createMessage(opts: {
  uid: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}) {
  // Check that the conversation belongs to this user
  const convo = await prisma.conversation.findFirst({
    where: { id: opts.conversationId, userId: opts.uid },
    select: { id: true },
  });

  if (!convo) throw new Error("Conversation not found or not yours");

  const msg = await prisma.message.create({
    data: {
      conversationId: opts.conversationId,
      role: opts.role,
      content: opts.content,
    },
  });

  return msg;
}

export async function listMessages(uid: string, conversationId: string) {
  //Check owner
  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: uid },
    select: { id: true },
  });
  if (!convo) throw new Error("Conversation not found or not yours");

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}
