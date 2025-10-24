import { Request, Response, NextFunction } from "express";

export function userTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers["x-user-token"] as string) || (req.cookies?.uid as string) || null;

  if (!token) {
    return res.status(400).json({ error: "Missing user token" });
  }

  (req as any).userToken = token;
  next();
}
