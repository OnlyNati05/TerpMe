import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PORT } from "./config/env";
import chatRouter from "./routes/chat";
import pageRouter from "./routes/page";
import ingestRouter from "./routes/ingest";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/pages", pageRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/chat", chatRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

/**
 * Todo:
 * BACKEND:
 *  - Crawler for pages (only scrape 2025 pages)
 *      - Cron Job for scrape and find pages
 *      - Set certain pages to rescrape daily (news, updates, etc.)
 *  - Deal with removed pages/links
 *  - Add to DB
 *  - Add input and output limit
 *  - Better prompt
 *      - Always include resource link
 * FRONTEND:
 *  - streaming
 *  - UI
 *  - Admin page
 *  - Main page
 *  - Chat page
 *  - Settings page
 *  - Tokens
 * FUTURE:
 *  - Add personalization for user
 *  - Scrape rate my professor
 *
 *
 * */
