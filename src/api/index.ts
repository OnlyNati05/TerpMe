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
 * TODO:
 * add more pages to db
 * Add input and output limit
 * better prompt
 * streaming
 * frontend
 * */
