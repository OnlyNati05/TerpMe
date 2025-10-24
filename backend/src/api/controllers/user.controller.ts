import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function updateAvatar(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: "Missing avatar" });

  const updated = await prisma.avatar.upsert({
    where: { sessionId: uid },
    update: { image: avatar },
    create: { sessionId: uid, image: avatar },
  });

  return res.json({ avatar: updated.image });
}

export async function getUser(req: Request, res: Response) {
  const uid = req.cookies?.uid as string;
  if (!uid) return res.status(400).json({ error: "Missing user token" });

  const avatar = await prisma.avatar.findUnique({
    where: { sessionId: uid },
  });

  return res.json({ avatar: avatar?.image ?? "pfp/default.jpeg" });
}

export async function userLimit(req: Request, res: Response) {
  try {
    const uid = req.cookies?.uid as string;
    if (!uid) {
      return res.status(400).json({ error: "Missing user token" });
    }

    const user = await prisma.userQuota.findUnique({
      where: { userId: uid },
    });

    const limitReached = (user?.messages ?? 0) >= 20;

    return res.json({ limit: limitReached });
  } catch (error) {
    console.error("userLimit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
