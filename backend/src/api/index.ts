import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { FRONTEND_URL, PORT } from "./config/env";
import chatRouter from "./routes/chat";
import pageRouter from "./routes/page";
import ingestRouter from "./routes/ingest";
import conversationRoutes from "./routes/conversations";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/pages", pageRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/chat", chatRouter);
app.use("/api/conversations", conversationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
