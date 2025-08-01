import { Request, Response } from "express";
import { scrapeUMD } from "../services/scraping.service";

export const sendChat = async (req: Request, res: Response) => {
  const { message } = req.body;

  const scrapedText = await scrapeUMD();

  res.status(200).json({ Info: `${scrapedText}` });
};

export const getHealth = async (req: Request, res: Response) => {
  res.status(200).json({ success: "Hello this is health" });
};
