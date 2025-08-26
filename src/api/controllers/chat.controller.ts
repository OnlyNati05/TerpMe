import { Request, Response } from "express";
import { runScraper } from "../services/scraper.loop.service";

export const sendChat = async (req: Request, res: Response) => {
  const { message } = req.body;

  await runScraper();

  res.status(200).json({ Info: "Success" });
};

export const getHealth = async (req: Request, res: Response) => {
  res.status(200).json({ success: "Hello this is health" });
};
